import * as THREE from 'three'
import { experienceConfig } from '../config/experience'
import { noise2, terrainNoise } from './noise'
import { arrivalCamps } from './campLayout'
import { ascentRouteControls, ROUTE_CONTROL_SPACING, curveParameterAt, writeRouteEye } from '../data/ascentRoute'
import { projectsPresentation } from './progress'

// 29 independent route controls: exit, ice approach, switchbacks, traverse,
// sheltered camps, exposed ridge and final shoulder. World units are metres.
export const routeCurve = new THREE.CatmullRomCurve3(ascentRouteControls.map(([x, y], i) => new THREE.Vector3(x, y, -i * ROUTE_CONTROL_SPACING)), false, 'catmullrom', 0.5)
const depth = experienceConfig.route.depth
const ease = (a: number, b: number, x: number) => THREE.MathUtils.smoothstep(x, a, b)
export const seeded = (i: number) => { const n = Math.sin(i * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n) }

export function routePoint(t: number, out = new THREE.Vector3()) {
  return routeCurve.getPoint(THREE.MathUtils.clamp(t, 0, 1), out)
}

function surfaceHeight(offset: number, z: number, base: number) {
  const t = -z / depth
  const d = Math.abs(offset)
  const basin = ease(.31, .4, t) * (1 - ease(.54, .61, t))
  const icefall = ease(.1, .15, t) * (1 - ease(.29, .37, t))
  const opening = 20 + 32 * Math.exp(-Math.pow(t / .075, 2)) - 10 * icefall + 64 * basin
  const wall = Math.max(0, d - opening)
  const irregular = 1 + 0.24 * Math.sin(z * 0.029 + offset * 0.013) + 0.13 * Math.sin(z * 0.073 - offset * 0.05)
  const wallHeight = 145 + 45 * Math.sin(z * 0.011) + 20 * Math.cos(z * 0.027)
  const valley = wallHeight * (1 - Math.exp(-wall / 65)) * irregular
  const traverse = ease(.56, .64, t) * (1 - ease(.77, .84, t))
  const ridge = ease(0.77, 0.91, t)
  const leftFall = -Math.max(0, d - 4) * 0.82
  const ridgeWidth = 3 + 14 * ease(0.96, 1, t)
  const ridgeFall = -Math.pow(Math.max(0, d - ridgeWidth), 0.87) * 1.4
  const faceWall = valley * 1.35 + (1 - Math.exp(-Math.max(0, offset - 9) / 22)) * 54
  const flank = THREE.MathUtils.lerp(valley * (1 - basin * .25), offset < 0 ? leftFall : faceWall, traverse)
  const profile = THREE.MathUtils.lerp(flank, ridgeFall, ridge)
  // Leave the walked corridor untouched; snow banks and eroded flanks carry detail.
  const rough = ((terrainNoise(offset * 0.065, z * 0.045) - 0.5) * (1.3 + ease(12, 100, d) * 12)
    + Math.pow(noise2(offset * 0.18, z * 0.013), 3) * ease(15, 60, d) * 3) * ease(2.8, 12, d)
  const bankCenter = 6.5 + noise2(z * .017, offset > 0 ? 4 : 11) * 5
  const drift = Math.exp(-Math.pow((d - bankCenter) / 4.2, 2)) * (1.1 + noise2(z * .043, offset * .015) * 1.8)
  const erosion = (noise2(z * .045 + Math.sin(offset * .018), offset * .028) - .5) * 16 * ease(3, 38, wall)
  const shelf = Math.sin(z * .035 + offset * .08) * .5 * ease(12, 32, d)
  // Lateral glacier fractures never cross the walked corridor or the rope.
  const fracture = Math.exp(-Math.pow(Math.sin(z * .065 + offset * .045) / .17, 2))
    * ease(6, 12, d) * (1 - ease(26, 46, d)) * icefall * -5.5
  const moraine = ease(.015, .03, t) * (1 - ease(.075, .1, t))
    * Math.exp(-Math.pow((d - 13) / 5, 2)) * (3 + noise2(z * .075, offset) * 5) * ease(2.8, 6, d)
  return base + profile + rough * (1 - basin * .8) + fracture + moraine
    + (drift * (1 - basin * .85) + erosion + shelf) * ease(2.8, 5.5, d) * (1 - ridge * .65)
}

const campShelves = arrivalCamps.flatMap(camp => Array.from({ length: camp.tents }, (_, i) => {
  const z = routePoint(curveParameterAt(camp.progress)).z - camp.tentDepth - i * 12, p = routePoint(-z / depth)
  return { x: p.x + 7.2, z, height: surfaceHeight(7.2, z, p.y) }
}))

function baseHeight(x: number, z: number) {
  const p = routePoint(-z / depth)
  // Beyond the summit the ground falls away, revealing the horizon.
  const extension = z < -depth ? -Math.max(0, -z - depth - 4) * 0.42 : 0
  let height = surfaceHeight(x - p.x, z, p.y + extension)
  for (const shelf of campShelves) {
    if (Math.abs(z - shelf.z) > 6 || Math.abs(x - shelf.x) > 4.8) continue
    const radius = Math.hypot((x - shelf.x) / 4.8, (z - shelf.z) / 6)
    const blend = (1 - ease(.62, 1, radius)) * ease(3.4, 4.5, x - p.x)
    height = THREE.MathUtils.lerp(height, shelf.height, blend)
  }
  return height
}

/**
 * The Projects exhibit: a shelf levelled into the foot of the High Camp face, right of the guide rope, so the
 * walked line and the rope stay clear. Coordinates are in the High Camp view: forward along the walked line,
 * right across it (metres from the camp's eye position on the ground).
 */
export const showcaseSite = (() => {
  const route = arrivalCamps.find(camp => camp.id === 'high-camp')!.progress
  const curveParameter = curveParameterAt(route)
  const origin = routePoint(curveParameter), ahead = routePoint(curveParameter + experienceConfig.camera.lookAhead / depth)
  const forward = new THREE.Vector3(ahead.x - origin.x, 0, ahead.z - origin.z).normalize()
  const right = new THREE.Vector3(-forward.z, 0, forward.x)
  // Soft edges: short on the rope side (the corridor and the rope keep their ground), longer at the ends and
  // into the face, so the cut reads as a snow bench rather than a step.
  const shelf = { forward: [-40, 145] as const, right: [3.6, 110] as const, soft: { rope: .5, ends: 8, face: 14 } }
  const toWorld = (f: number, r: number) => new THREE.Vector3(origin.x + forward.x * f + right.x * r, 0, origin.z + forward.z * f + right.z * r)
  return { progress: route, origin: new THREE.Vector3(origin.x, 0, origin.z), forward, right, shelf, toWorld, level: routePoint(-toWorld(100, 0).z / depth).y + .12 }
})()

/** 0 outside the levelled exhibit shelf, 1 on it: each side falls off over its own soft edge. */
export function showcaseShelfBlend(x: number, z: number) {
  const { origin, forward, right, shelf } = showcaseSite
  const dx = x - origin.x, dz = z - origin.z
  const f = dx * forward.x + dz * forward.z, r = dx * right.x + dz * right.z
  const across = r < shelf.right[0] ? 1 - ease(0, shelf.soft.rope, shelf.right[0] - r) : r > shelf.right[1] ? 1 - ease(0, shelf.soft.face, r - shelf.right[1]) : 1
  const along = 1 - ease(0, shelf.soft.ends, Math.max(shelf.forward[0] - f, 0, f - shelf.forward[1]))
  // The wider exhibition bench follows the curved corridor's exclusion, not only the camp's tangent.
  const corridor = ease(3.2, 5, x - routePoint(-z / depth).x)
  return across * along * corridor
}

export function groundHeight(x: number, z: number) {
  const height = baseHeight(x, z), blend = showcaseShelfBlend(x, z)
  const forward = (x - showcaseSite.origin.x) * showcaseSite.forward.x + (z - showcaseSite.origin.z) * showcaseSite.forward.z
  // Approach the bench along the slope; a high flat shelf must not form a wall across the sightline.
  const approach = showcaseSite.level - Math.max(0, 90 - forward) * .8
  return blend ? THREE.MathUtils.lerp(height, approach, blend) : height
}

export const exhibitionFocus = (route: number) => projectsPresentation(route).focus

const showcaseLook = showcaseSite.toWorld(100, 50).setY(showcaseSite.level + 36)
const showcaseEye = new THREE.Vector3()
writeRouteEye(curveParameterAt(showcaseSite.progress), showcaseEye)
const showcaseDistance = showcaseEye.distanceTo(showcaseLook)

/** A portrait lens only around the exhibition; the rest of the ascent keeps its wide walking view. */
export function cameraFieldOfView(route: number, aspect: number, width: number, eye?: THREE.Vector3) {
  const base = aspect < .95 ? experienceConfig.camera.mobileFov : experienceConfig.camera.desktopFov
  const focus = projectsPresentation(route).lens
  if (width <= 1024 || aspect < 1.2 || !focus) return base
  if (!eye) writeRouteEye(curveParameterAt(route), showcaseEye)
  const distance = (eye ?? showcaseEye).distanceTo(showcaseLook)
  const readingLens = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(21)) * showcaseDistance / distance))
  return THREE.MathUtils.lerp(base, readingLens, focus)
}

export function cameraPose(journeyProgress: number, position: THREE.Vector3, target: THREE.Vector3, curveParameter = curveParameterAt(journeyProgress)) {
  writeRouteEye(curveParameter, position)
  const lookT = curveParameter + experienceConfig.camera.lookAhead / depth
  routePoint(lookT, target)
  if (lookT > 1) {
    const tangent = routeCurve.getTangent(1)
    target.addScaledVector(tangent, (lookT - 1) * depth)
    target.y = routePoint(1).y
  }
  target.y += experienceConfig.camera.eyeHeight + experienceConfig.camera.lookLift
  // A fixed point ahead of the exhibit guides the gaze; the eye never leaves the trail.
  const focus = projectsPresentation(journeyProgress).focus
  target.lerp(showcaseLook, focus)
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
      const t = -z / depth
      const face = ease(.56, .65, t) * (1 - ease(.79, .88, t))
      const moraine = ease(.02, .04, t) * (1 - ease(.08, .11, t))
      color.copy(snow).lerp(ice, Math.min(.72, slope * .28)).lerp(rock, Math.max(face, moraine * .8) * ease(.8, 2.2, slope))
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
  geometry.userData.grid = { offsets, rows, zStart: 120, zSpan: 1656 }
  return geometry
}

/** Sample the rendered triangles, including their diagonal, rather than the noise field. */
export class TerrainSurface {
  constructor(private geometry: THREE.BufferGeometry) {}

  sample(x: number, z: number) {
    const { offsets, rows, zStart, zSpan } = this.geometry.userData.grid as { offsets: number[]; rows: number; zStart: number; zSpan: number }
    const p = this.geometry.getAttribute('position'), stride = offsets.length
    const rowPosition = THREE.MathUtils.clamp((zStart - z) / zSpan * rows, 0, rows - 1e-8)
    const row = Math.floor(rowPosition), v = rowPosition - row
    const center = THREE.MathUtils.lerp(p.getX(row * stride), p.getX((row + 1) * stride), v) - offsets[0]
    const offset = x - center
    let low = 0, high = stride - 1
    while (high - low > 1) { const mid = (low + high) >>> 1; if (offsets[mid] <= offset) low = mid; else high = mid }
    const u = THREE.MathUtils.clamp((offset - offsets[low]) / (offsets[low + 1] - offsets[low]), 0, 1)
    const a = row * stride + low, b = a + 1, c = a + stride, d = c + 1
    const ids = u + v <= 1 ? [a, b, c] : [d, c, b]
    const weights = u + v <= 1 ? [1 - u - v, u, v] : [u + v - 1, 1 - u, 1 - v]
    const vertices = ids.map(i => new THREE.Vector3().fromBufferAttribute(p, i))
    const normal = vertices[1].clone().sub(vertices[0]).cross(vertices[2].clone().sub(vertices[0])).normalize()
    return { height: ids.reduce((sum, i, n) => sum + p.getY(i) * weights[n], 0), normal }
  }

  heightAt(x: number, z: number) { return this.sample(x, z).height }

  normalAt(x: number, z: number, radius = .6) {
    return new THREE.Vector3(this.heightAt(x - radius, z) - this.heightAt(x + radius, z), radius * 2,
      this.heightAt(x, z - radius) - this.heightAt(x, z + radius)).normalize()
  }
}
