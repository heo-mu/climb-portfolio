import * as THREE from 'three'
import { contactPatch, groundPole, seatOnGround } from './grounding'
import { rockGeometry } from './props'
import { cameraPose, TerrainSurface } from './terrain'
import { flagGeometry, flagMaterial } from './flags'
import { scenePalette } from './scenePalette'
import { alpineWind } from './worldMood'

/** Bounded multi-frequency flutter; the entire hoist edge remains anchored. */
export function summitClothOffset(u: number, v: number, time: number) {
  const envelope = u * u
  const gust = .82 + .18 * Math.sin(time * .73 + Math.sin(time * .31))
  const wave = u * 7.5 - time * 4.6 + v * 1.3
  return {
    y: envelope * (.045 * Math.sin(wave * 1.3 + time * .6) + .016 * Math.sin(u * 17 - time * 8.1)),
    z: envelope * gust * (.24 * Math.sin(wave) + .07 * Math.sin(u * 13.2 - time * 7.3 - v * 2)),
  }
}

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
  const cloth = flagMaterial(wind, .12, 0)
  cloth.vertexColors = false; cloth.color.set(scenePalette.summit)
  cloth.emissive.set(scenePalette.summit); cloth.emissiveIntensity = .035
  const flag = new THREE.Mesh(summitFlagGeometry(), cloth); flag.name = 'summit-flag'
  // Align the cloth's downstream axis with the same world wind used by snow.
  flag.rotation.y = -Math.atan2(alpineWind.z, alpineWind.x)
  const positions = flag.geometry.getAttribute('position') as THREE.BufferAttribute
  const rest = positions.array.slice(), uv = flag.geometry.getAttribute('uv')
  positions.setUsage(THREE.DynamicDrawUsage)
  flag.geometry.boundingSphere!.radius += .36
  let lastTime = -1
  flag.onBeforeRender = () => {
    if (wind.value === lastTime) return
    lastTime = wind.value
    for (let i = 0; i < positions.count; i++) {
      const offset = summitClothOffset(uv.getX(i), uv.getY(i), wind.value)
      positions.setXYZ(i, rest[i * 3], rest[i * 3 + 1] + offset.y, rest[i * 3 + 2] + offset.z)
    }
    positions.needsUpdate = true
    flag.geometry.computeVertexNormals()
  }
  summit.add(mast, cap, flag); world.add(summit)
  summit.updateMatrixWorld(true)

  const stone = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .98, flatShading: true })
  const rock = new THREE.Mesh(rockGeometry(3), stone); rock.name = 'summit-footing'
  rock.position.set(support.foot.x + .06, 0, support.foot.z + .02)
  rock.rotation.y = .65; rock.scale.set(.24, .15, .23)
  seatOnGround(rock, rock.geometry, surface, .055)
  world.add(rock, new THREE.Mesh(contactPatch(surface, support.foot.x, support.foot.z, .8, .7), shadow))
}
