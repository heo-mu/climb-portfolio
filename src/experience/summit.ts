import * as THREE from 'three'
import { contactPatch, groundPole, HangingRope, seatOnGround } from './grounding'
import { rockGeometry } from './props'
import { routePoint, TerrainSurface } from './terrain'
import { flagGeometry, flagMaterial } from './flags'

export function summitFlagGeometry() {
  return flagGeometry(1.7, 1.02, 4.19, '#b9baa2')
}

export function addSummit(world: THREE.Group, surface: TerrainSurface, wind: { value: number }, metal: THREE.Material, shadow: THREE.Material) {
  const end = routePoint(1), support = groundPole(surface, end.x + 2.1, end.z - 8, 4.4, .045)
  const summit = new THREE.Group(); summit.name = 'summit-arrival'
  summit.position.copy(support.foot); summit.quaternion.copy(support.rotation)
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(.025, .045, support.length, 14), metal)
  mast.position.y = (support.height - .18) / 2
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.034, 12, 8), metal); cap.position.y = support.height
  const collarMaterial = new THREE.MeshStandardMaterial({ color: '#a6aba3', metalness: .4, roughness: .6 })
  for (const height of [.1, 2.1, 3.22, 4.19]) {
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .055, 12), collarMaterial)
    collar.position.y = height; summit.add(collar)
  }
  const cloth = flagMaterial(wind, .24, true)
  cloth.emissive.set('#697947'); cloth.emissiveIntensity = .12
  const flag = new THREE.Mesh(summitFlagGeometry(), cloth); flag.name = 'summit-flag'
  summit.add(mast, cap, flag); world.add(summit)
  summit.updateMatrixWorld(true)

  const lineMaterial = new THREE.MeshStandardMaterial({ color: '#8e8978', roughness: .95 })
  for (const [dx, dz] of [[-1.1, -1.1], [1.6, .45]]) {
    const start = summit.localToWorld(new THREE.Vector3(0, 2.1, 0))
    const x = support.foot.x + dx, z = support.foot.z + dz
    const stake = groundPole(surface, x, z, .12)
    const peg = new THREE.Mesh(new THREE.CylinderGeometry(.022, .025, stake.length, 8), metal)
    peg.position.copy(stake.center); peg.quaternion.copy(stake.rotation)
    summit.parent!.add(peg, new THREE.Mesh(new THREE.TubeGeometry(new HangingRope(start, stake.anchor, .025), 20, .007, 5), lineMaterial))
  }

  const stone = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .98, flatShading: true })
  for (let i = 0; i < 5; i++) {
    const angle = i * 2.4, radius = .25 + (i % 2) * .2
    const rock = new THREE.Mesh(rockGeometry(i), stone)
    rock.position.set(support.foot.x + Math.cos(angle) * radius, 0, support.foot.z + Math.sin(angle) * radius)
    rock.rotation.y = angle; rock.scale.set(.28 + (i % 2) * .1, .2, .32)
    seatOnGround(rock, rock.geometry, surface, .07)
    world.add(rock)
  }
  world.add(new THREE.Mesh(contactPatch(surface, support.foot.x, support.foot.z, 1.5, 1.5), shadow))
}
