import { describe, expect, it } from 'vitest'
import { Vector3 } from 'three'
import { iceGeometry, rockGeometry, tentGeometry, tentVestibule } from '../src/experience/props'
import { groundHeight, routePoint } from '../src/experience/terrain'

describe('scene geometry', () => {
  it('keeps the walked corridor at the original route height', () => {
    for (let i = 0; i <= 100; i++) {
      const p = routePoint(i / 100)
      for (const offset of [-2, 0, 2]) expect(groundHeight(p.x + offset, p.z)).toBeCloseTo(p.y, 6)
    }
  })
  it('builds finite, bounded props with valid normals and indices', () => {
    const geometries = [tentGeometry(), tentVestibule(), ...Array.from({ length: 5 }, (_, seed) => [iceGeometry(seed), rockGeometry(seed)]).flat()]
    for (const geometry of geometries) {
      const positions = geometry.getAttribute('position'), normals = geometry.getAttribute('normal')
      for (const value of positions.array) expect(Number.isFinite(value)).toBe(true)
      for (const value of normals.array) expect(Number.isFinite(value)).toBe(true)
      if (geometry.index) for (const index of geometry.index.array) expect(index).toBeLessThan(positions.count)
      geometry.computeBoundingBox()
      const size = geometry.boundingBox!.getSize(new Vector3())
      expect(size.length()).toBeGreaterThan(1)
      expect(size.length()).toBeLessThan(8)
      geometry.dispose()
    }
  })
})
