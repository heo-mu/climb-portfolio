import { describe, expect, it } from 'vitest'
import { activeCheckpoint, altitudeAt, routeProgress, visibilityAt } from '../src/experience/progress'
import { checkpoints } from '../src/data/expedition'
import { CAMP_ANGLES, CAMP_HEIGHTS, createCameraRails, mountainGeometry, radiusAt, surfacePoint } from '../src/experience/terrain'
import { PerspectiveCamera, Vector3 } from 'three'

describe('expedition progression', () => {
  it('keeps navigation, altitude and camera rail aligned at every camp', () => {
    checkpoints.forEach((camp, index) => {
      expect(routeProgress(camp.progress)).toBeCloseTo(index / 4)
      expect(altitudeAt(camp.progress)).toBe(camp.altitude)
      expect(activeCheckpoint(camp.progress)).toBe(index)
      expect(visibilityAt(camp.progress, index)).toBe(1)
    })
  })
  it('is continuous and strictly ascends in both time directions', () => {
    let previous = -1
    for (let i = 0; i <= 2000; i++) {
      const value = routeProgress(i / 2000)
      expect(value).toBeGreaterThan(previous)
      if (previous >= 0) expect(value - previous).toBeLessThan(0.002)
      previous = value
    }
    expect(routeProgress(-1)).toBe(0)
    expect(routeProgress(2)).toBe(1)
  })
  it('slows near a camp without a scroll snap or a dead zone', () => {
    const approach = routeProgress(0.25) - routeProgress(0.249)
    const travel = routeProgress(0.125) - routeProgress(0.124)
    expect(approach).toBeGreaterThan(0)
    expect(approach).toBeLessThan(travel / 4)
  })
})

describe('procedural landscape and camera clearance', () => {
  for (const mobile of [false, true]) for (const reduced of [false, true]) {
    it(`keeps a rising camera outside the mountain, mobile=${mobile}, reduced=${reduced}`, () => {
      const rails = createCameraRails(mobile, reduced)
      let lastHeight = 0
      for (let i = 0; i <= 1000; i++) {
        const point = rails.position.getPoint(i / 1000)
        expect(point.y).toBeGreaterThanOrEqual(lastHeight)
        expect(Math.hypot(point.x, point.z) - radiusAt(point.y, Math.atan2(point.x, point.z))).toBeGreaterThan(65)
        lastHeight = point.y
      }
    })
  }
  it('places camp markers within the desktop field of view', () => {
    const rails = createCameraRails(false)
    const camera = new PerspectiveCamera(48, 1440 / 900, 1, 8000)
    checkpoints.forEach((_, index) => {
      camera.position.copy(rails.position.getPoint(index / 4))
      camera.lookAt(rails.target.getPoint(index / 4))
      camera.updateMatrixWorld()
      const marker = surfacePoint(CAMP_HEIGHTS[index], CAMP_ANGLES[index], 8).add(new Vector3(0, 22, 0)).project(camera)
      expect(Math.abs(marker.x)).toBeLessThan(0.9)
      expect(Math.abs(marker.y)).toBeLessThan(0.9)
      expect(marker.z).toBeLessThan(1)
    })
  })
  it('generates finite, outward-facing, bounded geometry', () => {
    const geometry = mountainGeometry(24)
    const position = geometry.getAttribute('position')
    const normal = geometry.getAttribute('normal')
    for (let index = 0; index < position.count; index++) {
      expect(Number.isFinite(position.getY(index))).toBe(true)
      expect(normal.getX(index) * position.getX(index) + normal.getZ(index) * position.getZ(index)).toBeGreaterThanOrEqual(-0.01)
    }
    expect(geometry.boundingSphere?.radius).toBeLessThan(1100)
    geometry.dispose()
  })
})
