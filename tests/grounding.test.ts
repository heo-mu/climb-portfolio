import { afterAll, describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { cameraPose, routePoint, seeded, terrainGeometry, TerrainSurface } from '../src/experience/terrain'
import { guideRoute, ROPE_CLEARANCE, ROPE_RADIUS, seatOnGround } from '../src/experience/grounding'
import { iceGeometry, rockGeometry } from '../src/experience/props'
import { addSummit } from '../src/experience/summit'

const terrain = terrainGeometry(), surface = new TerrainSurface(terrain)
afterAll(() => terrain.dispose())

describe('rendered terrain grounding', () => {
  it('matches ray intersections on both triangle halves across slopes and route turns', () => {
    const mesh = new THREE.Mesh(terrain, new THREE.MeshBasicMaterial()), ray = new THREE.Raycaster()
    for (let i = 0; i < 90; i++) {
      const p = routePoint(seeded(i + 1)), x = p.x + (seeded(i + 63) - .5) * 140, z = p.z
      ray.set(new THREE.Vector3(x, 1500, z), new THREE.Vector3(0, -1, 0))
      const hit = ray.intersectObject(mesh)[0]
      expect(hit).toBeDefined()
      expect(Math.abs(surface.heightAt(x, z) - hit.point.y)).toBeLessThan(.002)
      expect(surface.sample(x, z).normal.y).toBeGreaterThan(0)
    }
    mesh.material.dispose()
  })

  it('buries every support foot and connects sagging spans at the actual pole collars', () => {
    const { poles, ropes } = guideRoute(surface)
    for (const pole of poles) {
      const bottom = pole.center.clone().addScaledVector(pole.axis, -pole.length / 2)
      expect(bottom.y).toBeLessThan(surface.heightAt(bottom.x, bottom.z) - .1)
      expect(pole.anchor.clone().sub(pole.foot).cross(pole.axis).length()).toBeLessThan(1e-8)
    }
    ropes.forEach((rope, i) => {
      expect(rope.getPoint(0).distanceTo(poles[i].anchor)).toBeLessThan(1e-8)
      expect(rope.getPoint(1).distanceTo(poles[i + 1].anchor)).toBeLessThan(1e-8)
      expect(rope.sag).toBeGreaterThan(0)
      for (let n = 0; n <= 128; n++) {
        const p = rope.getPoint(n / 128)
        expect(p.y - surface.heightAt(p.x, p.z) - ROPE_RADIUS).toBeGreaterThan(ROPE_CLEARANCE - .025)
      }
    })
  })

  it('seats the lower hull of rotated, scaled rock and ice variants on steep terrain', () => {
    for (let i = 0; i < 20; i++) {
      const geometry = i % 2 ? rockGeometry(i % 5) : iceGeometry(i % 5)
      const object = new THREE.Object3D(), p = routePoint(.08 + i * .04)
      object.position.set(p.x + 15 + i, 0, p.z)
      object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), surface.normalAt(object.position.x, p.z))
      object.rotateY(i); object.scale.set(2.1, 1.8, 2.4)
      seatOnGround(object, geometry, surface, .12)
      const bounds = geometry.boundingBox!, positions = geometry.getAttribute('position')
      for (let n = 0; n < positions.count; n++) {
        if (positions.getY(n) > bounds.min.y + (bounds.max.y - bounds.min.y) * .09) continue
        const point = new THREE.Vector3().fromBufferAttribute(positions, n).applyMatrix4(object.matrix)
        expect(point.y - surface.heightAt(point.x, point.z)).toBeLessThan(-.119)
      }
      geometry.dispose()
    }
  })

  it('places the summit cloth inside the arrival view and to the right of the content panel', () => {
    const world = new THREE.Group(), material = new THREE.MeshBasicMaterial()
    addSummit(world, surface, { value: 0 }, material, material)
    world.updateMatrixWorld(true)
    const camera = new THREE.PerspectiveCamera(64, 1440 / 900, .08, 2400), target = new THREE.Vector3()
    cameraPose(1, camera.position, target); camera.lookAt(target); camera.updateMatrixWorld(true)
    const flag = world.getObjectByName('summit-flag') as THREE.Mesh
    const p = flag.geometry.getAttribute('position')
    for (let i = 0; i < p.count; i++) {
      const projected = new THREE.Vector3().fromBufferAttribute(p, i).applyMatrix4(flag.matrixWorld).project(camera)
      expect(projected.x).toBeGreaterThan(.15)
      expect(projected.x).toBeLessThan(.85)
      expect(Math.abs(projected.y)).toBeLessThan(.85)
      expect(projected.z).toBeLessThan(1)
    }
    world.traverse(object => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); if (!Array.isArray(object.material)) object.material.dispose() } })
  })
})
