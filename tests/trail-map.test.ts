import { describe, expect, it } from 'vitest'
import { routeLateralAt } from '../src/data/ascentRoute'
import { routePoint } from '../src/experience/terrain'
import { createTrailMap } from '../src/experience/trailMap'
import { checkpoints } from '../src/data/expedition'

describe('camera-derived trail navigation', () => {
  it('aligns both vertical endpoints and balances bends around their shared axis', () => {
    const map = createTrailMap(160, 378), axis = map.at(0).x
    expect(map.at(1).x).toBe(axis)
    const offsets = Array.from({ length: 281 }, (_, i) => map.at(i / 280).x - axis)
    expect(Math.abs(offsets.reduce((sum, x) => sum + x, 0) / offsets.length)).toBeLessThan(.001)
    expect(Math.max(...offsets)).toBeGreaterThan(15)
    expect(Math.min(...offsets)).toBeLessThan(-15)
  })
  it('shares every lateral bend with the actual camera spline', () => {
    for (let i = 0; i <= 560; i++) expect(routeLateralAt(i / 560)).toBeCloseTo(routePoint(i / 560).x, 8)
  })
  it('places checkpoints at the same route value as the camera and continuously retraces its stroke', () => {
    for (const map of [createTrailMap(160, 378), createTrailMap(342, 56, true)]) {
      const start = map.at(0), end = map.at(1)
      for (const [index, camp] of checkpoints.entries()) {
        const point = map.at(camp.progress)
        const fraction = map.horizontal ? (point.x - start.x) / (end.x - start.x) : (point.y - start.y) / (end.y - start.y)
        expect(fraction, 'equal-distance camp placement on the journey axis').toBeCloseTo(index / 5, 8)
      }
      let previous = map.at(0)
      for (let i = 1; i <= 2000; i++) {
        const current = map.at(i / 2000)
        expect(current.length).toBeGreaterThan(previous.length)
        expect(Math.hypot(current.x - previous.x, current.y - previous.y)).toBeLessThan(2)
        previous = current
      }
      for (let i = 1999; i >= 0; i--) {
        const current = map.at(i / 2000)
        expect(current.length).toBeLessThan(previous.length)
        previous = current
      }
      expect(map.at(0).length).toBe(0)
      expect(map.at(1).length).toBe(map.length)
    }
  })
})
