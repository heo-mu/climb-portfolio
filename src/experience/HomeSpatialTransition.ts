import type { PerspectiveCamera } from 'three'
import type { ExpeditionFrame } from './progress'
import { SpatialAnchorProjection } from './SpatialAnchorProjection'

export class HomeDepartureProjection extends SpatialAnchorProjection {}

/** Owns every Home exit style. No layout reads, React state, or extra RAF loop. */
export class HomeSpatialTransition {
  private projection = new HomeDepartureProjection()
  private layout: HTMLElement
  private lastRoute = -1
  private lastReduced = false
  private hidden = false

  constructor(private home: HTMLElement) {
    this.layout = home.querySelector<HTMLElement>('.home-layout')!
  }

  get opacity() { return this.projection.opacity }

  resize(camera: PerspectiveCamera, width: number, height: number) {
    this.projection.resize(camera, width, height)
    this.lastRoute = -1
  }

  update(camera: PerspectiveCamera, frame: ExpeditionFrame) {
    if (frame.route === this.lastRoute && frame.reducedMotion === this.lastReduced) return
    this.lastRoute = frame.route
    this.lastReduced = frame.reducedMotion
    this.projection.update(camera)
    const { opacity, backdrop, blur, matrix } = this.projection
    const atHome = frame.route === 0
    if (opacity === 0 && this.hidden) return
    this.hidden = opacity === 0
    this.home.style.visibility = opacity > 0 ? 'visible' : 'hidden'
    this.home.style.setProperty('--home-backdrop', String(atHome ? 1 : backdrop))
    this.layout.style.opacity = String(atHome ? 1 : opacity)
    this.layout.style.transform = atHome || frame.reducedMotion || this.hidden ? 'none' : `matrix3d(${matrix.elements.join(',')})`
    this.layout.style.filter = atHome || frame.reducedMotion || blur === 0 ? 'none' : `blur(${blur}px)`
    this.layout.style.willChange = !atHome && opacity > 0 && !frame.reducedMotion ? 'transform, opacity, filter' : 'auto'
  }

  dispose() {
    this.layout.removeAttribute('style')
    this.home.style.removeProperty('--home-backdrop')
    this.home.style.removeProperty('visibility')
  }
}
