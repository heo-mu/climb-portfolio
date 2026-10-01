import * as THREE from 'three'
import { contactPatch, groundPole, seatOnGround } from './grounding'
import { rockGeometry } from './props'
import { cameraPose, TerrainSurface } from './terrain'
import { flagGeometry, flagMaterial } from './flags'
import { scenePalette } from './scenePalette'

export function summitFlagGeometry() {
  const geometry = flagGeometry(1.5, .92, 4.18, scenePalette.summit, .06)
  // One fabric color; curvature and lighting supply the folds.
  geometry.deleteAttribute('color')
  return geometry
}

export function addSummit(world: THREE.Group, surface: TerrainSurface, wind: { value: number }, shadow: THREE.Material) {
  const position = new THREE.Vector3(), target = new THREE.Vector3()
  cameraPose(1, position, target)
  const forward = target.sub(position).setY(0).normalize()
  const right = forward.clone().cross(new THREE.Vector3(0, 1, 0))
  position.addScaledVector(forward, 7.8).addScaledVector(right, 2.8)
  const support = groundPole(surface, position.x, position.z, 4.34, .025)
  const summit = new THREE.Group(); summit.name = 'summit-arrival'
  summit.position.copy(support.foot); summit.quaternion.copy(support.rotation)
  const metal = new THREE.MeshStandardMaterial({ color: '#303b40', metalness: .45, roughness: .64 })
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(.016, .024, support.length, 16), metal)
  mast.name = 'summit-mast'
  mast.position.y = (support.height - .18) / 2
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.019, 12, 8), metal); cap.position.y = support.height
  for (const height of [3.26, 4.18]) {
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(.027, .027, .035, 12), metal)
    collar.position.y = height; summit.add(collar)
  }
  const cloth = flagMaterial(wind, .12, .03)
  cloth.vertexColors = false; cloth.color.set(scenePalette.summit)
  cloth.emissive.set(scenePalette.summit); cloth.emissiveIntensity = .035
  const flag = new THREE.Mesh(summitFlagGeometry(), cloth); flag.name = 'summit-flag'
  summit.add(mast, cap, flag); world.add(summit)
  summit.updateMatrixWorld(true)

  const stone = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .98, flatShading: true })
  const rock = new THREE.Mesh(rockGeometry(3), stone); rock.name = 'summit-footing'
  rock.position.set(support.foot.x + .06, 0, support.foot.z + .02)
  rock.rotation.y = .65; rock.scale.set(.24, .15, .23)
  seatOnGround(rock, rock.geometry, surface, .055)
  world.add(rock, new THREE.Mesh(contactPatch(surface, support.foot.x, support.foot.z, .8, .7), shadow))
}
