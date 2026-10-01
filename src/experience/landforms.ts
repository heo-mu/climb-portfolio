import * as THREE from 'three'
import { noise2 } from './noise'
import { routePoint, seeded, TerrainSurface } from './terrain'
import { seatOnGround } from './grounding'

/** Broad fractured faces complement the smaller round boulders and narrow seracs. */
export function escarpmentGeometry(ice: boolean, seed: number) {
  const geometry = ice ? new THREE.BoxGeometry(2, 2, 2, 4, 5, 3) : new THREE.IcosahedronGeometry(1, 1)
  const positions = geometry.getAttribute('position'), colors: number[] = []
  const base = new THREE.Color(ice ? '#638ea4' : '#45515d')
  const cap = new THREE.Color(ice ? '#c4dbe0' : '#bacad0'), color = new THREE.Color()
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i), v = (y + 1) / 2
    const n = noise2(x * 2 + seed * 7, z * 2 + v * .6)
    const cleft = Math.pow(.5 + .5 * Math.sin(x * 7 + z * 2 + seed), 8)
    positions.setXYZ(i, x * (1 - v * .12) + v * .12, y + v * (n * .35 - cleft * .3), z + v * (.15 * n - .12))
    const snow = THREE.MathUtils.smoothstep(y + n * .4, .3, 1)
    color.copy(base).lerp(cap, snow).multiplyScalar(.84 + n * .22 - cleft * .12)
    colors.push(color.r, color.g, color.b)
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
  return geometry
}

export function addLandforms(world: THREE.Group, surface: TerrainSurface, clearCamp: (x: number, z: number, radius: number, side: number) => number) {
  const dummy = new THREE.Object3D()
  for (const ice of [false, true]) for (let variant = 0; variant < 2; variant++) {
    const geometry = escarpmentGeometry(ice, variant)
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: ice ? .54 : .98, flatShading: true })
    const mesh = new THREE.InstancedMesh(geometry, material, ice ? 12 : 15)
    mesh.name = ice ? 'glacier-walls' : 'rock-buttresses'
    let count = 0
    for (let i = 0; i < mesh.count; i++) {
      const seed = i + variant * 129 + (ice ? 770 : 330), u = seeded(seed)
      const t = ice ? .125 + u * .19 : i < 5 ? .025 + u * .065 : .595 + u * .19
      const p = routePoint(t), side = i % 3 === 0 ? -1 : 1
      const width = ice ? 2.4 + seeded(seed + 2) * 3 : 2 + seeded(seed + 2) * 3.5
      const height = ice ? 2.5 + seeded(seed + 3) * 3.5 : 1.5 + seeded(seed + 3) * 3
      const minimumOffset = 7 + width * 1.5
      let offset = minimumOffset + seeded(seed + 4) * (ice ? 12 : 17)
      while (offset > minimumOffset && surface.normalAt(p.x + side * offset, p.z, width).y < .8) offset = Math.max(minimumOffset, offset - 1)
      const x = clearCamp(p.x + side * offset, p.z, width * 1.5, side)
      dummy.position.set(x, 0, p.z)
      const normal = surface.normalAt(x, p.z, width)
      // A base contact alone is not enough on a sheer wall: viewed from below,
      // the whole exposed underside reads as a floating prop. Use real shelves.
      if (normal.y < .8) continue
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 1, 0).lerp(normal, ice ? .28 : .65).normalize())
      dummy.rotateY((seeded(seed + 5) - .5) * .7)
      dummy.scale.set(width, height, ice ? 1.4 + u * 2 : 2.5 + u * 3)
      seatOnGround(dummy, geometry, surface, height * (.28 + (1 - normal.y) * .5))
      if (!ice) {
        // Cliff outcrops expose only their outer cap; a whole freestanding boulder
        // balanced on a tilted bottom vertex reads as levitating from below.
        dummy.position.y = Math.min(dummy.position.y, surface.heightAt(x, p.z) - height * .55)
        dummy.updateMatrix()
      }
      mesh.setMatrixAt(count++, dummy.matrix)
    }
    mesh.count = count
    world.add(mesh)
  }
}
