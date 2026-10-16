import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { checkpointAt } from '../src/data/checkpoints'
import { addSystemsLandmark } from '../src/experience/systemsLandmark'
import { cameraFieldOfView, cameraPose, terrainGeometry, TerrainSurface } from '../src/experience/terrain'

describe('Systems camp', () => {
  it('grounds all four supports and keeps a legible, static silhouette at each viewport', () => {
    const geometry = terrainGeometry(), surface = new TerrainSurface(geometry), world = new THREE.Group()
    const metal = new THREE.MeshStandardMaterial(), shadow = new THREE.MeshBasicMaterial()
    const landmark = addSystemsLandmark(world, surface, metal, shadow)
    world.updateMatrixWorld(true)
    const supports = landmark.userData.supports as { ground: number; world: number[] }[]
    expect(supports).toHaveLength(4)
    for (const foot of supports) expect(foot.ground).toBeCloseTo(surface.heightAt(foot.world[0], foot.world[2]), 8)
    let meshes = 0, vertices = 0
    world.traverse(object => {
      if (object instanceof THREE.Mesh) {
        meshes++; vertices += object.geometry.getAttribute('position').count
        expect(object.castShadow).toBe(false)
      }
    })
    expect(meshes).toBe(4)
    expect(vertices).toBeLessThan(2500)
    const box = new THREE.Box3().setFromObject(landmark)
    for (const [width, height] of [[1920, 1080], [1440, 900], [1280, 800], [390, 844]]) {
      const progress = checkpointAt('systems').progress
      const camera = new THREE.PerspectiveCamera(cameraFieldOfView(progress, width / height, width), width / height, .08, 2400)
      const target = new THREE.Vector3()
      cameraPose(progress, camera.position, target); camera.lookAt(target); camera.updateMatrixWorld(true)
      for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
        const point = new THREE.Vector3(x, y, z).project(camera)
        expect(Math.abs(point.x), `landmark at ${width}px`).toBeLessThan(1)
        expect(Math.abs(point.y)).toBeLessThan(1)
        expect(point.z).toBeGreaterThan(-1)
        expect(point.z).toBeLessThan(1)
      }
    }
    world.traverse(object => {
      if (object instanceof THREE.Mesh) { object.geometry.dispose(); (object.material as THREE.Material).dispose() }
    })
    geometry.dispose()
  })
})
