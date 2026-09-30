import * as THREE from 'three'
import { experienceConfig } from '../config/experience'
import { noise2, terrainNoise } from './noise'

// 29 independent route controls: exit, ice approach, switchbacks, traverse,
// sheltered camps, exposed ridge and final shoulder. World units are metres.
const xy = [
  [0, 0], [3, 0.2], [12, 1], [25, 4], [35, 12], [24, 23], [0, 37],
  [-12, 39], [-15, 40], [0, 47], [28, 65], [47, 81], [38, 99], [15, 117],
  [5, 118], [5, 119], [18, 127], [44, 145], [72, 168], [84, 193], [78, 207],
  [63, 208], [45, 209], [36, 222], [46, 245], [69, 273], [83, 297], [83, 304], [78, 305],
]
export const routeCurve = new THREE.CatmullRomCurve3(xy.map(([x, y], i) => new THREE.Vector3(x, y, -i * 40)), false, 'catmullrom', 0.5)
const depth = experienceConfig.route.depth
const ease = (a: number, b: number, x: number) => THREE.MathUtils.smoothstep(x, a, b)
export const seeded = (i: number) => { const n = Math.sin(i * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n) }

export function routePoint(t: number, out = new THREE.Vector3()) {
  return routeCurve.getPoint(THREE.MathUtils.clamp(t, 0, 1), out)
}

function surfaceHeight(offset: number, z: number, base: number) {
  const t = -z / depth
  const d = Math.abs(offset)
  const opening = 20 + 32 * Math.exp(-Math.pow(t / 0.075, 2)) - 13 * Math.exp(-Math.pow((t - 0.18) / 0.095, 2)) + 22 * Math.exp(-Math.pow((t - 0.43) / 0.1, 2))
  const wall = Math.max(0, d - opening)
  const irregular = 1 + 0.24 * Math.sin(z * 0.029 + offset * 0.013) + 0.13 * Math.sin(z * 0.073 - offset * 0.05)
  const wallHeight = 145 + 45 * Math.sin(z * 0.011) + 20 * Math.cos(z * 0.027)
  const valley = wallHeight * (1 - Math.exp(-wall / 65)) * irregular
  const traverse = ease(0.49, 0.61, t) * (1 - ease(0.72, 0.82, t))
  const ridge = ease(0.77, 0.91, t)
  const leftFall = -Math.max(0, d - 4) * 0.82
  const ridgeWidth = 3 + 14 * ease(0.96, 1, t)
  const ridgeFall = -Math.pow(Math.max(0, d - ridgeWidth), 0.87) * 1.4
  const flank = THREE.MathUtils.lerp(valley, offset < 0 ? leftFall : valley * 1.3, traverse)
  const profile = THREE.MathUtils.lerp(flank, ridgeFall, ridge)
  // Leave the walked corridor untouched; snow banks and eroded flanks carry detail.
  const rough = ((terrainNoise(offset * 0.065, z * 0.045) - 0.5) * (1.3 + ease(12, 100, d) * 12)
    + Math.pow(noise2(offset * 0.18, z * 0.013), 3) * ease(15, 60, d) * 3) * ease(2.8, 12, d)
  const bankCenter = 6.5 + noise2(z * .017, offset > 0 ? 4 : 11) * 5
  const drift = Math.exp(-Math.pow((d - bankCenter) / 4.2, 2)) * (1.1 + noise2(z * .043, offset * .015) * 1.8)
  const erosion = (noise2(z * .045 + Math.sin(offset * .018), offset * .028) - .5) * 16 * ease(3, 38, wall)
  const shelf = Math.sin(z * .035 + offset * .08) * .5 * ease(12, 32, d)
  return base + profile + rough + (drift + erosion + shelf) * ease(2.8, 5.5, d) * (1 - ridge * .65)
}

export function groundHeight(x: number, z: number) {
  const p = routePoint(-z / depth)
  // Beyond the summit the ground falls away, revealing the horizon.
  const extension = z < -depth ? -Math.max(0, -z - depth - 4) * 0.42 : 0
  return surfaceHeight(x - p.x, z, p.y + extension)
}

export function cameraPose(route: number, position: THREE.Vector3, target: THREE.Vector3) {
  routePoint(route, position)
  position.y = groundHeight(position.x, position.z) + experienceConfig.camera.eyeHeight
  const lookT = route + experienceConfig.camera.lookAhead / depth
  routePoint(lookT, target)
  if (lookT > 1) {
    const tangent = routeCurve.getTangent(1)
    target.addScaledVector(tangent, (lookT - 1) * depth)
    target.y = routePoint(1).y
  }
  target.y += experienceConfig.camera.eyeHeight + experienceConfig.camera.lookLift
}

export function terrainGeometry(detailStep = 1) {
  const anchors = [-650, -500, -380, -280, -200, -145, -105, -78, -58, -44, -34, -27, -22, -18, -15, -12, -10, -8, -6, -4, -2, -1, 0, 1, 2, 4, 6, 8, 10, 12, 15, 18, 22, 27, 34, 44, 58, 78, 105, 145, 200, 280, 380, 500, 650]
  const offsets = anchors.flatMap((a, i) => i === anchors.length - 1 ? [a] : Array.from({ length: Math.ceil((anchors[i + 1] - a) / 16) }, (_, n) => a + n * (anchors[i + 1] - a) / Math.ceil((anchors[i + 1] - a) / 16)))
  const positions: number[] = [], indices: number[] = [], colors: number[] = []
  const rows = Math.ceil(690 / detailStep), stride = offsets.length
  const color = new THREE.Color(), snow = new THREE.Color('#d1dade'), ice = new THREE.Color('#89a6b7'), rock = new THREE.Color('#4b5b68')
  for (let row = 0; row <= rows; row++) {
    const z = 120 - row / rows * 1656
    const p = routePoint(-z / depth)
    for (let col = 0; col < stride; col++) {
      const offset = offsets[col], x = p.x + offset, y = groundHeight(x, z)
      positions.push(x, y, z)
      const slope = Math.abs(groundHeight(x + 0.5, z) - groundHeight(x - 0.5, z))
      const grain = terrainNoise(x * 0.085, z * 0.07) * 2 - 1
      color.copy(snow).lerp(ice, Math.min(0.65, slope * 0.28)).lerp(rock, ease(0.5, 0.72, -z / depth) * (1 - ease(0.73, 0.88, -z / depth)) * ease(1, 2.8, slope))
      color.multiplyScalar(0.92 + grain * 0.065)
      colors.push(color.r, color.g, color.b)
      if (row < rows && col < stride - 1) { const a = row * stride + col; indices.push(a, a + 1, a + stride, a + 1, a + stride + 1, a + stride) }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}
