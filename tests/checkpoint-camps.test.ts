import { afterAll, describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { arrivalCamps } from '../src/experience/campLayout'
import { environmentStages } from '../src/experience/environment'
import { cameraPose, TerrainSurface } from '../src/experience/terrain'

const world = new THREE.Group()
for (const stage of environmentStages(world, { value: 0 })) void stage
world.updateMatrixWorld(true)
const terrain = world.getObjectByName('alpine-terrain') as THREE.Mesh
const surface = new TerrainSurface(terrain.geometry)
afterAll(() => {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>()
  world.traverse(object => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
      geometries.add(object.geometry)
      if (Array.isArray(object.material)) object.material.forEach(material => materials.add(material))
      else materials.add(object.material)
    }
  })
  geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose())
})

describe('checkpoint arrival dressing', () => {
  it('embeds new landform feet in the rendered terrain', () => {
    const matrix = new THREE.Matrix4(), point = new THREE.Vector3()
    world.traverse(object => {
      if (!(object instanceof THREE.InstancedMesh) || !['glacier-walls', 'rock-buttresses'].includes(object.name)) return
      object.geometry.computeBoundingBox()
      const bounds = object.geometry.boundingBox!, threshold = bounds.min.y + (bounds.max.y - bounds.min.y) * .09
      const vertices = object.geometry.getAttribute('position')
      for (let instance = 0; instance < object.count; instance++) {
        object.getMatrixAt(instance, matrix)
        matrix.premultiply(object.matrixWorld)
        for (let i = 0; i < vertices.count; i++) {
          if (vertices.getY(i) > threshold) continue
          point.fromBufferAttribute(vertices, i).applyMatrix4(matrix)
          expect(point.y - surface.heightAt(point.x, point.z)).toBeLessThan(.005)
        }
      }
    })
  })

  it('keeps a readable cloth silhouette in the real arrival camera for every camp', () => {
    for (const camp of arrivalCamps) {
      const group = world.getObjectByName(`arrival-${camp.id}`)!
      const cloth = group.getObjectByName('checkpoint-cloth') as THREE.Mesh
      expect(cloth).toBeDefined()
      const camera = new THREE.PerspectiveCamera(64, 1.6, .08, 2400), target = new THREE.Vector3()
      cameraPose(camp.route, camera.position, target); camera.lookAt(target); camera.updateMatrixWorld(true)
      const positions = cloth.geometry.getAttribute('position')
      for (let i = 0; i < positions.count; i++) {
        const p = new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(cloth.matrixWorld).project(camera)
        expect(p.x).toBeGreaterThan(.15)
        expect(p.x).toBeLessThan(.93)
        expect(Math.abs(p.y)).toBeLessThan(.9)
        // Projects has a wider panel; its pennant sits above the project artwork.
        if (camp.id === 'high-camp') expect(p.y).toBeGreaterThan(.39)
      }
    }
  })

  it('grounds camp rope branches and equipment on the same rendered surface', () => {
    for (const camp of arrivalCamps) {
      const group = world.getObjectByName(`arrival-${camp.id}`)!
      const rope = group.getObjectByName('camp-branch-rope') as THREE.Mesh
      const positions = rope.geometry.getAttribute('position')
      for (let i = 0; i < positions.count; i++) {
        const p = new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(rope.matrixWorld)
        expect(p.y - surface.heightAt(p.x, p.z)).toBeGreaterThan(.12)
      }
    }
    const equipment = world.getObjectByName('camp-equipment')!
    const bottom = new THREE.Vector3(0, -.23, 0).applyMatrix4(equipment.matrixWorld)
    expect(Math.abs(bottom.y - surface.heightAt(bottom.x, bottom.z))).toBeLessThan(.15)
  })

  it('provides a sheltered first camp and keeps occupied tent floors seated', () => {
    const tents: THREE.Object3D[] = []
    world.traverse(object => { if (object.name === 'camp-tent') tents.push(object) })
    expect(tents.filter(tent => tent.userData.checkpoint === 'about')).toHaveLength(1)
    expect(tents.filter(tent => tent.userData.checkpoint === 'camp-two')).toHaveLength(1)
    for (const tent of tents.filter(tent => tent.userData.checkpoint !== 'base-camp')) {
      for (const x of [-1.225, 1.225]) for (const z of [-1.84, 1.84]) {
        const p = new THREE.Vector3(x, -.13, z).applyMatrix4(tent.matrixWorld)
        expect(p.y - surface.heightAt(p.x, p.z)).toBeLessThan(.005)
      }
      const normal = new THREE.Vector3(0, 1, 0).applyQuaternion(tent.quaternion)
      expect(normal.y).toBeGreaterThan(.96)
    }
  })
})
