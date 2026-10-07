import type { PerspectiveCamera } from 'three'
import { campFog, homeFog, SpatialAnchorProjection } from './SpatialAnchorProjection'
import { campZones, routeProgress, smoothstep } from './progress'
import type { CampZone, ExpeditionFrame } from './progress'

const DOCK_TIME = .085 // s: time constant of docking and release

/**
 * While walking, a camp composition follows its spatial projection exactly.
 * When the walker is inside the camp's arrival zone and will also come to rest
 * there, it eases onto its reading axes (transform: none, crisp, interactive);
 * heading anywhere else releases it back onto its projection.
 */
export class ArrivalDock {
  amount = 0

  ease(docked: boolean, delta: number) {
    const target = Number(docked)
    const next = this.amount + (target - this.amount) * (1 - Math.exp(-delta / DOCK_TIME))
    this.amount = Math.abs(target - next) < .002 ? target : next
    return this.amount
  }

  /** On the reading plateau the composition is parked on its axes. */
  park() { this.amount = 1 }

  /** Frames are still needed although the camera may be standing still. */
  pending(docked: boolean) { return this.amount !== Number(docked) }
}

type Stage = {
  zone: CampZone
  section: HTMLElement
  content: HTMLElement
  backdrop: (value: number) => void
  approach: SpatialAnchorProjection | null
  departure: SpatialAnchorProjection
  dock: ArrivalDock
  mode: string
}

const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

/**
 * Every Base Camp composition is a place on the route: approached from afar,
 * parked on its exact reading axes on the plateau, left behind on departure.
 * Owns all of their visual styles. Input eligibility stays with the shared
 * arrival state (inert), so no layout reads, React state or extra RAF loop.
 */
export class SpatialSectionTransition {
  private stages: Stage[]
  private lastRoute = -1
  private lastReduced = false
  private lastReturn = false
  private pending = false
  private arrived = 0
  private leaving = -1
  private blend = identity.slice()

  constructor(private root: HTMLElement) {
    const home = root.querySelector<HTMLElement>('.home-hero')!
    const stage = (index: number, section: HTMLElement, content: HTMLElement, backdrop: Stage['backdrop']): Stage => {
      const zone = campZones[index]
      const fog = index ? campFog : homeFog
      return { zone, section, content, backdrop, approach: index ? new SpatialAnchorProjection(routeProgress(zone.plateau[0]), fog) : null, departure: new SpatialAnchorProjection(routeProgress(zone.plateau[1]), fog), dock: new ArrivalDock(), mode: '' }
    }
    this.stages = [
      stage(0, home, home.querySelector<HTMLElement>('.home-layout')!, value => home.style.setProperty('--home-backdrop', String(value))),
      ...Array.from(root.querySelectorAll<HTMLElement>('.checkpoint')).map((section, i) => {
        const surface = section.querySelector<HTMLElement>('.panel-surface')!
        return stage(i + 1, section, section.querySelector<HTMLElement>('.spatial-panel')!, value => { surface.style.opacity = String(value) })
      }),
    ]
    root.dataset.spatialReady = 'true'
  }

  resize(camera: PerspectiveCamera, width: number, height: number) {
    this.stages.forEach(stage => {
      stage.approach?.resize(camera, width, height)
      stage.departure.resize(camera, width, height)
      stage.mode = ''
    })
    this.lastRoute = -1
  }

  update(camera: PerspectiveCamera, frame: ExpeditionFrame) {
    const changed = frame.route !== this.lastRoute || frame.reducedMotion !== this.lastReduced || frame.returningHome !== this.lastReturn
    if (!changed && !this.pending) return
    // The camp being left on a Home return recedes; camps passed on the way stay quiet.
    if (frame.returningHome && !this.lastReturn) this.leaving = this.arrived
    if (!frame.returningHome) this.leaving = -1
    this.lastRoute = frame.route
    this.lastReduced = frame.reducedMotion
    this.lastReturn = frame.returningHome
    this.pending = false
    let homeOpacity = 1
    this.stages.forEach((stage, index) => {
      const arrived = frame.sections[index].interactive
      const [entry, exit] = stage.zone.plateau
      if (frame.reducedMotion) return this.apply(stage, arrived ? 'readable' : 'hidden')
      if (frame.returningHome && index !== 0 && index !== this.leaving) return this.apply(stage, 'hidden')
      if (frame.progress >= entry && frame.progress <= exit) {
        stage.dock.park()
        return this.apply(stage, 'readable')
      }
      const projection = stage.approach && frame.progress < entry ? stage.approach : stage.departure
      projection.update(camera)
      // The camp being left for Home holds its axes until the descent has passed
      // its plateau; otherwise it docks only where the walker will stand.
      const docked = index === this.leaving ? frame.progress >= entry : arrived && frame.destination === index
      const amount = stage.dock.ease(docked, frame.delta)
      this.pending ||= stage.dock.pending(docked)
      // Keep the first introduction clear of Home's receding statement.
      const handoff = index === 1 && frame.progress < entry ? 1 - smoothstep(homeOpacity / .3) : 1
      const opacity = projection.opacity * handoff + (1 - projection.opacity * handoff) * amount
      if (index === 0) homeOpacity = opacity
      if (opacity === 0) return this.apply(stage, 'hidden')
      if (amount === 1) return this.apply(stage, 'readable')
      const elements = projection.matrix.elements
      for (let i = 0; i < 16; i++) this.blend[i] = elements[i] + (identity[i] - elements[i]) * amount
      // Sections soften with distance; Home keeps its own tuned departure blur.
      const blur = (index ? Math.max(projection.blur, 4 * smoothstep(projection.distance / 24)) : projection.blur) * (1 - amount)
      this.apply(stage, 'spatial', opacity, blur, (projection.backdrop * handoff) * (1 - amount) + amount)
    })
    this.arrived = frame.sections.findIndex(section => section.interactive)
  }

  private apply(stage: Stage, mode: 'readable' | 'hidden' | 'spatial', opacity = 1, blur = 0, backdrop = 1) {
    if (mode !== 'spatial' && mode === stage.mode) return
    const { section, content } = stage
    if (mode !== stage.mode) {
      section.dataset.spatial = mode
      section.style.visibility = mode === 'hidden' ? 'hidden' : 'visible'
      content.style.willChange = mode === 'spatial' ? 'transform, opacity, filter' : 'auto'
    }
    stage.mode = mode
    content.style.transform = mode === 'spatial' ? `matrix3d(${this.blend.join(',')})` : 'none'
    content.style.opacity = mode === 'spatial' ? String(opacity) : mode === 'readable' ? '1' : '0'
    content.style.filter = mode === 'spatial' && blur > .01 ? `blur(${blur}px)` : 'none'
    stage.backdrop(mode === 'spatial' ? backdrop : mode === 'readable' ? 1 : 0)
  }

  dispose() {
    delete this.root.dataset.spatialReady
    this.stages.forEach(({ section, content }) => {
      content.removeAttribute('style')
      section.style.removeProperty('visibility')
      section.style.removeProperty('--home-backdrop')
      section.querySelector<HTMLElement>('.panel-surface')?.style.removeProperty('opacity')
      delete section.dataset.spatial
    })
  }
}
