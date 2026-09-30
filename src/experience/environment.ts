import * as THREE from 'three'
import { groundHeight, routePoint, seeded, terrainGeometry } from './terrain'

const surface = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: 0.96, flatShading: true })

function tentGeometry() {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute([
    -1.6, 0, 1.6, 1.6, 0, 1.6, 0, 1.85, 1.1,
    1.6, 0, -1.6, -1.6, 0, -1.6, 0, 1.85, -1.1,
    -1.6, 0, -1.6, -1.6, 0, 1.6, 0, 1.85, 1.1,
    -1.6, 0, -1.6, 0, 1.85, 1.1, 0, 1.85, -1.1,
    1.6, 0, 1.6, 1.6, 0, -1.6, 0, 1.85, -1.1,
    1.6, 0, 1.6, 0, 1.85, -1.1, 0, 1.85, 1.1,
  ], 3))
  g.computeVertexNormals()
  return g
}

function addFlags(scene: THREE.Group, start: THREE.Vector3, end: THREE.Vector3, poleMaterial: THREE.Material) {
  const pole = new THREE.CylinderGeometry(0.035, 0.045, 2.9, 5)
  for (const p of [start, end]) {
    const mesh = new THREE.Mesh(pole, poleMaterial)
    mesh.position.copy(p).add(new THREE.Vector3(0, 1.45, 0))
    scene.add(mesh)
  }
  const points = Array.from({ length: 33 }, (_, i) => start.clone().lerp(end, i / 32).add(new THREE.Vector3(0, 2.8 - Math.sin(i / 32 * Math.PI) * 0.9, 0)))
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 40, 0.014, 3, false), poleMaterial))
  const positions: number[] = [], colors: number[] = []
  const palette = ['#c2864b', '#9caab2', '#436b88', '#8c453b', '#647958'].map(c => new THREE.Color(c))
  for (let i = 1; i < 31; i++) {
    const a = points[i], b = points[i].clone().lerp(points[i + 1], 0.65)
    const drift = 0.12 + seeded(i) * 0.18
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, a.x + drift, a.y - 0.43, a.z + 0.18, b.x, b.y, b.z, b.x + drift, b.y - 0.4, b.z + 0.18, a.x + drift, a.y - 0.43, a.z + 0.18)
    const c = palette[i % palette.length]
    for (let n = 0; n < 6; n++) colors.push(c.r, c.g, c.b)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  g.computeVertexNormals()
  scene.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 1 })))
}

export function createEnvironment() {
  const world = new THREE.Group()
  const snowMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 })
  // World-space wind ripples supply ground speed cues without a downloaded texture.
  snowMaterial.onBeforeCompile = shader => {
    shader.vertexShader = 'varying vec3 vGround; varying float vSlope;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvGround = position; vSlope = normal.y;')
    shader.fragmentShader = 'varying vec3 vGround; varying float vSlope;\n' + shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      float ripple = sin(vGround.z * 6.0 + sin(vGround.x * 0.42) * 2.5 + sin(vGround.z * 0.7));
      float detailFade = (1.0 - smoothstep(25.0, 100.0, length(vGround - cameraPosition))) * smoothstep(0.65,0.95,vSlope);
      diffuseColor.rgb *= 1.0 + ripple * 0.055 * detailFade;
    `)
  }
  world.add(new THREE.Mesh(terrainGeometry(), snowMaterial))

  // Lower distant ranges emerge only beyond the last shoulder; they are not
  // the climbable mountain seen as an isolated object from outside.
  const farPositions: number[] = [], farIndices: number[] = []
  for (let row = 0; row <= 30; row++) for (let col = 0; col <= 90; col++) {
    const x = -1800 + col * 40, z = -1370 - row * 32
    const ridge = Math.pow(0.5 + 0.5 * Math.sin(x * 0.008 + row * 0.18), 2)
    const mountain = 150 + ridge * 110 + Math.sin(x * 0.021 - row * 0.3) * 22 - row * 0.9
    const skirt = THREE.MathUtils.smoothstep(row, 0, 4) * (1 - THREE.MathUtils.smoothstep(row, 26, 30))
    const y = THREE.MathUtils.lerp(-250, mountain, skirt)
    farPositions.push(x, y, z)
    if (row < 30 && col < 90) { const a = row * 91 + col; farIndices.push(a, a + 1, a + 91, a + 1, a + 92, a + 91) }
  }
  const farGeometry = new THREE.BufferGeometry()
  farGeometry.setAttribute('position', new THREE.Float32BufferAttribute(farPositions, 3))
  farGeometry.setIndex(farIndices); farGeometry.computeVertexNormals()
  world.add(new THREE.Mesh(farGeometry, new THREE.MeshStandardMaterial({ color: '#7993aa', roughness: 1 })))

  const dummy = new THREE.Object3D()
  const rockGeo = new THREE.IcosahedronGeometry(1, 1)
  const vertices = rockGeo.getAttribute('position')
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i)
    const shape = 1 + 0.17 * Math.sin(x * 8 + y * 5 + z * 11)
    vertices.setXYZ(i, x * shape, y * shape, z * shape)
  }
  rockGeo.computeVertexNormals()
  const rocks = new THREE.InstancedMesh(rockGeo, surface('#505765'), 560)
  const ice = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), surface('#7894ab'), 220)
  for (let i = 0; i < rocks.count; i++) {
    const t = seeded(i + 2) * 0.94
    const center = routePoint(t)
    const side = i % 2 ? 1 : -1
    const offset = side * (4 + seeded(i + 53) ** 2 * 65)
    const x = center.x + offset, z = center.z
    const s = 0.18 + seeded(i + 41) ** 2 * (t < 0.08 ? 1.7 : 3.5)
    const slope = Math.abs(groundHeight(x + 1, z) - groundHeight(x - 1, z)) / 2
    dummy.position.set(x, groundHeight(x, z) - s * (0.12 + slope * 0.5), z)
    dummy.rotation.set(seeded(i) * 0.6, seeded(i + 1) * 6.28, seeded(i + 3) * 0.35)
    dummy.scale.set(s * 1.4, s * 0.65, s)
    dummy.updateMatrix(); rocks.setMatrixAt(i, dummy.matrix)
    rocks.setColorAt(i, new THREE.Color().setScalar(0.68 + seeded(i + 19) * 0.4))
  }
  for (let i = 0; i < ice.count; i++) {
    const t = 0.085 + seeded(i + 7) * 0.38
    const center = routePoint(t)
    const side = i % 2 ? 1 : -1
    const s = 2 + seeded(i + 80) * 7
    const x = center.x + side * (9 + s + seeded(i + 44) * 42), z = center.z
    const slope = Math.abs(groundHeight(x + 1, z) - groundHeight(x - 1, z)) / 2
    dummy.position.set(x, groundHeight(x, z) + s * (0.3 - slope * 0.45), z)
    dummy.rotation.set(seeded(i + 23) * 0.18, seeded(i + 45) * 5, side * 0.13)
    dummy.scale.set(s * 0.72, s * (1 + seeded(i + 12)), s)
    dummy.updateMatrix(); ice.setMatrixAt(i, dummy.matrix)
  }
  world.add(rocks, ice)

  const poleMaterial = surface('#373d43')
  const tentMaterial = surface('#b6733b')
  const tentGeo = tentGeometry()
  const entranceGeo = new THREE.BufferGeometry()
  entranceGeo.setAttribute('position', new THREE.Float32BufferAttribute([-0.55, 0.04, 1.615, 0.55, 0.04, 1.615, 0, 1.22, 1.28], 3))
  entranceGeo.computeVertexNormals()
  const entranceMaterial = surface('#292b2c')
  for (let camp = 0; camp < 5; camp++) {
    const center = routePoint(camp / 4)
    const tentCount = camp === 0 ? 5 : camp === 4 ? 0 : camp === 3 ? 1 : 2
    for (let i = 0; i < tentCount; i++) {
      const z = center.z - [14, 11, 20, 14][camp] - i * 10
      const p = routePoint(-z / 1120)
      const x = p.x + (i === 2 ? -1 : 1) * (6 + camp * 1.2 + (i % 2) * 6)
      const tent = new THREE.Group()
      tent.position.set(x, groundHeight(x, z) + 0.04, z)
      tent.rotation.y = -0.12 + i * 0.3
      tent.add(new THREE.Mesh(tentGeo, tentMaterial), new THREE.Mesh(entranceGeo, entranceMaterial))
      world.add(tent)
      const line = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, tent.position.y + 1.7, z + 1), new THREE.Vector3(x, groundHeight(x, z + 3.7) + 0.05, z + 3.7),
      ])
      world.add(new THREE.Line(line, new THREE.LineBasicMaterial({ color: '#afa591' })))
    }
    const a = new THREE.Vector3(center.x - (camp === 0 ? 10 : 5), 0, center.z - 22)
    const b = new THREE.Vector3(center.x + 18, 0, center.z - 14)
    a.y = groundHeight(a.x, a.z); b.y = groundHeight(b.x, b.z)
    addFlags(world, a, b, poleMaterial)
  }

  // One continuous fixed rope and stakes give a readable, reversible route.
  const ropePoints: THREE.Vector3[] = []
  const stakes = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.045, 1.1, 5), poleMaterial, 111)
  for (let i = 0; i <= 440; i++) {
    const t = i / 440
    const p = routePoint(t)
    p.x += 2.8
    p.y = groundHeight(p.x, p.z) + 0.88 - Math.sin((i % 4) / 4 * Math.PI) * 0.25
    ropePoints.push(p)
    if (i % 4 === 0) {
      dummy.position.copy(p); dummy.position.y = groundHeight(p.x, p.z) + 0.49
      dummy.rotation.set(0, 0, -0.08); dummy.scale.set(1, 1, 1); dummy.updateMatrix()
      stakes.setMatrixAt(i / 4, dummy.matrix)
    }
  }
  world.add(stakes, new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ropePoints), 1500, 0.026, 4, false), surface('#918e76')))
  return world
}
