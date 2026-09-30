import * as THREE from 'three'
import { groundHeight, routePoint, seeded, terrainGeometry } from './terrain'
import { rockGeometry, iceGeometry, tentGeometry, tentSeams, tentVestibule } from './props'

const matte = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: .94 })

function contactMaterial() {
  const material = new THREE.MeshBasicMaterial({ color: '#233743', transparent: true, opacity: .28, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 })
  material.onBeforeCompile = shader => {
    shader.vertexShader = 'varying vec2 vContact;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvContact = uv;')
    shader.fragmentShader = 'varying vec2 vContact;\n' + shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.a *= pow(max(0.0, 1.0 - length(vContact - 0.5) * 2.0), 1.7);')
  }
  return material
}

function addFlags(world: THREE.Group, start: THREE.Vector3, end: THREE.Vector3, poleMaterial: THREE.Material, wind: { value: number }, seed: number) {
  const height = 2.55
  const poleGeometry = new THREE.CylinderGeometry(.022, .032, height, 8)
  for (const [i, p] of [start, end].entries()) {
    const pole = new THREE.Mesh(poleGeometry, poleMaterial)
    pole.position.copy(p).add(new THREE.Vector3(0, height / 2, 0))
    pole.rotation.z = (i ? 1 : -1) * .025
    world.add(pole)
  }
  const at = (t: number) => start.clone().lerp(end, t).add(new THREE.Vector3(0, height - .06 - 4 * t * (1 - t) * .68, 0))
  const curve = new THREE.CatmullRomCurve3(Array.from({ length: 41 }, (_, i) => at(i / 40)))
  world.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, .007, 4, false), matte('#7f8074')))
  const positions: number[] = [], colors: number[] = [], indices: number[] = [], flex: number[] = []
  const palette = ['#b38b59', '#d1c9b2', '#486e87', '#96594b', '#6b7c68'].map(c => new THREE.Color(c))
  const length = start.distanceTo(end), count = Math.floor(length / .85)
  for (let i = 0; i < count; i++) {
    if (seeded(seed + i * 5) < .09) continue
    const t = (i + .2 + seeded(i + seed) * .25) / count
    const width = (.38 + seeded(i + 13) * .2) / length
    const drop = .32 + seeded(i + 9) * .19, base = positions.length / 3
    const tint = palette[(i + seed) % palette.length]
    for (let row = 0; row <= 4; row++) for (let col = 0; col <= 5; col++) {
      const u = col / 5, v = row / 4, point = at(Math.min(.99, t + u * width))
      const ripple = Math.sin(u * Math.PI * 2 + i * .8 + v * 3) * .075 * v
      point.x += v * (.1 + seeded(i) * .08)
      point.y -= drop * v + Math.sin(u * Math.PI) * .035 * v
      point.z += v * .14 + ripple
      positions.push(point.x, point.y, point.z)
      flex.push(v)
      const shade = .87 + Math.cos(u * 6 + v * 2 + i) * .08
      colors.push(tint.r * shade, tint.g * shade, tint.b * shade)
      if (row < 4 && col < 5) {
        const a = base + row * 6 + col
        indices.push(a, a + 1, a + 6, a + 1, a + 7, a + 6)
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.setAttribute('flex', new THREE.Float32BufferAttribute(flex, 1))
  geometry.setIndex(indices); geometry.computeVertexNormals()
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 1 })
  material.onBeforeCompile = shader => {
    shader.uniforms.uClothTime = wind
    shader.vertexShader = 'uniform float uClothTime; attribute float flex;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.z += sin(position.x * 2.4 + position.z + uClothTime * 1.6) * 0.045 * flex;')
  }
  world.add(new THREE.Mesh(geometry, material))
}

function addRoute(world: THREE.Group, poleMaterial: THREE.Material) {
  const dummy = new THREE.Object3D(), points: THREE.Vector3[] = []
  const count = 111
  const stakes = new THREE.InstancedMesh(new THREE.CylinderGeometry(.018, .027, 1.02, 8), poleMaterial, count)
  const anchors: THREE.Vector3[] = []
  for (let i = 0; i < count; i++) {
    const p = routePoint(i / (count - 1))
    p.x += 2.85 + Math.sin(i * .55) * .12
    const h = .81 + seeded(i + 64) * .12
    const ground = groundHeight(p.x, p.z)
    dummy.position.set(p.x, ground + h - .45, p.z)
    dummy.rotation.set((seeded(i + 12) - .5) * .07, seeded(i) * 6.28, -.04 + seeded(i + 7) * .08)
    dummy.updateMatrix(); stakes.setMatrixAt(i, dummy.matrix)
    p.y = ground + h
    anchors.push(p)
  }
  for (let i = 0; i < count - 1; i++) for (let j = 0; j < 8; j++) {
    const t = j / 8, p = anchors[i].clone().lerp(anchors[i + 1], t)
    const sag = (.12 + seeded(i + 23) * .17) * 4 * t * (1 - t)
    p.y = Math.max(p.y - sag, groundHeight(p.x, p.z) + .13)
    points.push(p)
  }
  points.push(anchors[count - 1])
  const ropeMaterial = matte('#a99c81')
  ropeMaterial.onBeforeCompile = shader => {
    shader.vertexShader = 'varying vec2 vFiber;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvFiber = uv;')
    shader.fragmentShader = 'varying vec2 vFiber;\n' + shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= 0.94 + 0.06 * sin(vFiber.x * 18000.0 + vFiber.y * 31.4);')
  }
  world.add(stakes, new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 1800, .011, 6, false), ropeMaterial))
}

function addCamp(world: THREE.Group, camp: number, poleMaterial: THREE.Material, shadowMaterial: THREE.Material, wind: { value: number }) {
  const center = routePoint(camp / 4), count = camp === 0 ? 5 : camp === 3 ? 1 : camp === 4 ? 0 : 2
  const fly = new THREE.MeshStandardMaterial({ color: '#b88a50', roughness: .98, vertexColors: true, side: THREE.DoubleSide })
  const outer = new THREE.MeshStandardMaterial({ color: '#ad7947', roughness: .97, side: THREE.DoubleSide })
  const dark = new THREE.MeshStandardMaterial({ color: '#1d2b31', roughness: 1, side: THREE.DoubleSide })
  const frameMaterial = matte('#c9b998'), skirtMaterial = matte('#495357')
  const geometry = tentGeometry(), vestibule = tentVestibule(), seams = tentSeams(frameMaterial)
  const door = new THREE.Shape()
  door.moveTo(-.58, .08); door.lineTo(.58, .08); door.lineTo(.4, .76); door.quadraticCurveTo(0, 1.33, -.4, .76); door.closePath()
  const entrance = new THREE.ShapeGeometry(door, 16)
  const skirtGeometry = new THREE.BoxGeometry(2.45, .15, 3.68)
  const groundSheet = new THREE.PlaneGeometry(4.8, 6)
  groundSheet.rotateX(-Math.PI / 2)
  for (let i = 0; i < count; i++) {
    const z = center.z - [14, 11, 20, 14][camp] - i * 10
    const p = routePoint(-z / 1120), x = p.x + (i === 2 ? -1 : 1) * (6.5 + camp * 1.2 + (i % 2) * 6)
    const tent = new THREE.Group(), size = .91 + seeded(i + camp * 11) * .18
    tent.position.set(x, groundHeight(x, z) + .025, z)
    tent.rotation.y = -.25 + i * .37
    tent.scale.setScalar(size)
    const doorway = new THREE.Mesh(entrance, dark); doorway.position.z = 1.865
    const skirt = new THREE.Mesh(skirtGeometry, skirtMaterial); skirt.position.y = .04
    tent.add(new THREE.Mesh(geometry, fly), new THREE.Mesh(vestibule, outer), doorway, seams.clone(), skirt)
    world.add(tent)
    const shade = new THREE.Mesh(groundSheet, shadowMaterial)
    shade.position.set(x, groundHeight(x, z) + .045, z + .2); shade.rotation.y = tent.rotation.y
    world.add(shade)
    tent.updateMatrixWorld(true)
    const guyPoints: THREE.Vector3[] = []
    for (const side of [-1, 1]) for (const dz of [-1.1, 1.1]) {
      const anchor = tent.localToWorld(new THREE.Vector3(side * 1.15, 1.1, dz))
      const stake = tent.localToWorld(new THREE.Vector3(side * 2.35, 0, dz * 1.75))
      stake.y = groundHeight(stake.x, stake.z) + .04
      guyPoints.push(anchor, stake)
    }
    world.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(guyPoints), new THREE.LineBasicMaterial({ color: '#a59c82', transparent: true, opacity: .7 })))
  }
  const a = new THREE.Vector3(center.x - (camp === 0 ? 10 : 5), 0, center.z - 22)
  const b = new THREE.Vector3(center.x + (camp < 2 ? 18 : 6), 0, center.z - 14)
  a.y = groundHeight(a.x, a.z); b.y = groundHeight(b.x, b.z)
  if (camp < 2) addFlags(world, a, b, poleMaterial, wind, camp * 7)
  // Dispose unused template geometry in the tent-free final camp.
  if (!count) {
    geometry.dispose(); vestibule.dispose(); entrance.dispose(); skirtGeometry.dispose(); groundSheet.dispose()
    seams.traverse(object => { if (object instanceof THREE.Mesh) object.geometry.dispose() })
    fly.dispose(); outer.dispose(); dark.dispose(); frameMaterial.dispose(); skirtMaterial.dispose()
  }
}

/** One bounded stage per idle callback. No extra loading surface blocks Home. */
export function* environmentStages(parent: THREE.Object3D, wind: { value: number }) {
  const world = new THREE.Group()
  parent.add(world)
  const snowMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .96 })
  snowMaterial.onBeforeCompile = shader => {
    shader.vertexShader = 'varying vec3 vGround; varying float vSlope;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvGround = position; vSlope = normal.y;')
    shader.fragmentShader = 'varying vec3 vGround; varying float vSlope;\n' + shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      float ripple = sin(vGround.z * 2.1 + vGround.x * 0.6 + sin(vGround.z * 0.3 + vGround.x * 0.7) * 2.0) * sin(vGround.x * 1.1 - vGround.z * 0.21);
      float detailFade = (1.0 - smoothstep(25.0, 90.0, length(vGround - cameraPosition))) * smoothstep(0.65,0.95,vSlope);
      diffuseColor.rgb *= 1.0 + ripple * 0.035 * detailFade;
    `)
  }
  const terrain = new THREE.Mesh(terrainGeometry(3), snowMaterial)
  world.add(terrain)
  yield
  const poleMaterial = new THREE.MeshStandardMaterial({ color: '#556976', metalness: .35, roughness: .65 })
  const shadowMaterial = contactMaterial()
  addRoute(world, poleMaterial)
  addCamp(world, 0, poleMaterial, shadowMaterial, wind)
  yield

  const dummy = new THREE.Object3D()
  const rockMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .98, flatShading: true })
  const iceMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .34, metalness: 0, emissive: '#254255', emissiveIntensity: .055 })
  const contactGeometry = new THREE.PlaneGeometry(2, 2); contactGeometry.rotateX(-Math.PI / 2)
  for (let variant = 0; variant < 5; variant++) {
    const rocks = new THREE.InstancedMesh(rockGeometry(variant), rockMaterial, 110)
    const shade = new THREE.InstancedMesh(contactGeometry, shadowMaterial, rocks.count)
    const ice = new THREE.InstancedMesh(iceGeometry(variant), iceMaterial, 28)
    for (let i = 0; i < rocks.count; i++) {
      const seed = i + variant * 733, band = seeded(seed + 2), u = seeded(seed + 83)
      const t = band < .24 ? u * .09 : band < .56 ? .09 + u * .24 : band < .65 ? .36 + u * .17 : .56 + u * .32
      const center = routePoint(t), side = i % 2 ? 1 : -1
      const x = center.x + side * (4.3 + seeded(seed + 53) ** 2 * 47), z = center.z
      const s = .18 + seeded(seed + 41) ** 2 * (t < .09 ? 1.7 : t > .55 ? 3.7 : 2.6)
      const slope = Math.abs(groundHeight(x + .5, z) - groundHeight(x - .5, z))
      const ground = groundHeight(x, z)
      dummy.position.set(x, ground - s * (.12 + slope * .48), z)
      dummy.rotation.set((seeded(seed) - .5) * .4, seeded(seed + 1) * Math.PI * 2, (seeded(seed + 3) - .5) * .3)
      dummy.scale.set(s * (1 + seeded(seed + 15) * .5), s * (.8 + seeded(seed + 19) * .45), s)
      dummy.updateMatrix(); rocks.setMatrixAt(i, dummy.matrix)
      rocks.setColorAt(i, new THREE.Color().setScalar(.82 + seeded(seed + 19) * .22))
      const normal = new THREE.Vector3(groundHeight(x - .2, z) - groundHeight(x + .2, z), .4, groundHeight(x, z - .2) - groundHeight(x, z + .2)).normalize()
      dummy.position.set(x, ground + .035, z)
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal)
      dummy.scale.set(s * 1.7, 1, s * 1.45); dummy.updateMatrix(); shade.setMatrixAt(i, dummy.matrix)
    }
    for (let i = 0; i < ice.count; i++) {
      const seed = i + variant * 411
      // Separated groups with breathing room and unequal height, not a wall of blocks.
      const cluster = Math.floor(seeded(seed + 7) * 7)
      const t = .085 + cluster * .036 + seeded(seed + 11) * .018
      const center = routePoint(t), side = i % 2 ? 1 : -1
      const s = 1.2 + seeded(seed + 80) ** 1.4 * 4.7
      const x = center.x + side * (8 + s + seeded(seed + 44) * 25), z = center.z
      const slope = Math.abs(groundHeight(x + .5, z) - groundHeight(x - .5, z))
      dummy.position.set(x, groundHeight(x, z) - s * (.18 + slope * .45), z)
      dummy.rotation.set((seeded(seed + 23) - .5) * .15, seeded(seed + 45) * Math.PI * 2, side * .04)
      dummy.scale.set(s * (.7 + seeded(seed + 4) * .6), s * (.55 + seeded(seed + 12) * 1.05), s)
      dummy.updateMatrix(); ice.setMatrixAt(i, dummy.matrix)
    }
    world.add(rocks, shade, ice)
    yield
  }
  const draft = terrain.geometry
  terrain.geometry = terrainGeometry()
  draft.dispose()
  yield
  for (let camp = 1; camp < 4; camp++) { addCamp(world, camp, poleMaterial, shadowMaterial, wind); yield }

  const positions: number[] = [], indices: number[] = []
  for (let row = 0; row <= 30; row++) for (let col = 0; col <= 90; col++) {
    const x = -1800 + col * 40, z = -1370 - row * 32
    const ridge = Math.pow(.5 + .5 * Math.sin(x * .008 + row * .18), 2)
    const mountain = 150 + ridge * 110 + Math.sin(x * .021 - row * .3) * 22 - row * .9
    const skirt = THREE.MathUtils.smoothstep(row, 0, 4) * (1 - THREE.MathUtils.smoothstep(row, 26, 30))
    positions.push(x, THREE.MathUtils.lerp(-250, mountain, skirt), z)
    if (row < 30 && col < 90) { const a = row * 91 + col; indices.push(a, a + 1, a + 91, a + 1, a + 92, a + 91) }
  }
  const distant = new THREE.BufferGeometry()
  distant.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  distant.setIndex(indices); distant.computeVertexNormals()
  world.add(new THREE.Mesh(distant, matte('#71899e')))
}

