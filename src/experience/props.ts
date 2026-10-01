import * as THREE from 'three'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { noise2 } from './noise'

export function rockGeometry(seed: number) {
  const source = new THREE.IcosahedronGeometry(1, 2)
  source.deleteAttribute('normal'); source.deleteAttribute('uv')
  const geometry = mergeVertices(source)
  source.dispose()
  const positions = geometry.getAttribute('position'), colors: number[] = []
  const rock = new THREE.Color('#43515b'), snow = new THREE.Color('#d7e1e2'), color = new THREE.Color()
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i)
    const grain = noise2(x * 4 + seed * 13, z * 4 + y * 2) - .5
    const split = Math.min(1 + grain * .32, .84 + Math.abs(x * .45 + z * .3))
    const width = [1.1, .78, 1.35, .92, 1.18][seed % 5]
    const height = [1, 1.3, .66, 1.1, .82][seed % 5]
    const py = Math.max(-.62, Math.min(.78 + x * .18 - z * .13, y * split)) * height
    positions.setXYZ(i, x * split * width + y * (.1 + seed * .045), py, z * split * (1 + seed * .05))
    const cap = THREE.MathUtils.smoothstep(y + grain * .9 + x * .25, .24, .83)
    color.copy(rock).lerp(snow, cap * .94).multiplyScalar(.9 + grain * .3)
    colors.push(color.r, color.g, color.b)
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
  return geometry
}

export function iceGeometry(seed: number) {
  const sides = 7 + seed % 3, rings = 4
  const positions: number[] = [], colors: number[] = [], indices: number[] = []
  const blue = new THREE.Color('#739cae'), snow = new THREE.Color('#cbdde2'), deep = new THREE.Color('#416e85'), color = new THREE.Color()
  for (let ring = 0; ring < rings; ring++) {
    const v = ring / (rings - 1)
    for (let i = 0; i < sides; i++) {
      const angle = i / sides * Math.PI * 2
      const n = noise2(i * .73 + seed * 17, 1)
      const groove = Math.pow(.5 + .5 * Math.cos(angle * 3 + seed * 1.3), 8)
      const taper = 1 - v * (.12 + seed * .025)
      const radius = (.8 + n * .32 - groove * .12) * taper
      // Broad fractured planes and a sloping crown, instead of fluted cone tips.
      const crown = 1.65 + Math.cos(angle + seed) * .27 + noise2(i * .9 + seed * 5, 4) * .38
      positions.push(Math.cos(angle) * radius + v * (.08 + seed * .035), v * crown, Math.sin(angle) * radius * (.75 + seed * .065) - v * .12)
      color.copy(blue).lerp(snow, v * v * .5 + n * .13).lerp(deep, groove * .2)
      colors.push(color.r, color.g, color.b)
      if (ring < rings - 1) {
        const a = ring * sides + i, b = ring * sides + (i + 1) % sides
        indices.push(a, a + sides, b, b, a + sides, b + sides)
      }
    }
  }
  const cap = positions.length / 3
  positions.push(.08 + seed * .035, 1.78, -.12); colors.push(snow.r, snow.g, snow.b)
  for (let i = 0; i < sides; i++) indices.push(cap, (rings - 1) * sides + (i + 1) % sides, (rings - 1) * sides + i)
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.setIndex(indices); geometry.computeVertexNormals()
  return geometry
}

function tentPoint(angle: number, t: number, seam = false) {
  const fullness = Math.pow(Math.sin(t * Math.PI), .65)
  const width = 1.2 + fullness * .42
  const height = 1.28 + fullness * .52
  const tension = seam ? 0 : Math.sin(t * Math.PI * 4) ** 2 * Math.sin(angle) * .045
  return new THREE.Vector3(Math.cos(angle) * (width - tension), .12 + Math.sin(angle) * (height - tension), (t - .5) * 3.7)
}

export function tentGeometry() {
  const positions: number[] = [], indices: number[] = [], colors: number[] = []
  const sides = 24, rows = 16
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= sides; i++) {
    const angle = i / sides * Math.PI, t = j / rows, p = tentPoint(angle, t)
    positions.push(p.x, p.y, p.z)
    const shade = .82 + Math.sin(angle) * .18 - Math.sin(t * Math.PI * 4) ** 2 * .025
    colors.push(shade, shade, shade)
    if (j < rows && i < sides) {
      const a = j * (sides + 1) + i
      indices.push(a, a + 1, a + sides + 1, a + 1, a + sides + 2, a + sides + 1)
    }
  }
  // End panels close the fly; the vestibule and doorway are separate geometry.
  for (const row of [0, rows]) {
    const center = positions.length / 3
    positions.push(0, .04, (row / rows - .5) * 3.7); colors.push(.8, .8, .8)
    for (let i = 0; i < sides; i++) {
      const a = row * (sides + 1) + i
      if (row === 0) indices.push(center, a + 1, a)
      else indices.push(center, a, a + 1)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.setIndex(indices); geometry.computeVertexNormals()
  return geometry
}

export function tentSeams(material: THREE.Material) {
  const group = new THREE.Group()
  for (const t of [.2, .5, .8]) {
    const points = Array.from({ length: 33 }, (_, i) => tentPoint(i / 32 * Math.PI, t, true).add(new THREE.Vector3(0, .012, 0)))
    group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 32, .012, 5, false), material))
  }
  for (const angle of [.08, Math.PI - .08, Math.PI / 2]) {
    const points = Array.from({ length: 25 }, (_, i) => tentPoint(angle, i / 24, true))
    group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, .008, 4, false), material))
  }
  return group
}

export function tentVestibule() {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    -1.2,.12,1.85, -.62,.05,2.65, 0,1.4,1.85,
    0,1.4,1.85, .62,.05,2.65, 1.2,.12,1.85,
    -1.2,.12,1.85, 0,1.4,1.85, 1.2,.12,1.85,
  ], 3))
  geometry.computeVertexNormals()
  return geometry
}

