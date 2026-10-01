import { describe, expect, it } from 'vitest'
import { PerspectiveCamera, Vector3 } from 'three'
import { checkpoints } from '../src/data/expedition'
import { SpatialAnchorProjection } from '../src/experience/SpatialAnchorProjection'
import { sectionAnchorRange } from '../src/experience/SpatialSectionTransition'
import { activeCheckpoint, routeProgress, sectionUIAt } from '../src/experience/progress'
import { cameraPose } from '../src/experience/terrain'

function pose(camera: PerspectiveCamera, progress: number) {
  const target = new Vector3()
  cameraPose(routeProgress(progress), camera.position, target)
  camera.lookAt(target)
  camera.updateMatrixWorld()
}

it('captures the current camp for HOME return without moving its final composition', () => {
  const camera = new PerspectiveCamera(64, 1440 / 900, .08, 2400)
  pose(camera, .75)
  const projection = new SpatialAnchorProjection()
  projection.resize(camera, 1440, 900, true)
  projection.update(camera)
  const initial = projection.matrix.clone()
  expect(new Vector3(58, 131, 0).applyMatrix4(initial).x).toBeCloseTo(58, 7)
  pose(camera, .72)
  projection.update(camera)
  expect(projection.distance).toBeGreaterThan(0)
  expect(projection.opacity).toBeLessThan(1)
  pose(camera, .75)
  projection.update(camera)
  expect(projection.matrix.equals(initial)).toBe(true)
})

describe.each(checkpoints.slice(1).map((camp, i) => ({ ...camp, index: i + 1 })))('$navigation spatial camp', camp => {
  it('preserves the reading plateau and enables content with the navigation', () => {
    const { entry, exit } = sectionAnchorRange(camp.index)
    for (const progress of [entry, camp.progress, exit]) {
      expect(sectionUIAt(progress)[camp.index]).toEqual({ phase: 'active', amount: 1, interactive: true })
      expect(activeCheckpoint(progress, 0)).toBe(camp.index)
      expect(sectionUIAt(progress, true)[camp.index].interactive).toBe(false)
    }
    for (const progress of [entry - .0001, exit + .0001].filter(p => p <= 1)) {
      expect(sectionUIAt(progress)[camp.index].interactive).toBe(false)
    }
  })

  it.each([[1440, 900], [390, 844]])('projects reversibly and settles exactly at %i x %i', (width, height) => {
    const camera = new PerspectiveCamera(width < height ? 72 : 64, width / height, .08, 2400)
    const { entry, exit } = sectionAnchorRange(camp.index)
    for (const boundary of [entry, exit]) {
      const projection = new SpatialAnchorProjection(routeProgress(boundary))
      projection.resize(camera, width, height)
      pose(camera, boundary)
      projection.update(camera)
      const initial = projection.matrix.clone()
      for (const p of [boundary - .018, boundary + .018, boundary - .018].map(p => Math.max(0, Math.min(1, p)))) {
        pose(camera, p)
        projection.update(camera)
        expect(projection.matrix.elements.every(Number.isFinite)).toBe(true)
        if (p !== boundary) expect(projection.distance).toBeGreaterThan(0)
        expect(projection.blur).toBeLessThanOrEqual(2)
      }
      pose(camera, boundary)
      projection.update(camera)
      expect(projection.matrix.equals(initial)).toBe(true)
      expect(projection.opacity).toBe(1)
      expect(projection.blur).toBe(0)
      for (const [x, y] of [[0, 0], [width, height]]) {
        const pixel = new Vector3(x, y, 0).applyMatrix4(projection.matrix)
        expect(pixel.x).toBeCloseTo(x, 7)
        expect(pixel.y).toBeCloseTo(y, 7)
      }
    }
  })
})
