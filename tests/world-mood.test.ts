import { describe, expect, it } from 'vitest'
import { checkpoints } from '../src/data/expedition'
import { worldMood } from '../src/experience/worldMood'
import { groundHeight, routePoint } from '../src/experience/terrain'
import { escarpmentGeometry } from '../src/experience/landforms'
import { summitClothOffset } from '../src/experience/summit'

describe('differentiated ascent', () => {
  it('keeps the flag attached and its free edge bounded throughout gusts', () => {
    let outerMotion = 0
    for (let time = 0; time <= 12; time += .025) {
      for (const v of [0, .5, 1]) {
        const anchor = summitClothOffset(0, v, time)
        expect(Math.abs(anchor.y)).toBe(0)
        expect(Math.abs(anchor.z)).toBe(0)
        const outer = summitClothOffset(1, v, time)
        const next = summitClothOffset(1, v, time + .025)
        expect(Math.abs(outer.z)).toBeLessThanOrEqual(.31)
        expect(Math.abs(outer.y)).toBeLessThanOrEqual(.061)
        expect(Math.abs(next.z - outer.z)).toBeLessThan(.05)
        outerMotion = Math.max(outerMotion, Math.abs(outer.z))
      }
    }
    expect(outerMotion).toBeGreaterThan(.2)
  })
  it('opens the basin and exposes the face without changing the walking corridor', () => {
    const basin = routePoint(.46), glacier = routePoint(.2), face = routePoint(.69)
    expect(groundHeight(basin.x + 30, basin.z) - basin.y).toBeLessThan(5)
    expect(groundHeight(glacier.x + 30, glacier.z) - glacier.y).toBeGreaterThan(20)
    expect(groundHeight(face.x + 30, face.z) - groundHeight(face.x - 30, face.z)).toBeGreaterThan(35)
  })

  it('reserves the strongest weather for the final approach, then clears at the summit', () => {
    const peak = worldMood(.9), summit = worldMood(1), basin = worldMood(.5)
    expect(peak.storm).toBe(1)
    expect(peak.windSpeed).toBeGreaterThan(basin.windSpeed * 5)
    expect(peak.snowDensity).toBeGreaterThan(basin.snowDensity * 4)
    // Keep nearby route supports visible even at peak exponential fog.
    expect(Math.exp(-Math.pow(peak.fog * 40, 2))).toBeGreaterThan(.45)
    expect(summit.fog).toBeLessThan(peak.fog / 5)
    expect(summit.snowDensity).toBeLessThan(peak.snowDensity / 4)
    expect(summit.key).toBeGreaterThan(peak.key * 2)
    expect(summit.ambient).toBeGreaterThan(worldMood(0).ambient)
    expect(summit.fog).toBeGreaterThan(0)
    for (const camp of checkpoints) expect(worldMood(camp.progress).storm).toBe(0)
  })

  it('keeps lighting and weather continuous through every stage boundary', () => {
    const keys = ['key', 'ambient', 'fog', 'snowDensity', 'windSpeed'] as const
    let previous = worldMood(0)
    for (let i = 1; i <= 2000; i++) {
      const current = worldMood(i / 2000)
      for (const key of keys) {
        expect(Number.isFinite(current[key])).toBe(true)
        expect(Math.abs(current[key] - previous[key])).toBeLessThan(.16)
      }
      previous = current
    }
  })

  it('builds bounded fractured landforms with finite normals', () => {
    for (const ice of [false, true]) for (const seed of [0, 1]) {
      const geometry = escarpmentGeometry(ice, seed)
      for (const name of ['position', 'normal', 'color']) {
        for (const value of geometry.getAttribute(name).array) expect(Number.isFinite(value)).toBe(true)
      }
      geometry.computeBoundingBox()
      expect(geometry.boundingBox!.min.y).toBeLessThan(-.8)
      expect(geometry.boundingBox!.max.y).toBeLessThan(1.4)
      geometry.dispose()
    }
  })
})
