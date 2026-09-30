import * as THREE from 'three'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { noise2 } from './noise'

export function rockGeometry(seed: number) {
  const source = new THREE.IcosahedronGeometry(1, 2)
  source.deleteAttribute('normal'); source.deleteAttribute('uv')
  const g = mergeVertices(source)
  source.dispose()
  const p = g.getAttribute('position')
  const colors: number[] = []
  const stone = new THREE.Color('#66737a'), snow = new THREE.Color('#c8d8dc'), color = new THREE.Color()
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
    const rough = noise2(x * 3 + seed * 11, z * 3 + y * 2) - 0.5
    const scale = 1 + rough * 0.36
    p.setXYZ(i, (x * scale + y * 0.12) * (1 + seed * 0.08), Math.min(0.77 + rough * 0.18, y * scale), z * scale)
    color.copy(stone).lerp(snow, THREE.MathUtils.smoothstep(y + rough * 0.7, 0.35, 0.95) * 0.65).multiplyScalar(0.9 + rough * 0.2)
    colors.push(color.r, color.g, color.b)
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  g.computeVertexNormals()
  return g
}

export function iceGeometry(seed: number) {
  const corners = [[-0.7, -1], [0.6, -1], [1, -0.65], [1, 0.65], [0.6, 1], [-0.6, 1], [-1, 0.65], [-1, -0.65]]
  const positions: number[] = [], indices: number[] = [], colors: number[] = []
  const base = new THREE.Color('#85a8ba'), top = new THREE.Color('#d5e3e5'), color = new THREE.Color()
  for (let ring = 0; ring < 4; ring++) {
    for (let i = 0; i < 8; i++) {
      const [x, z] = corners[i]
      const uneven = noise2(i * 0.6 + seed * 9, ring * 0.8)
      const taper = 1 - ring * (0.035 + seed * 0.015)
      positions.push(x * taper + ring * 0.06, ring * 0.63 + (ring ? uneven * 0.24 : 0), z * taper + (uneven - 0.5) * 0.16)
      color.copy(base).lerp(top, ring / 4 + uneven * 0.15)
      colors.push(color.r, color.g, color.b)
      if (ring < 3) { const a = ring * 8 + i, b = ring * 8 + (i + 1) % 8; indices.push(a, a + 8, b, b, a + 8, b + 8) }
    }
  }
  for (let i = 1; i < 7; i++) indices.push(24, 24 + i + 1, 24 + i)
  const indexed = new THREE.BufferGeometry()
  indexed.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); indexed.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); indexed.setIndex(indices)
  const g = indexed.toNonIndexed(); indexed.dispose(); g.computeVertexNormals()
  return g
}

export function tentGeometry() {
  const positions: number[] = [], indices: number[] = []
  const segments = 12
  for (let ring = 0; ring < 5; ring++) {
    const end = ring === 0 || ring === 4
    for (let i = 0; i <= segments; i++) {
      const angle = i / segments * Math.PI
      positions.push(Math.cos(angle) * 1.6 * (end ? 0.84 : 1), Math.sin(angle) * 1.8 * (end ? 0.83 : 1), -1.65 + ring * 0.825)
      if (ring < 4 && i < segments) { const a = ring * (segments + 1) + i; indices.push(a, a + 1, a + segments + 1, a + 1, a + segments + 2, a + segments + 1) }
    }
  }
  const front = positions.length / 3
  positions.push(0, 0, 1.65, 0, 0, -1.65)
  for (let i = 0; i < segments; i++) { indices.push(front, 4 * (segments + 1) + i, 4 * (segments + 1) + i + 1); indices.push(front + 1, i + 1, i) }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); g.setIndex(indices); g.computeVertexNormals()
  return g
}

export function tentSeams(material: THREE.Material) {
  const group = new THREE.Group()
  for (const z of [-0.825, 0.825]) {
    const points = Array.from({ length: 21 }, (_, i) => new THREE.Vector3(Math.cos(i / 20 * Math.PI) * 1.612, Math.sin(i / 20 * Math.PI) * 1.812, z))
    group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, 0.018, 5, false), material))
  }
  return group
}
