import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { checkpointAt } from '../data/checkpoints'
import { cameraPose, type TerrainSurface } from './terrain'
import { contactPatch } from './grounding'

/** Six open modules, one assembly. Built once; no animation, textures or shadows. */
export function addSystemsLandmark(world: THREE.Group, surface: TerrainSurface, metal: THREE.Material, shadow: THREE.Material) {
  const group = new THREE.Group(); group.name = 'arrival-systems'
  const eye = new THREE.Vector3(), target = new THREE.Vector3()
  cameraPose(checkpointAt('systems').progress, eye, target)
  const forward = target.sub(eye).setY(0).normalize()
  const right = forward.clone().cross(new THREE.Vector3(0, 1, 0))
  const center = eye.clone().addScaledVector(forward, 18).addScaledVector(right, 4)
  group.position.set(center.x, 0, center.z)
  group.rotation.y = Math.atan2(right.z * -1, right.x)
  const at = (x: number, z: number) => new THREE.Vector3(center.x + right.x * x - forward.x * z, 0, center.z + right.z * x - forward.z * z)
  const supports = [-.9, .9].flatMap(x => [-.3, .3].map(z => ({ x, z, ground: surface.heightAt(at(x, z).x, at(x, z).z) })))
  const base = Math.max(...supports.map(p => p.ground)) + .16
  const parts: THREE.BufferGeometry[] = []
  const box = (w: number, h: number, d: number, x: number, y: number, z = 0) => parts.push(new THREE.BoxGeometry(w, h, d).translate(x, y, z))
  // Each foot embeds in the rendered terrain independently; the frame stays level.
  for (const foot of supports) {
    const bottom = foot.ground - .14, top = base + .12
    box(.09, top - bottom, .09, foot.x, (top + bottom) / 2, foot.z)
  }
  for (const x of [-.9, .9]) box(.08, .08, .72, x, base)
  box(2.04, .09, .1, 0, base + .12)
  for (let row = 0; row < 3; row++) for (let col = 0; col < 2; col++) {
    const x = (col - .5) * .96, y = base + .6 + row * .96
    for (const dx of [-.4, .4]) box(.045, .84, .12, x + dx, y)
    for (const dy of [-.4, .4]) box(.84, .045, .12, x, y + dy)
  }
  const frame = new THREE.Mesh(mergeGeometries(parts)!, metal); frame.name = 'systems-module-frame'
  parts.forEach(part => part.dispose()); group.add(frame)
  // Inset plates show assembly depth without reading as another screen.
  const plates: THREE.BufferGeometry[] = []
  for (const [col, row] of [[0, 0], [1, 1], [0, 2]]) plates.push(new THREE.BoxGeometry(.58, .58, .055).translate((col - .5) * .96, base + .6 + row * .96, .025))
  const plateMaterial = new THREE.MeshStandardMaterial({ color: '#879b9e', metalness: .28, roughness: .72 })
  group.add(new THREE.Mesh(mergeGeometries(plates)!, plateMaterial)); plates.forEach(plate => plate.dispose())
  const signal = new THREE.Mesh(new THREE.BoxGeometry(.14, .035, .13), new THREE.MeshStandardMaterial({ color: '#a8bb69', roughness: .8 }))
  signal.position.set(.48, base + 2.92, 0); group.add(signal)
  world.add(group)
  const patch = new THREE.Mesh(contactPatch(surface, center.x, center.z, 2.6, 1.2, group.rotation.y), shadow)
  patch.name = 'systems-contact'; world.add(patch)
  group.userData.checkpoint = 'systems'
  group.userData.supports = supports.map(foot => ({ ...foot, world: at(foot.x, foot.z).toArray() }))
  return group
}
