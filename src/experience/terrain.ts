import * as THREE from 'three'
import { experienceConfig } from '../config/experience'

export const MOUNTAIN_HEIGHT = 920
export const CAMP_HEIGHTS = [100, 305, 525, 735, 916]
export const CAMP_ANGLES = [0.23, 0.57, 0.12, -0.38, -0.04]

export function radiusAt(height: number, angle: number) {
  const t = Math.max(0, Math.min(1, height / MOUNTAIN_HEIGHT))
  const ridge = 1 + 0.105 * Math.sin(angle * 5 + t * 2) + 0.068 * Math.sin(angle * 9 - t * 4) + 0.03 * Math.cos(angle * 17 + t * 8)
  return 650 * Math.pow(1 - t, 0.83) * ridge
}

export function surfacePoint(height: number, angle: number, offset = 0) {
  const radius = radiusAt(height, angle) + offset
  return new THREE.Vector3(Math.sin(angle) * radius, height, Math.cos(angle) * radius)
}

export function mountainGeometry(detail: number, height = MOUNTAIN_HEIGHT, width = 1, seed = 0) {
  const rings = detail
  const sides = detail * 2
  const positions: number[] = []
  const indices: number[] = []
  for (let ring = 0; ring <= rings; ring++) {
    const t = ring / rings
    for (let side = 0; side <= sides; side++) {
      const angle = side / sides * Math.PI * 2
      const ripple = Math.sin(angle * 31 + t * 45 + seed) * Math.sin(angle * 13 - t * 38) * 6 * Math.sin(t * Math.PI)
      const radius = ring === rings ? 0 : (radiusAt(t * MOUNTAIN_HEIGHT, angle + seed) + ripple) * width
      // Keep rings vertically ordered; radial ridges supply detail without folded faces.
      const y = t * height
      positions.push(Math.sin(angle) * radius, y, Math.cos(angle) * radius)
      if (ring < rings && side < sides) {
        const a = ring * (sides + 1) + side
        const b = a + sides + 1
        indices.push(a, a + 1, b)
        if (ring < rings - 1) indices.push(a + 1, b + 1, b)
      }
    }
  }
  const indexed = new THREE.BufferGeometry()
  indexed.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  indexed.setIndex(indices)
  const geometry = indexed.toNonIndexed()
  indexed.dispose()
  geometry.computeVertexNormals()
  const vertices = geometry.getAttribute('position')
  const normals = geometry.getAttribute('normal')
  const colors: number[] = []
  const rock = new THREE.Color('#363d40')
  const snow = new THREE.Color('#d9e0df')
  const ice = new THREE.Color('#879a9e')
  const color = new THREE.Color()
  for (let i = 0; i < vertices.count; i += 3) {
    const y = (vertices.getY(i) + vertices.getY(i + 1) + vertices.getY(i + 2)) / (3 * height)
    const x = vertices.getX(i), z = vertices.getZ(i)
    const grain = (Math.sin(x * 0.133 + z * 0.077 + seed) + 1) * 0.5
    const slope = normals.getY(i)
    const snowline = 0.32 + 0.16 * Math.sin(Math.atan2(x, z) * 8 + y * 9) + grain * 0.11
    const cover = THREE.MathUtils.smoothstep(y, snowline, snowline + 0.27) * THREE.MathUtils.smoothstep(slope, 0.15, 0.63)
    color.copy(rock).lerp(ice, Math.max(0, y - 0.3) * 0.33).lerp(snow, cover).multiplyScalar(0.82 + grain * 0.28)
    for (let vertex = 0; vertex < 3; vertex++) colors.push(color.r, color.g, color.b)
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.computeBoundingSphere()
  return geometry
}

export function createCameraRails(mobile: boolean, reduced = false) {
  const points: THREE.Vector3[] = []
  const targets: THREE.Vector3[] = []
  for (let i = 0; i < CAMP_HEIGHTS.length; i++) {
    const y = CAMP_HEIGHTS[i]
    const angle = reduced ? 0.16 : CAMP_ANGLES[i] + (mobile ? 0.08 : 0)
    const isSummit = i === 4
    const distance = i === 0 ? (mobile ? 670 : 550) : mobile ? (isSummit ? 230 : 320) : (isSummit ? 195 : 275)
    points.push(surfacePoint(y + (isSummit ? 76 : i === 0 ? 100 : 65), angle, distance))
    const target = surfacePoint(y + (i === 0 ? 195 : 25), angle, -70)
    const tangent = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle))
    target.addScaledVector(tangent, mobile ? -30 : -145)
    if (isSummit) target.set(-230, 910, -600)
    targets.push(target)
  }
  return {
    position: new THREE.CatmullRomCurve3(points, false, 'catmullrom', experienceConfig.camera.railTension),
    target: new THREE.CatmullRomCurve3(targets, false, 'catmullrom', experienceConfig.camera.railTension),
  }
}
