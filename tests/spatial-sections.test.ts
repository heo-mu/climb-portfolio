import { describe, expect, it } from 'vitest'
import { PerspectiveCamera, Vector3 } from 'three'
import { checkpoints } from '../src/data/expedition'
import { campFog, SpatialAnchorProjection } from '../src/experience/SpatialAnchorProjection'
import { ArrivalDock } from '../src/experience/SpatialSectionTransition'
import { campZones, projectsPresentation, routeProgress } from '../src/experience/progress'
import { cameraFieldOfView, exhibitionCameraPose } from '../src/experience/terrain'

function pose(camera: PerspectiveCamera, progress: number, width = 1440) {
  const target = new Vector3()
  exhibitionCameraPose(routeProgress(progress), camera.position, target, width, camera.aspect)
  camera.fov = cameraFieldOfView(routeProgress(progress), camera.aspect, width)
  camera.updateProjectionMatrix()
  camera.lookAt(target)
  camera.updateMatrixWorld()
}

const scaleOf = (projection: SpatialAnchorProjection, width: number, height: number) =>
  (new Vector3(width, height / 2, 0).applyMatrix4(projection.matrix).x - new Vector3(0, height / 2, 0).applyMatrix4(projection.matrix).x) / width

describe.each(checkpoints.slice(1).map((camp, i) => ({ ...camp, index: i + 1 })))('$navigation spatial camp', camp => {
  const { plateau, arrival } = campZones[camp.index]

  it.each([[1440, 900], [390, 844]])('projects reversibly and settles exactly on its axes at %i x %i', (width, height) => {
    const camera = new PerspectiveCamera(width < height ? 72 : 64, width / height, .08, 2400)
    for (const boundary of plateau) {
      const projection = new SpatialAnchorProjection(routeProgress(boundary), campFog)
      projection.resize(camera, width, height)
      pose(camera, boundary, width)
      projection.update(camera)
      const initial = projection.matrix.clone()
      for (const p of [boundary - .018, boundary + .018, boundary - .018].map(p => Math.max(0, Math.min(1, p)))) {
        pose(camera, p, width)
        projection.update(camera)
        expect(projection.matrix.elements.every(Number.isFinite)).toBe(true)
        if (camp.index === 4 && width > 1024) expect(projection.distance).toBeGreaterThanOrEqual(0)
        else if (p !== boundary) expect(projection.distance).toBeGreaterThan(0)
        expect(projection.blur).toBeLessThanOrEqual(2)
      }
      pose(camera, boundary, width)
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

  it('still reads as distant where it is not yet arrived', () => {
    const camera = new PerspectiveCamera(64, 1440 / 900, .08, 2400)
    const approach = new SpatialAnchorProjection(routeProgress(plateau[0]), campFog)
    approach.resize(camera, 1440, 900)
    pose(camera, arrival[0] - .0005)
    approach.update(camera)
    if (camp.index === 4) {
      // The overlook is already parked; the shared reveal still precedes arrival.
      expect(scaleOf(approach, 1440, 900)).toBeCloseTo(1)
      expect(projectsPresentation(routeProgress(arrival[0] - .0005)).presence).toBeLessThan(1)
    } else expect(scaleOf(approach, 1440, 900)).toBeLessThan(.8)
  })

  it('has dissolved before a neighbouring camp is reached', () => {
    const camera = new PerspectiveCamera(64, 1440 / 900, .08, 2400)
    const approach = new SpatialAnchorProjection(routeProgress(plateau[0]), campFog)
    const departure = new SpatialAnchorProjection(routeProgress(plateau[1]), campFog)
    approach.resize(camera, 1440, 900)
    departure.resize(camera, 1440, 900)
    pose(camera, campZones[camp.index - 1].arrival[1])
    approach.update(camera)
    expect(approach.opacity).toBe(0)
    if (camp.index < checkpoints.length - 1) {
      pose(camera, campZones[camp.index + 1].arrival[0])
      departure.update(camera)
      expect(departure.opacity).toBe(0)
    }
  })
})

describe('arrival docking', () => {
  it('eases onto the reading axes and back, ending exactly at rest values', () => {
    const dock = new ArrivalDock()
    expect(dock.pending(true)).toBe(true)
    let frames = 0
    while (dock.amount < 1 && frames < 120) { dock.ease(true, 1 / 60); frames++ }
    expect(dock.amount).toBe(1)
    expect(frames).toBeLessThan(40)
    expect(dock.pending(true)).toBe(false)
    dock.ease(false, 1 / 60)
    expect(dock.amount).toBeGreaterThan(0)
    expect(dock.amount).toBeLessThan(1)
    while (dock.amount > 0 && frames < 240) { dock.ease(false, 1 / 60); frames++ }
    expect(dock.amount).toBe(0)
    expect(dock.pending(false)).toBe(false)
    dock.park()
    expect(dock.amount).toBe(1)
  })
})
