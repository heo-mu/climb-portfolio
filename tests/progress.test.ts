import { describe, expect, it } from 'vitest'
import { activeCheckpoint, altitudeAt, routeProgress, visibilityAt } from '../src/experience/progress'
import { checkpoints } from '../src/data/expedition'
import { cameraPose, groundHeight, routeCurve, terrainGeometry } from '../src/experience/terrain'
import { experienceConfig } from '../src/config/experience'
import { Vector3 } from 'three'

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

describe('first-person route', () => {
  it('stays at eye height, moves forward and turns continuously through the terrain', () => {
    const position = new Vector3(), target = new Vector3(), previous = new Vector3(), heading = new Vector3(), lastHeading = new Vector3()
    expect(routeCurve.points.length).toBeGreaterThan(20)
    let sideways = 0
    for (let i = 0; i <= 2000; i++) {
      cameraPose(i / 2000, position, target)
      expect(position.y - groundHeight(position.x, position.z)).toBeCloseTo(experienceConfig.camera.eyeHeight)
      expect(target.z).toBeLessThan(position.z)
      expect(position.toArray().every(Number.isFinite)).toBe(true)
      heading.copy(target).sub(position).normalize()
      if (i) {
        expect(position.z).toBeLessThan(previous.z)
        expect(position.distanceTo(previous)).toBeLessThan(1)
        expect(heading.angleTo(lastHeading)).toBeLessThan(0.035)
        sideways += Math.abs(position.x - previous.x)
      }
      previous.copy(position); lastHeading.copy(heading)
    }
    expect(sideways).toBeGreaterThan(250)
    expect(position.y).toBeGreaterThan(300)
  })
  it('retraces the same physical pose when descending', () => {
    const up = new Vector3(), upTarget = new Vector3(), down = new Vector3(), downTarget = new Vector3()
    for (const t of [0, 0.12, 0.25, 0.49, 0.73, 0.9, 1]) {
      cameraPose(routeProgress(t), up, upTarget)
      cameraPose(1, down, downTarget)
      cameraPose(routeProgress(t), down, downTarget)
      expect(down.equals(up)).toBe(true)
      expect(downTarget.equals(upTarget)).toBe(true)
    }
  })
  it('builds a finite, upward-facing continuous terrain instead of an exterior cone', () => {
    const geometry = terrainGeometry()
    const positions = geometry.getAttribute('position'), normals = geometry.getAttribute('normal')
    for (let i = 0; i < positions.count; i++) {
      expect(Number.isFinite(positions.getY(i))).toBe(true)
      expect(normals.getY(i)).toBeGreaterThan(0)
    }
    geometry.dispose()
  })
})
