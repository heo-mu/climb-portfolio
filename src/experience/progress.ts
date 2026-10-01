import { checkpoints } from '../data/expedition'
import { routeEyeAt } from '../data/ascentRoute'
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

const { readableRange, arrivalDistance, homeArrivalDistance } = experienceConfig.content
const eyeAt = (progress: number) => routeEyeAt(routeProgress(progress))

/** Progress at which the walker is `reach` metres from the eye pose at `anchor`. */
function reachFrom(anchor: number, direction: -1 | 1, reach: number) {
  const [x, y, z] = eyeAt(anchor)
  const within = (progress: number) => { const [px, py, pz] = eyeAt(progress); return Math.hypot(px - x, py - y, pz - z) <= reach }
  let inside = anchor, outside = clamp(anchor + direction * .0005)
  while (within(outside)) {
    if (outside === inside) return outside
    inside = outside
    outside = clamp(outside + direction * .0005)
  }
  for (let i = 0; i < 40; i++) { const mid = (inside + outside) / 2; if (within(mid)) inside = mid; else outside = mid }
  return inside
}

export type CampZone = { plateau: readonly [number, number]; arrival: readonly [number, number] }

/**
 * `plateau`: the composition is parked exactly on its reading axes.
 * `arrival`: the eye is within reach of a plateau boundary. Content, input,
 * trail and location label all switch here, on the same spatial distance the
 * rendered approach and departure projections use.
 */
export const campZones: CampZone[] = checkpoints.map((camp, index) => {
  if (index === 0) return { plateau: [0, 0], arrival: [0, reachFrom(0, 1, homeArrivalDistance)] }
  const entry = clamp(camp.progress - readableRange), exit = clamp(camp.progress + readableRange)
  return { plateau: [entry, exit], arrival: [reachFrom(entry, -1, arrivalDistance), reachFrom(exit, 1, arrivalDistance)] }
})

// Arrival is spatial, never dependent on a second animation clock.
export function readableCheckpoint(progress: number) {
  return campZones.findIndex(({ arrival }) => progress >= arrival[0] - Number.EPSILON && progress <= arrival[1] + Number.EPSILON)
}

/** The camp most recently passed while walking uphill to `progress`. */
const campBelow = (progress: number) => checkpoints.reduce((found, camp, index) => camp.progress <= progress ? index : found, 0)

export function activeCheckpoint(progress: number, previous = campBelow(progress)) {
  const arrived = readableCheckpoint(progress)
  // Latch the last arrival during travel: crossing an exit cannot select a neighbour.
  return arrived < 0 ? previous : arrived
}

export type SectionUIState = { phase: 'hidden' | 'active'; interactive: boolean }

// Shared, immutable states: consumers can skip DOM work when the reference is unchanged.
const sectionStates = new Map<string, readonly SectionUIState[]>()
export function sectionUIAt(progress: number, returningHome = false): readonly SectionUIState[] {
  const arrived = readableCheckpoint(progress), key = `${arrived}:${returningHome}`
  let states = sectionStates.get(key)
  if (!states) {
    // Home return passes through camps without activating them.
    states = checkpoints.map((_, index) => {
      const interactive = arrived === index && (!returningHome || index === 0)
      return { phase: interactive ? 'active' : 'hidden', interactive } as const
    })
    sectionStates.set(key, states)
  }
  return states
}

/** `destination`: the camp whose arrival zone holds the scroll target, where the walker will stand. */
export type ExpeditionFrame = { progress: number; route: number; altitude: number; active: number; destination: number; sections: readonly SectionUIState[]; returningHome: boolean; delta: number; time: number; reducedMotion: boolean }
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
  private frame: ExpeditionFrame = { progress: 0, route: 0, altitude: checkpoints[0].altitude, active: 0, destination: 0, sections: sectionUIAt(0), returningHome: false, delta: 0, time: 0, reducedMotion: this.media.matches }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener)
    listener(this.frame)
    return () => { this.listeners.delete(listener) }
  }

  private emit() { this.listeners.forEach(listener => listener(this.frame)) }

  private measure = () => {
    this.range = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
    this.target = clamp(window.scrollY / this.range)
  }

  private onScroll = () => { this.measure() }
  private cancelReturn = () => {
    if (!this.returningHome) return
    this.returningHome = false
    // Stopped mid-descent: name the camp last passed, as an uphill walk would.
    const passed = checkpoints.findIndex(camp => camp.progress >= this.current)
    this.frame = { ...this.frame, returningHome: false, sections: sectionUIAt(this.current), active: activeCheckpoint(this.current, passed < 0 ? checkpoints.length - 1 : passed) }
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
    const returningHome = this.returningHome
    // The rendered approach reveals the composition; arrival makes it settled,
    // interactive and current in the same frame, with no second fade clock.
    const sections = sectionUIAt(this.current, returningHome)
    // Returning Home names its destination at once; the marker shows the descent.
    const active = returningHome ? 0 : activeCheckpoint(this.current, this.frame.active)
    this.frame = { progress: this.current, route: routeProgress(this.current), altitude: altitudeAt(this.current), active, destination: readableCheckpoint(this.target), sections, returningHome, delta, time: time / 1000, reducedMotion }
    this.emit()
    this.raf = requestAnimationFrame(this.tick)
  }

  start(initialProgress: number) {
    if (this.started) return
    this.started = true
    this.measure()
    this.current = this.target = clamp(initialProgress)
    this.frame = { ...this.frame, progress: this.current, route: routeProgress(this.current), altitude: altitudeAt(this.current), active: activeCheckpoint(this.current), destination: readableCheckpoint(this.current), sections: sectionUIAt(this.current) }
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
    this.frame = { ...this.frame, returningHome: this.returningHome, sections: sectionUIAt(this.current, this.returningHome), active: this.returningHome ? 0 : this.frame.active }
    this.emit()
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
