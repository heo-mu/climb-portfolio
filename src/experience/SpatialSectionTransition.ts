import type { PerspectiveCamera } from 'three'
import { checkpoints } from '../data/expedition'
import { experienceConfig } from '../config/experience'
import { HomeSpatialTransition } from './HomeSpatialTransition'
import { SpatialAnchorProjection } from './SpatialAnchorProjection'
import { clamp, routeProgress, smoothstep } from './progress'
import type { ExpeditionFrame } from './progress'

export function sectionAnchorRange(index: number) {
  const progress = checkpoints[index].progress
  return {
    entry: clamp(progress - experienceConfig.content.readableRange),
    exit: clamp(progress + experienceConfig.content.readableRange),
  }
}

// A camp is a reading plateau, not a single frame on the rail. Its two boundary
// poses provide stable approach/departure anchors; within it the existing DOM
// composition is parked exactly at its original, untransformed reading axes.
export class SpatialSectionTransition {
  private home: HomeSpatialTransition
  private panels: {
    element: HTMLElement
    content: HTMLElement
    entry: number
    exit: number
    approach: SpatialAnchorProjection
    departure: SpatialAnchorProjection
    mode: string
  }[]
  private lastRoute = -1
  private lastReduced = false
  private lastReturn = false
  private returnAnchor = new SpatialAnchorProjection()
  private returnIndex = -1
  private width = 1
  private height = 1

  constructor(root: HTMLElement) {
    this.home = new HomeSpatialTransition(root.querySelector<HTMLElement>('.home-hero')!)
    this.panels = Array.from(root.querySelectorAll<HTMLElement>('.checkpoint')).map((element, i) => {
      const { entry, exit } = sectionAnchorRange(i + 1)
      return { element, content: element.querySelector<HTMLElement>('.spatial-panel')!, entry, exit, approach: new SpatialAnchorProjection(routeProgress(entry)), departure: new SpatialAnchorProjection(routeProgress(exit)), mode: '' }
    })
  }

  resize(camera: PerspectiveCamera, width: number, height: number) {
    this.width = width
    this.height = height
    this.home.resize(camera, width, height)
    this.panels.forEach(panel => {
      panel.approach.resize(camera, width, height)
      panel.departure.resize(camera, width, height)
      panel.mode = ''
    })
    this.lastRoute = -1
  }

  update(camera: PerspectiveCamera, frame: ExpeditionFrame) {
    this.home.update(camera, frame)
    if (frame.route === this.lastRoute && frame.reducedMotion === this.lastReduced && frame.returningHome === this.lastReturn) return
    if (frame.returningHome && !this.lastReturn) {
      this.returnIndex = this.panels.findIndex(panel => panel.mode === 'readable')
      this.returnAnchor.resize(camera, this.width, this.height, true)
    }
    this.lastRoute = frame.route
    this.lastReduced = frame.reducedMotion
    this.lastReturn = frame.returningHome
    this.panels.forEach((panel, i) => {
      const { element, content } = panel
      const readable = frame.sections[i + 1].interactive
      const leavingForHome = frame.returningHome && i === this.returnIndex
      const projection = leavingForHome ? this.returnAnchor : frame.progress < panel.entry ? panel.approach : panel.departure
      projection.update(camera)
      // Home and About are unusually close. Let the departure leave the
      // foreground before the first camp becomes visually prominent.
      const handoff = i === 0 && frame.progress < panel.entry ? 1 - smoothstep(this.home.opacity / .3) : 1
      const opacity = projection.opacity * handoff
      // Home return passes through camps without activating their UI. The
      // current camp can recede, but intervening reading plateaus stay quiet.
      const hidden = !readable && ((frame.returningHome && !leavingForHome) || opacity === 0 || frame.reducedMotion)
      const mode = readable ? 'readable' : hidden ? 'hidden' : 'spatial'
      if (mode !== 'spatial' && mode === panel.mode) return
      panel.mode = mode
      element.dataset.spatial = mode
      element.style.visibility = hidden ? 'hidden' : 'visible'
      content.style.transform = mode === 'spatial' ? `matrix3d(${projection.matrix.elements.join(',')})` : 'none'
      content.style.opacity = String(readable ? 1 : hidden ? 0 : opacity)
      const spatialBlur = Math.max(projection.blur, 4 * smoothstep(projection.distance / 24))
      content.style.filter = mode === 'spatial' && spatialBlur > 0 ? `blur(${spatialBlur}px)` : 'none'
      content.style.willChange = mode === 'spatial' ? 'transform, opacity, filter' : 'auto'
      // Editorial detail follows spatial distance; no second entrance timer.
      const clarity = readable ? 1 : 1 - smoothstep(projection.distance / 62)
      element.style.setProperty('--panel-title', String(.72 + .28 * clarity))
      element.style.setProperty('--panel-body', String(.62 + .38 * clarity))
      element.style.setProperty('--panel-surface', String(readable ? 1 : hidden ? 0 : projection.backdrop * handoff))
    })
  }

  dispose() {
    this.home.dispose()
    this.panels.forEach(({ element, content }) => {
      element.removeAttribute('style')
      content.removeAttribute('style')
      delete element.dataset.spatial
    })
  }
}
