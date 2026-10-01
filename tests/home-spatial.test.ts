import { describe, expect, it } from 'vitest'
import { PerspectiveCamera, Vector3 } from 'three'
import { SpatialAnchorProjection } from '../src/experience/SpatialAnchorProjection'
import { cameraPose } from '../src/experience/terrain'
import { campZones, routeProgress } from '../src/experience/progress'

function setup(width = 1440, height = 900) {
  const camera = new PerspectiveCamera(width / height < .95 ? 72 : 64, width / height, .08, 2400)
  const projection = new SpatialAnchorProjection()
  projection.resize(camera, width, height)
  const move = (progress: number) => {
    const target = new Vector3()
    cameraPose(routeProgress(progress), camera.position, target)
    camera.lookAt(target)
    camera.updateMatrixWorld()
    projection.update(camera)
  }
  const point = (x: number, y: number) => new Vector3(x, y, 0).applyMatrix4(projection.matrix)
  move(0)
  return { projection, camera, move, point }
}

describe('Home departure projection', () => {
  it.each([[1440, 900], [390, 844]])('restores original pixel axes after a reversible camera journey (%i x %i)', (width, height) => {
    const { projection, move, point } = setup(width, height)
    const initial = projection.matrix.clone()
    move(.02)
    move(.06)
    move(.02)
    move(0)
    expect(projection.matrix.equals(initial)).toBe(true)
    for (const [x, y] of [[0, 0], [width / 2, height / 2], [width, height]]) {
      const result = point(x, y)
      expect(result.x).toBeCloseTo(x, 8)
      expect(result.y).toBeCloseTo(y, 8)
    }
    expect(projection.opacity).toBe(1)
    expect(projection.blur).toBe(0)
  })

  it('recedes before dissolving and is gone before About becomes readable', () => {
    const { projection, move, point } = setup()
    move(.008)
    expect(projection.opacity).toBeGreaterThan(.9)
    expect(point(1440, 450).x - point(0, 450).x).toBeLessThan(1300)
    move(.02)
    expect(projection.opacity).toBeGreaterThan(.7)
    expect(point(1440, 450).x - point(0, 450).x).toBeLessThan(700)
    expect(point(720, 450).x).toBeLessThan(720)
    expect(Math.abs(projection.matrix.determinant())).toBeGreaterThan(.01)
    expect(projection.blur).toBeLessThanOrEqual(2)
    move(campZones[1].arrival[0])
    expect(projection.opacity).toBe(0)
  })

  it('responds to actual lateral position and yaw, not a preset screen translation', () => {
    const { projection, camera, point } = setup()
    camera.position.x += 3
    camera.updateMatrixWorld()
    projection.update(camera)
    expect(point(720, 450).x).toBeLessThan(720)
    camera.rotateY(.08)
    camera.updateMatrixWorld()
    projection.update(camera)
    const leftHeight = point(0, 900).y - point(0, 0).y
    const rightHeight = point(1440, 900).y - point(1440, 0).y
    expect(Math.abs(leftHeight - rightHeight)).toBeGreaterThan(10)
  })
})
