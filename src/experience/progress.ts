import { checkpoints } from '../data/expedition'
import { experienceConfig } from '../config/experience'

export const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value))
export const smoothstep = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t) }

// Slow near every camp without locking, snapping, or intercepting native scrolling.
export function routeProgress(progress: number) {
  const p = clamp(progress)
  const segment = checkpoints.findIndex((point, i) => i < checkpoints.length - 1 && p <= checkpoints[i + 1].progress && p >= point.progress)
  const index = Math.max(0, segment)
  const start = checkpoints[index].progress
  const end = checkpoints[index + 1].progress
  const local = (p - start) / (end - start)
  const from = checkpoints[index].route
  const to = checkpoints[index + 1].route
  return from + (to - from) * (0.12 * local + 0.88 * smoothstep(local))
}

export function altitudeAt(progress: number) {
  const route = routeProgress(progress)
  const index = Math.max(0, checkpoints.findIndex((point, i) => i < checkpoints.length - 1 && route >= point.route && route <= checkpoints[i + 1].route))
  const from = checkpoints[index], to = checkpoints[index + 1]
  const local = (route - from.route) / (to.route - from.route)
  return Math.round(from.altitude + (to.altitude - from.altitude) * local)
}

// Arrival is spatial, never dependent on a second animation clock.
export function readableCheckpoint(progress: number) {
  return checkpoints.findIndex((camp, index) => index === 0
    ? progress <= 0
    : Math.abs(progress - camp.progress) <= experienceConfig.content.readableRange + Number.EPSILON)
}

export function activeCheckpoint(progress: number, previous = 0) {
  const arrived = readableCheckpoint(progress)
  // Latch the last arrival during travel: crossing an exit cannot select a neighbour.
  return arrived < 0 ? previous : arrived
}

export function visibilityAt(progress: number, checkpoint: number) {
  if (readableCheckpoint(progress) === checkpoint) return 1
  const camp = checkpoints[checkpoint]
  // Home has no reading plateau: native scroll immediately starts the exit.
  if (camp.id === 'base-camp') return 1 - clamp(progress / experienceConfig.home.exitRange)
  return 0
}

export type SectionUIState = { phase: 'hidden' | 'entering' | 'active' | 'exiting'; amount: number; interactive: boolean }

export function advanceSectionUI(previous: SectionUIState, arrived: boolean, delta: number, reducedMotion = false): SectionUIState {
  const amount = reducedMotion ? Number(arrived) : clamp(previous.amount + (arrived ? delta / experienceConfig.motion.sectionEnter : -delta / experienceConfig.motion.sectionExit))
  return { amount, phase: arrived ? amount === 1 ? 'active' : 'entering' : amount === 0 ? 'hidden' : 'exiting', interactive: arrived }
}

const initialSectionUI = (progress: number) => checkpoints.map((_, index) => advanceSectionUI({ phase: 'hidden', amount: 0, interactive: false }, readableCheckpoint(progress) === index, 0, true))

export type ExpeditionFrame = { progress: number; route: number; altitude: number; active: number; reveals: number[]; sections: SectionUIState[]; returningHome: boolean; delta: number; time: number; reducedMotion: boolean }
type Listener = (frame: ExpeditionFrame) => void

export class ScrollController {
  private listeners = new Set<Listener>()
  private target = 0
  private current = 0
  private raf = 0
  private lastTime = 0
  private resizeRaf = 0
  private range = 1
  private media = window.matchMedia('(prefers-reduced-motion: reduce)')
  private started = false
  private returningHome = false
  private frame: ExpeditionFrame = { progress: 0, route: 0, altitude: 1240, active: 0, reveals: checkpoints.map((_, index) => visibilityAt(0, index)), sections: initialSectionUI(0), returningHome: false, delta: 0, time: 0, reducedMotion: this.media.matches }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener)
    listener(this.frame)
    return () => { this.listeners.delete(listener) }
  }

  private measure = () => {
    this.range = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
    this.target = clamp(window.scrollY / this.range)
  }

  private onScroll = () => { this.measure() }
  private cancelReturn = () => {
    if (!this.returningHome) return
    this.returningHome = false
    window.scrollTo({ top: window.scrollY, behavior: 'instant' })
  }
  private onKey = (event: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) this.cancelReturn()
  }
  private onResize = () => {
    const progress = this.target
    cancelAnimationFrame(this.resizeRaf)
    this.resizeRaf = requestAnimationFrame(() => { this.measure(); this.goTo(progress, true) })
  }
  private onVisibility = () => {
    cancelAnimationFrame(this.raf)
    if (!document.hidden) { this.lastTime = 0; this.raf = requestAnimationFrame(this.tick) }
  }

  private tick = (time: number) => {
    const delta = this.lastTime ? Math.min((time - this.lastTime) / 1000, 0.05) : 1 / 60
    this.lastTime = time
    const reducedMotion = this.media.matches
    this.current += (this.target - this.current) * (reducedMotion ? 1 : 1 - Math.exp(-delta * experienceConfig.route.damping))
    if (Math.abs(this.target - this.current) < 0.00001) this.current = this.target
    if (this.current === 0) this.returningHome = false
    const arrival = readableCheckpoint(this.current)
    const returningHome = this.returningHome
    const sections = this.frame.sections.map((state, index) => advanceSectionUI(state, arrival === index && (!returningHome || index === 0), delta, reducedMotion))
    const reveals = sections.map((state, index) => index === 0 ? visibilityAt(this.current, 0) : smoothstep(state.amount))
    const active = returningHome ? this.frame.active : activeCheckpoint(this.current, this.frame.active)
    this.frame = { progress: this.current, route: routeProgress(this.current), altitude: altitudeAt(this.current), active, reveals, sections, returningHome, delta, time: time / 1000, reducedMotion }
    this.listeners.forEach(listener => listener(this.frame))
    this.raf = requestAnimationFrame(this.tick)
  }

  start(initialProgress: number) {
    if (this.started) return
    this.started = true
    this.measure()
    this.current = this.target = clamp(initialProgress)
    const sections = initialSectionUI(this.current)
    this.frame = { ...this.frame, progress: this.current, route: routeProgress(this.current), altitude: altitudeAt(this.current), active: activeCheckpoint(this.current), sections, reveals: sections.map((state, index) => index === 0 ? visibilityAt(this.current, 0) : state.amount) }
    window.scrollTo({ top: this.current * this.range, behavior: 'instant' })
    window.addEventListener('scroll', this.onScroll, { passive: true })
    window.addEventListener('resize', this.onResize)
    window.addEventListener('wheel', this.cancelReturn, { passive: true })
    window.addEventListener('touchstart', this.cancelReturn, { passive: true })
    window.addEventListener('keydown', this.onKey)
    document.addEventListener('visibilitychange', this.onVisibility)
    this.raf = requestAnimationFrame(this.tick)
  }

  goTo(progress: number, instant = false) {
    this.measure()
    this.returningHome = progress === 0 && this.current > 0
    const returningHome = this.returningHome
    const sections = returningHome ? this.frame.sections.map(state => advanceSectionUI(state, false, 0, this.media.matches)) : this.frame.sections
    this.frame = { ...this.frame, sections, returningHome }
    this.listeners.forEach(listener => listener(this.frame))
    if (instant || this.media.matches) this.current = this.target = clamp(progress)
    window.scrollTo({ top: clamp(progress) * this.range, behavior: instant || this.media.matches ? 'instant' : 'smooth' })
  }

  stop() {
    this.started = false
    cancelAnimationFrame(this.raf)
    cancelAnimationFrame(this.resizeRaf)
    window.removeEventListener('scroll', this.onScroll)
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('wheel', this.cancelReturn)
    window.removeEventListener('touchstart', this.cancelReturn)
    window.removeEventListener('keydown', this.onKey)
    document.removeEventListener('visibilitychange', this.onVisibility)
  }
}
