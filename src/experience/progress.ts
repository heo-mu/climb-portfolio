import { checkpoints } from '../data/expedition'

export const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value))
export const smoothstep = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t) }

// Slow near every camp without locking, snapping, or intercepting native scrolling.
export function routeProgress(progress: number) {
  const p = clamp(progress)
  const segment = Math.min(3, checkpoints.findIndex((point, i) => i < 4 && p <= checkpoints[i + 1].progress && p >= point.progress))
  const index = Math.max(0, segment)
  const start = checkpoints[index].progress
  const end = checkpoints[index + 1].progress
  const local = (p - start) / (end - start)
  return (index + 0.12 * local + 0.88 * smoothstep(local)) / 4
}

export function altitudeAt(progress: number) {
  const t = routeProgress(progress) * 4
  const index = Math.min(3, Math.floor(t))
  return Math.round(checkpoints[index].altitude + (checkpoints[index + 1].altitude - checkpoints[index].altitude) * (t - index))
}

export function activeCheckpoint(progress: number) {
  return checkpoints.reduce((best, item, index) => Math.abs(item.progress - progress) < Math.abs(checkpoints[best].progress - progress) ? index : best, 0)
}

export function visibilityAt(progress: number, checkpoint: number) {
  const distance = Math.abs(progress - checkpoints[checkpoint].progress)
  return 1 - smoothstep((distance - 0.046) / 0.060)
}

export type ExpeditionFrame = { progress: number; route: number; altitude: number; active: number; delta: number; time: number; reducedMotion: boolean }
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
  private frame: ExpeditionFrame = { progress: 0, route: 0, altitude: 1240, active: 0, delta: 0, time: 0, reducedMotion: this.media.matches }

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
    this.current += (this.target - this.current) * (reducedMotion ? 1 : 1 - Math.exp(-delta * 9))
    if (Math.abs(this.target - this.current) < 0.00001) this.current = this.target
    this.frame = { progress: this.current, route: routeProgress(this.current), altitude: altitudeAt(this.current), active: activeCheckpoint(this.current), delta, time: time / 1000, reducedMotion }
    this.listeners.forEach(listener => listener(this.frame))
    this.raf = requestAnimationFrame(this.tick)
  }

  start(initialProgress: number) {
    if (this.started) return
    this.started = true
    this.measure()
    this.current = this.target = clamp(initialProgress)
    window.scrollTo({ top: this.current * this.range, behavior: 'instant' })
    window.addEventListener('scroll', this.onScroll, { passive: true })
    window.addEventListener('resize', this.onResize)
    document.addEventListener('visibilitychange', this.onVisibility)
    this.raf = requestAnimationFrame(this.tick)
  }

  goTo(progress: number, instant = false) {
    this.measure()
    if (instant || this.media.matches) this.current = this.target = clamp(progress)
    window.scrollTo({ top: clamp(progress) * this.range, behavior: instant || this.media.matches ? 'instant' : 'smooth' })
  }

  stop() {
    this.started = false
    cancelAnimationFrame(this.raf)
    cancelAnimationFrame(this.resizeRaf)
    window.removeEventListener('scroll', this.onScroll)
    window.removeEventListener('resize', this.onResize)
    document.removeEventListener('visibilitychange', this.onVisibility)
  }
}
