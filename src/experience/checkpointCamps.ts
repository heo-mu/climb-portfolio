import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { arrivalCamps } from './campLayout'
import { cameraPose, TerrainSurface } from './terrain'
import { contactPatch, groundPole, HangingRope, seatOnGround } from './grounding'
import { flagGeometry, flagMaterial } from './flags'
import { scenePalette } from './scenePalette'
import { rockGeometry } from './props'

export function arrivalPosition(camp: typeof arrivalCamps[number]) {
  const position = new THREE.Vector3(), target = new THREE.Vector3()
  cameraPose(camp.route, position, target)
  const forward = target.sub(position).setY(0).normalize(), right = forward.clone().cross(new THREE.Vector3(0, 1, 0))
  return position.addScaledVector(forward, camp.forward).addScaledVector(right, camp.right)
}

function addEquipment(group: THREE.Group, surface: TerrainSurface, position: THREE.Vector3, metal: THREE.Material) {
  const cache = new THREE.Group(); cache.name = 'camp-equipment'
  cache.position.copy(position)
  cache.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), surface.normalAt(position.x, position.z))
  cache.rotateY(-.25)
  const shell = new RoundedBoxGeometry(.92, .46, .62, 2, .045)
  const material = new THREE.MeshStandardMaterial({ color: '#657374', roughness: .86 })
  cache.add(new THREE.Mesh(shell, material))
  const webbing = new THREE.MeshStandardMaterial({ color: scenePalette.webbing, roughness: 1 })
  for (const x of [-.29, .29]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(.045, .474, .632), webbing); strap.position.x = x; cache.add(strap)
  }
  const rim = new THREE.Mesh(new THREE.BoxGeometry(.91, .024, .62), metal); rim.position.y = .14; cache.add(rim)
  const handle = new THREE.Mesh(new THREE.TorusGeometry(.09, .015, 5, 12, Math.PI), metal)
  handle.position.set(0, .22, 0); cache.add(handle)
  seatOnGround(cache, shell, surface, .045)
  group.add(cache)
}

export function addCheckpointCamp(world: THREE.Group, surface: TerrainSurface, camp: typeof arrivalCamps[number], routeAnchors: THREE.Vector3[], wind: { value: number }, metal: THREE.Material, shadow: THREE.Material) {
  const position = arrivalPosition(camp), support = groundPole(surface, position.x, position.z, camp.height, .08)
  const group = new THREE.Group(); group.name = `arrival-${camp.id}`
  const marker = new THREE.Group(); marker.name = 'checkpoint-marker'
  marker.position.copy(support.foot); marker.quaternion.copy(support.rotation)
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.024, .036, support.length, 12), metal)
  pole.position.y = (camp.height - .18) / 2
  const top = camp.height - .14
  const cloth = new THREE.Mesh(flagGeometry(camp.width, camp.clothHeight, top, camp.color, camp.taper), flagMaterial(wind)); cloth.name = 'checkpoint-cloth'
  marker.add(pole, cloth)
  const tieMaterial = new THREE.MeshStandardMaterial({ color: '#b7ad96', roughness: .85 })
  for (const height of [.98, top, top - camp.clothHeight]) {
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(.041, .041, .04, 10), tieMaterial)
    collar.position.y = height; marker.add(collar)
  }
  group.add(marker); world.add(group); group.updateMatrixWorld(true)
  // A short branch joins the existing route collar, giving the marker a purpose.
  const anchor = marker.localToWorld(new THREE.Vector3(0, .98, 0))
  const nearest = routeAnchors.reduce((best, p) => p.distanceToSquared(anchor) < best.distanceToSquared(anchor) ? p : best)
  let sag = .11
  for (let i = 1; i < 32; i++) {
    const t = i / 32, p = nearest.clone().lerp(anchor, t)
    sag = Math.min(sag, (p.y - surface.heightAt(p.x, p.z) - .18) / (4 * t * (1 - t)))
  }
  const rope = new THREE.Mesh(new THREE.TubeGeometry(new HangingRope(nearest, anchor, Math.max(0, sag)), 28, .012, 6), tieMaterial)
  rope.name = 'camp-branch-rope'; group.add(rope)

  const stoneMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true })
  const stoneCount = camp.id === 'high-camp' ? 5 : 3
  for (let i = 0; i < stoneCount; i++) {
    const angle = .15 + i * .66, radius = camp.id === 'high-camp' ? 1.3 : .7
    const stone = new THREE.Mesh(rockGeometry((i + camp.seed) % 5), stoneMaterial)
    stone.position.set(position.x + Math.cos(angle) * radius, 0, position.z - Math.sin(angle) * radius)
    stone.scale.set(.3 + i * .03, .22, .35); stone.rotation.y = i * 1.7
    seatOnGround(stone, stone.geometry, surface, .075); group.add(stone)
  }
  group.add(new THREE.Mesh(contactPatch(surface, position.x, position.z, 2.4, 2.2), shadow))
  if (camp.cache) {
    const cachePosition = position.clone().add(new THREE.Vector3(-.1, 0, -1.4))
    addEquipment(group, surface, cachePosition, metal)
    group.add(new THREE.Mesh(contactPatch(surface, cachePosition.x, cachePosition.z, 1.5, 1.15), shadow))
  }
  return group
}
