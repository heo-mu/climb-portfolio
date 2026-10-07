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
  // Home releases promptly on the first wheel gesture, then eases into the
  // longer first journey. The other camps retain their symmetric reading dwell.
  const travel = index === 0
    ? local * (2.5 + local * (-2.12 + .62 * local))
    : .12 * local + .88 * smoothstep(local)
  return from + (to - from) * travel
}

export function altitudeAt(progress: number) {
  return altitudeAtRoute(cameraRouteAt(routeProgress(progress)))
}

export function altitudeAtRoute(route: number) {
  const index = Math.max(0, checkpoints.findIndex((point, i) => i < checkpoints.length - 1 && route >= point.route && route <= checkpoints[i + 1].route))
  const from = checkpoints[index], to = checkpoints[index + 1]
  const local = (route - from.route) / (to.route - from.route)
  return Math.round(from.altitude + (to.altitude - from.altitude) * local)
}

const { readableRange, arrivalDistance, homeDockDistance } = experienceConfig.content
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

type Span = readonly [number, number]
export type CampZone = { plateau: Span; arrival: Span; dock: Span }

/**
 * `plateau`: the composition is parked exactly on its reading axes.
 * `arrival`: the eye is within reach of a plateau boundary. Content, input,
 * trail and location label all switch here, on the same spatial distance the
 * rendered approach and departure projections use.
 * `dock`: where a walker coming to rest pulls the composition onto its axes.
 */
export const campZones: CampZone[] = checkpoints.map((camp, index) => {
  if (index === 0) return { plateau: [0, 0], arrival: [0, reachFrom(0, 1, arrivalDistance)], dock: [0, reachFrom(0, 1, homeDockDistance)] }
  const entry = clamp(camp.progress - readableRange), exit = clamp(camp.progress + readableRange)
  const arrival = [reachFrom(entry, -1, arrivalDistance), reachFrom(exit, 1, arrivalDistance)] as const
  return { plateau: [entry, exit], arrival, dock: arrival }
})

const within = (progress: number, [from, to]: Span) => progress >= from - Number.EPSILON && progress <= to + Number.EPSILON

// One reversible presentation envelope, derived from the actual Projects arrival.
// Frame the overlook before revealing the display; finish the reveal before input opens.
const projectsArrival = campZones[4].arrival.map(routeProgress)
const projectsShoulder = projectsArrival[1] - projectsArrival[0]

/** Physical rail progress. Reading consumes the same scroll span at a positive
 * speed; C1 shoulders reconnect to the walking rail without clamps or reversals.
 * Independent of viewport, selection, and travel direction. */
export function cameraRouteAt(route: number) {
  // Keep slow travel through the visible departure, then regain travel speed.
  // This gives the stationary display time to recede before the terrain occludes it.
  const entry = projectsArrival[0] - projectsShoulder * .6
  const exit = projectsArrival[1] + projectsShoulder * .6
  const start = projectsArrival[0] - projectsShoulder * 3
  const end = projectsArrival[1] + projectsShoulder * 3
  if (route <= start || route >= end) return route
  const speed = .12, center = checkpoints[4].route
  const slow = (r: number) => center + (r - center) * speed
  if (route >= entry && route <= exit) return slow(route)
  const a = route < entry ? start : exit, b = route < entry ? entry : end
  const y0 = route < entry ? start : slow(exit), y1 = route < entry ? slow(entry) : end
  const m0 = route < entry ? 1 : speed, m1 = route < entry ? speed : 1
  const t = (route - a) / (b - a), t2 = t * t, t3 = t2 * t
  return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * (b - a) * m0
    + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * (b - a) * m1
}
export function projectsPresentation(route: number, departing = false) {
  const [entry, exit] = projectsArrival
  const ramp = (from: number, to: number) => smoothstep((route - from) / (to - from))
  const focus = ramp(entry - projectsShoulder, entry - projectsShoulder * .15)
    * (1 - ramp(exit + projectsShoulder * .15, exit + projectsShoulder))
  const presence = ramp(entry - projectsShoulder * .15, entry)
    * (1 - ramp(exit, exit + projectsShoulder * .15))
  if (!departing) return { focus, lens: focus, presence, departure: 0 }
  const distance = Math.max(entry - route, route - exit, 0) / projectsShoulder
  // The exhibit stays fixed. Widen the lens first, then release the walking
  // camera, so the screen recedes instead of sticking to the viewport.
  const departure = smoothstep(distance / .6)
  return { focus: 1 - smoothstep((distance - .4) / .6), lens: 1 - departure, presence: 1 - departure, departure }
}

/** Exit framing is earned by a visit, never applied to a first approach. */
export class ProjectsDeparture {
  private visited = false
  update(route: number, arrived: boolean) {
    if (arrived) this.visited = true
    else if (projectsPresentation(route).focus === 0) this.visited = false
    return this.visited && !arrived
  }
}

// Arrival is spatial, never dependent on a second animation clock.
export function readableCheckpoint(progress: number) {
  return campZones.findIndex(({ arrival }) => within(progress, arrival))
}

/** The camp whose dock holds `progress`: where a composition settles when the walker stops there. */
export const dockingCheckpoint = (progress: number) => campZones.findIndex(({ dock }) => within(progress, dock))

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
export function sectionUIAt(progress: number, returningHome = false, projectsReady = true): readonly SectionUIState[] {
  const arrived = readableCheckpoint(progress), key = `${arrived}:${returningHome}:${projectsReady}`
  let states = sectionStates.get(key)
  if (!states) {
    // Home return passes through camps without activating them.
    states = checkpoints.map((_, index) => {
      const interactive = arrived === index && (!returningHome || index === 0) && (index !== 4 || projectsReady)
      return { phase: interactive ? 'active' : 'hidden', interactive } as const
    })
    sectionStates.set(key, states)
  }
  return states
}

/** Silence (ms) that ends a wheel gesture; momentum and free-spinning wheels fire far more often. */
const WHEEL_GESTURE_GAP = 180

/** `route` controls presentation timing; `worldRoute` is shared physical travel for
 * camera, altitude and trail. `destination` is the camp at the scroll target. */
export type ExpeditionFrame = { progress: number; route: number; worldRoute: number; altitude: number; active: number; destination: number; sections: readonly SectionUIState[]; projectsReady?: boolean; projectsDeparting?: boolean; returningHome: boolean; delta: number; time: number; reducedMotion: boolean }
type Listener = (frame: ExpeditionFrame) => void

export class ScrollController {
  private projectsDeparture = new ProjectsDeparture()
  private projectsReady = false
  setProjectsReady = (ready: boolean) => { this.projectsReady = ready }
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
  private frame: ExpeditionFrame = { progress: 0, route: 0, worldRoute: 0, altitude: checkpoints[0].altitude, active: 0, destination: 0, sections: sectionUIAt(0), projectsReady: false, returningHome: false, delta: 0, time: 0, reducedMotion: this.media.matches }

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

  private returnWatch = 0
  private onScroll = () => {
    const previous = this.target
    // The fixed journey's range changes on resize, not on each native scroll.
    // Reading scrollHeight here can flush the previous spatial style writes.
    this.target = clamp(window.scrollY / this.range)
    if (!this.returningHome) return
    // A return Home is one uninterrupted descent. Climbing, or coming to rest
    // short of Home, means the visitor took over, including through inputs that
    // fire no wheel/touch/key events, such as dragging the scrollbar.
    if (this.target > previous + 1e-6) return this.cancelReturn()
    this.watchReturn()
  }
  private watchReturn() {
    clearTimeout(this.returnWatch)
    this.returnWatch = window.setTimeout(() => { if (this.returningHome && this.target > 0) this.cancelReturn() }, 250)
  }
  private lastWheel = -Infinity
  private trailingWheel = false
  private onWheel = (event: WheelEvent) => {
    const continuing = event.timeStamp - this.lastWheel < WHEEL_GESTURE_GAP
    this.lastWheel = event.timeStamp
    if (!this.returningHome) return
    // HOME pressed while a wheel gesture was still under way: a fling pinned
    // against the summit keeps emitting wheel events (trackpad momentum, a
    // free-spinning wheel) without moving the page. That tail is not the visitor
    // taking over the return; a fresh gesture after a pause is.
    if (this.trailingWheel && continuing) return
    this.trailingWheel = false
    this.cancelReturn()
  }
  private cancelReturn = () => {
    if (!this.returningHome) return
    this.returningHome = false
    // Stopped mid-descent: name the camp last passed, as an uphill walk would.
    const passed = checkpoints.findIndex(camp => camp.progress >= this.current)
    this.frame = { ...this.frame, returningHome: false, sections: sectionUIAt(this.current, false, this.projectsReady), active: activeCheckpoint(this.current, passed < 0 ? checkpoints.length - 1 : passed) }
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
    let next = this.current + (this.target - this.current) * (reducedMotion ? 1 : 1 - Math.exp(-delta * experienceConfig.route.damping))
    if (Math.abs(this.target - next) < 0.00001) next = this.target
    // A return only descends: a camera still easing up to the camp it is leaving
    // holds and turns as soon as the scroll passes below it, so the trail and the
    // altitude reverse at once instead of overshooting first.
    this.current = this.returningHome ? Math.min(this.current, next) : next
    // The return ends on arriving Home, not on the last sub-pixel of camera easing.
    if (this.returningHome && this.target === 0 && readableCheckpoint(this.current) === 0) this.returningHome = false
    const returningHome = this.returningHome
    // The rendered approach reveals the composition; arrival makes it settled,
    // interactive and current in the same frame, with no second fade clock.
    const sections = sectionUIAt(this.current, returningHome, this.projectsReady)
    // Returning Home names its destination at once; the marker shows the descent.
    const active = returningHome ? 0 : activeCheckpoint(this.current, this.frame.active)
    const route = routeProgress(this.current)
    const worldRoute = cameraRouteAt(route)
    const projectsDeparting = this.projectsDeparture.update(route, sections[4].interactive) && !reducedMotion
    this.frame = { progress: this.current, route, worldRoute, altitude: altitudeAtRoute(worldRoute), active, destination: dockingCheckpoint(this.target), sections, projectsReady: this.projectsReady, projectsDeparting, returningHome, delta, time: time / 1000, reducedMotion }
    this.emit()
    this.raf = requestAnimationFrame(this.tick)
  }

  start(initialProgress: number) {
    if (this.started) return
    this.started = true
    this.measure()
    this.current = this.target = clamp(initialProgress)
    this.frame = { ...this.frame, progress: this.current, route: routeProgress(this.current), worldRoute: cameraRouteAt(routeProgress(this.current)), altitude: altitudeAt(this.current), active: activeCheckpoint(this.current), destination: dockingCheckpoint(this.current), sections: sectionUIAt(this.current, false, this.projectsReady), projectsReady: this.projectsReady }
    window.scrollTo({ top: this.current * this.range, behavior: 'instant' })
    window.addEventListener('scroll', this.onScroll, { passive: true })
    window.addEventListener('resize', this.onResize)
    window.addEventListener('wheel', this.onWheel, { passive: true })
    window.addEventListener('touchstart', this.cancelReturn, { passive: true })
    window.addEventListener('keydown', this.onKey)
    document.addEventListener('visibilitychange', this.onVisibility)
    this.raf = requestAnimationFrame(this.tick)
  }

  goTo(progress: number, instant = false) {
    this.measure()
    this.returningHome = progress === 0 && this.current > 0
    this.trailingWheel = this.returningHome && performance.now() - this.lastWheel < WHEEL_GESTURE_GAP
    this.frame = { ...this.frame, returningHome: this.returningHome, sections: sectionUIAt(this.current, this.returningHome, this.projectsReady), active: this.returningHome ? 0 : this.frame.active }
    this.emit()
    if (instant || this.media.matches) this.current = this.target = clamp(progress)
    window.scrollTo({ top: clamp(progress) * this.range, behavior: instant || this.media.matches ? 'instant' : 'smooth' })
    if (this.returningHome) this.watchReturn()
  }

  stop() {
    this.started = false
    cancelAnimationFrame(this.raf)
    cancelAnimationFrame(this.resizeRaf)
    clearTimeout(this.returnWatch)
    window.removeEventListener('scroll', this.onScroll)
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('wheel', this.onWheel)
    window.removeEventListener('touchstart', this.cancelReturn)
    window.removeEventListener('keydown', this.onKey)
    document.removeEventListener('visibilitychange', this.onVisibility)
  }
}
