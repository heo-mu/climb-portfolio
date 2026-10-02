import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { cameraPose, routePoint, seeded, showcaseSite, terrainGeometry, TerrainSurface } from './terrain'
import { rockGeometry, iceGeometry, tentGeometry, tentSeams, tentVestibule } from './props'
import { contactPatch, groundPole, guideRoute, HangingRope, ROPE_RADIUS, seatOnGround } from './grounding'
import { addSummit } from './summit'
import { addCheckpointCamp } from './checkpointCamps'
import { arrivalCamps, type CampSetup } from './campLayout'
import { addLandforms } from './landforms'
import { worldMood } from './worldMood'
import { scenePalette } from './scenePalette'

const matte = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: .94 })

export function contactMaterial() {
  const material = new THREE.MeshBasicMaterial({ color: '#233743', transparent: true, opacity: .28, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 })
  material.onBeforeCompile = shader => {
    shader.vertexShader = 'varying vec2 vContact;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvContact = uv;')
    shader.fragmentShader = 'varying vec2 vContact;\n' + shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.a *= pow(max(0.0, 1.0 - length(vContact - 0.5) * 2.0), 1.7);')
  }
  return material
}

function addFlags(world: THREE.Group, surface: TerrainSurface, start: THREE.Vector3, end: THREE.Vector3, poleMaterial: THREE.Material, wind: { value: number }, seed: number) {
  const height = 2.55
  const supports = [start, end].map(p => groundPole(surface, p.x, p.z, height, .06))
  const poleGeometry = new THREE.CylinderGeometry(.022, .032, supports[0].length, 10)
  for (const support of supports) {
    const pole = new THREE.Mesh(poleGeometry, poleMaterial)
    pole.position.copy(support.center); pole.quaternion.copy(support.rotation)
    world.add(pole)
  }
  let sag = .55
  for (let i = 1; i < 64; i++) {
    const t = i / 64, p = supports[0].anchor.clone().lerp(supports[1].anchor, t)
    sag = Math.min(sag, (p.y - surface.heightAt(p.x, p.z) - .75) / (4 * t * (1 - t)))
  }
  const curve = new HangingRope(supports[0].anchor, supports[1].anchor, Math.max(0, sag))
  const at = (t: number) => curve.getPoint(t)
  world.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, .007, 4, false), matte('#7f8074')))
  const positions: number[] = [], colors: number[] = [], indices: number[] = [], flex: number[] = []
  const palette = scenePalette.prayer.map(c => new THREE.Color(c))
  const length = start.distanceTo(end), count = Math.floor(length / .85)
  for (let i = 0; i < count; i++) {
    if (seeded(seed + i * 5) < .09) continue
    const t = (i + .2 + seeded(i + seed) * .25) / count
    const width = (.38 + seeded(i + 13) * .2) / length
    const drop = .37 + seeded(i + 9) * .19, base = positions.length / 3
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
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 1, emissive: '#887b62', emissiveIntensity: .13 })
  material.onBeforeCompile = shader => {
    shader.uniforms.uClothTime = wind
    shader.vertexShader = 'uniform float uClothTime; attribute float flex;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.z += sin(position.x * 2.4 + position.z + uClothTime * 1.6) * 0.045 * flex;')
  }
  world.add(new THREE.Mesh(geometry, material))
}

function addRoute(world: THREE.Group, surface: TerrainSurface, poleMaterial: THREE.Material) {
  const dummy = new THREE.Object3D(), { poles, ropes } = guideRoute(surface)
  const stakes = new THREE.InstancedMesh(new THREE.CylinderGeometry(.022, .03, 1, 12), poleMaterial, poles.length)
  const ties = new THREE.InstancedMesh(new THREE.CylinderGeometry(.038, .038, .036, 10), matte('#aaa08d'), poles.length)
  poles.forEach((pole, i) => {
    dummy.position.copy(pole.center); dummy.quaternion.copy(pole.rotation); dummy.scale.set(1, pole.length, 1)
    dummy.updateMatrix(); stakes.setMatrixAt(i, dummy.matrix)
    dummy.position.copy(pole.anchor); dummy.scale.setScalar(1); dummy.updateMatrix(); ties.setMatrixAt(i, dummy.matrix)
  })
  const ropeMaterial = matte('#a99c81')
  ropeMaterial.onBeforeCompile = shader => {
    shader.vertexShader = 'varying vec2 vFiber;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvFiber = uv;')
    shader.fragmentShader = 'varying vec2 vFiber;\n' + shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= 0.94 + 0.06 * sin(vFiber.x * 18000.0 + vFiber.y * 31.4);')
  }
  const spans = ropes.map(rope => new THREE.TubeGeometry(rope, Math.max(12, Math.ceil(rope.start.distanceTo(rope.end) * 5)), ROPE_RADIUS, 6, false))
  const ropeGeometry = mergeGeometries(spans)!
  spans.forEach(span => span.dispose())
  stakes.name = 'route-supports'
  const rope = new THREE.Mesh(ropeGeometry, ropeMaterial); rope.name = 'route-rope'
  world.add(stakes, ties, rope)
  return poles.map(pole => pole.anchor)
}

function addCamp(world: THREE.Group, surface: TerrainSurface, camp: CampSetup, poleMaterial: THREE.Material, shadowMaterial: THREE.Material, wind: { value: number }) {
  const center = routePoint(camp.route), count = camp.tents
  const fly = new THREE.MeshStandardMaterial({ color: camp.tentColor, roughness: .98, vertexColors: true, side: THREE.DoubleSide })
  const outer = new THREE.MeshStandardMaterial({ color: scenePalette.vestibule, roughness: .97, side: THREE.DoubleSide })
  const dark = new THREE.MeshStandardMaterial({ color: '#1d2b31', roughness: 1, side: THREE.DoubleSide })
  const frameMaterial = matte(scenePalette.seams), skirtMaterial = matte('#495357')
  const geometry = tentGeometry(), vestibule = tentVestibule(), seams = tentSeams(frameMaterial)
  const door = new THREE.Shape()
  door.moveTo(-.58, .08); door.lineTo(.58, .08); door.lineTo(.4, .76); door.quadraticCurveTo(0, 1.33, -.4, .76); door.closePath()
  const entrance = new THREE.ShapeGeometry(door, 16)
  const skirtGeometry = new THREE.BoxGeometry(2.45, .26, 3.68)
  const view = new THREE.PerspectiveCamera(64, 1.6, .08, 2400), target = new THREE.Vector3()
  cameraPose(camp.route, view.position, target); view.lookAt(target); view.updateMatrixWorld(true)
  for (let i = 0; i < count; i++) {
    const initialZ = center.z - camp.tentDepth - i * 12
    const side = i === 2 ? -1 : 1
    let x = 0, z = initialZ, best = Infinity
    // Find a real shelf, keeping the footprint outside both the walkway and rope.
    for (const dz of [-3, 0, 3]) for (const offset of [6.4, 8.5, 11, 14]) {
      const pz = initialZ + dz, px = routePoint(-pz / 1120).x + side * offset
      const h = surface.heightAt(px, pz), normal = surface.normalAt(px, pz, 2)
      let unevenness = 0
      for (const dx of [-1.7, 1.7]) for (const depth of [-2.6, 2.6]) {
        const plane = h - (normal.x * dx + normal.z * depth) / normal.y
        unevenness += Math.abs(surface.heightAt(px + dx, pz + depth) - plane)
      }
      const screen = new THREE.Vector3(px, h + .9, pz).project(view)
      const framing = camp.route === 0 ? 0 : Math.max(0, screen.x - .63) * 35 + Math.abs(screen.x - .47) * 3
      const score = (1 - normal.y) * 18 + unevenness + Math.abs(dz) * .025 + offset * .008 + framing
      if (score < best) { best = score; x = px; z = pz }
    }
    const tent = new THREE.Group(), size = .91 + seeded(i + camp.seed) * .18
    tent.name = 'camp-tent'
    tent.userData.checkpoint = camp.id
    tent.position.set(x, 0, z)
    const yaw = -.25 + i * .37
    tent.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), surface.normalAt(x, z, 2))
    tent.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw))
    tent.scale.setScalar(size)
    seatOnGround(tent, skirtGeometry, surface, .07)
    const doorway = new THREE.Mesh(entrance, dark); doorway.position.z = 1.865
    const skirt = new THREE.Mesh(skirtGeometry, skirtMaterial)
    tent.add(new THREE.Mesh(geometry, fly), new THREE.Mesh(vestibule, outer), doorway, seams.clone(), skirt)
    world.add(tent)
    const shade = new THREE.Mesh(contactPatch(surface, x, z + .2, 4.4 * size, 5.4 * size, yaw), shadowMaterial)
    world.add(shade)
    tent.updateMatrixWorld(true)
    const guyPoints: THREE.Vector3[] = []
    for (const side of [-1, 1]) for (const dz of [-1.1, 1.1]) {
      const anchor = tent.localToWorld(new THREE.Vector3(side * 1.15, 1.1, dz))
      const stake = tent.localToWorld(new THREE.Vector3(side * 2.35, 0, dz * 1.75))
      stake.y = surface.heightAt(stake.x, stake.z) + .025
      guyPoints.push(anchor, stake)
    }
    world.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(guyPoints), new THREE.LineBasicMaterial({ color: '#a59c82', transparent: true, opacity: .7 })))
  }
  const a = new THREE.Vector3(center.x - (camp.route === 0 ? 10 : 5), 0, center.z - 22)
  const b = new THREE.Vector3(center.x + 18, 0, center.z - 14)
  a.y = surface.heightAt(a.x, a.z); b.y = surface.heightAt(b.x, b.z)
  if (camp.prayer) addFlags(world, surface, a, b, poleMaterial, wind, camp.seed)
  // Dispose unused template geometry in the tent-free final camp.
  if (!count) {
    geometry.dispose(); vestibule.dispose(); entrance.dispose(); skirtGeometry.dispose()
    seams.traverse(object => { if (object instanceof THREE.Mesh) object.geometry.dispose() })
    fly.dispose(); outer.dispose(); dark.dispose(); frameMaterial.dispose(); skirtMaterial.dispose()
  }
}

/** Builds the Projects exhibit on the rendered terrain; see ProjectShowcase. */
export type ShowcaseBuilder = { build(world: THREE.Group, surface: TerrainSurface, shadow: () => THREE.Material): void }

/** One bounded stage per idle callback. No extra loading surface blocks Home. */
export function* environmentStages(parent: THREE.Object3D, wind: { value: number }, showcase?: ShowcaseBuilder) {
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
  terrain.name = 'alpine-terrain'
  world.add(terrain)
  yield
  const draft = terrain.geometry
  terrain.geometry = terrainGeometry()
  draft.dispose()
  const surface = new TerrainSurface(terrain.geometry)
  yield
  const poleMaterial = new THREE.MeshStandardMaterial({ color: '#556976', metalness: .35, roughness: .65 })
  const shadowMaterial = contactMaterial()
  const routeAnchors = addRoute(world, surface, poleMaterial)
  addCamp(world, surface, { id: 'base-camp', route: 0, tents: 5, tentDepth: 14, tentColor: scenePalette.tents[0], prayer: true, seed: 0 }, poleMaterial, shadowMaterial, wind)
  yield
  for (const camp of arrivalCamps) {
    addCamp(world, surface, camp, poleMaterial, shadowMaterial, wind)
    addCheckpointCamp(world, surface, camp, routeAnchors, wind, poleMaterial, shadowMaterial)
    yield
  }

  world.updateMatrixWorld(true)
  const campBounds = world.children.filter(object => object.name === 'camp-tent').map(object => new THREE.Box3().setFromObject(object).expandByScalar(.6))
  for (const arrival of world.children.filter(object => object.name.startsWith('arrival-'))) campBounds.push(new THREE.Box3().setFromObject(arrival).expandByScalar(.8))
  // The levelled exhibit shelf at High Camp stays clear of loose boulders, with or without the exhibit built.
  const { forward: [nearShelf, farShelf], right: [ropeSide, faceSide], soft } = showcaseSite.shelf
  campBounds.push(new THREE.Box3().setFromPoints([nearShelf, farShelf].flatMap(f => [ropeSide, faceSide + soft.face].map(r => showcaseSite.toWorld(f, r)))).expandByVector(new THREE.Vector3(1, Infinity, 1)))
  for (const camp of [0, 1]) {
    const center = routePoint(camp / 4)
    campBounds.push(new THREE.Box3(
      new THREE.Vector3(center.x - (camp === 0 ? 11 : 6), -Infinity, center.z - 23),
      new THREE.Vector3(center.x + 19, Infinity, center.z - 13),
    ))
  }
  const clearCamp = (x: number, z: number, radius: number, side: number) => {
    for (const bounds of campBounds) {
      if (z + radius > bounds.min.z && z - radius < bounds.max.z && x + radius > bounds.min.x && x - radius < bounds.max.x) {
        x = side > 0 ? bounds.max.x + radius : bounds.min.x - radius
      }
    }
    return x
  }

  const dummy = new THREE.Object3D()
  const rockMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .98, flatShading: true })
  const iceMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .68, metalness: 0, flatShading: true, emissive: '#254255', emissiveIntensity: .035 })
  for (let variant = 0; variant < 5; variant++) {
    const rocks = new THREE.InstancedMesh(rockGeometry(variant), rockMaterial, 90)
    const patches: THREE.BufferGeometry[] = []
    const ice = new THREE.InstancedMesh(iceGeometry(variant), iceMaterial, 20)
    let rockCount = 0, iceCount = 0
    for (let i = 0; i < rocks.count; i++) {
      const seed = i + variant * 733, band = seeded(seed + 2), u = seeded(seed + 83)
      const t = band < .24 ? u * .09 : band < .56 ? .09 + u * .24 : band < .65 ? .36 + u * .17 : .56 + u * .32
      const center = routePoint(t), side = i % 2 ? 1 : -1
      const s = .18 + seeded(seed + 41) ** 2 * (t < .09 ? 1.7 : t > .55 ? 3.7 : 2.6)
      // Full size clearance, not center-only clearance, keeps boulders off the guide rope.
      const z = center.z
      const minimumOffset = 5.4 + s * 2.3
      let offset = minimumOffset + seeded(seed + 53) ** 2 * 35 + worldMood(t).basin * 32
      let x = clearCamp(center.x + side * offset, z, s * 2.3, side)
      // Loose stones need a shelf. Cliff faces use embedded bedrock instead of
      // isolated boulders balanced against almost vertical snow walls.
      while (surface.normalAt(x, z, Math.max(.6, s)).y < .8 && offset > minimumOffset) {
        offset = Math.max(minimumOffset, offset - 2)
        x = clearCamp(center.x + side * offset, z, s * 2.3, side)
      }
      if (surface.normalAt(x, z, Math.max(.6, s)).y < .8) continue
      dummy.position.set(x, 0, z)
      const normal = surface.normalAt(x, z, Math.max(.6, s))
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal)
      dummy.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), seeded(seed + 1) * Math.PI * 2))
      // Steep walls expose shallow bedrock, rather than balancing whole boulders.
      const exposure = THREE.MathUtils.smoothstep(normal.y, .45, .9)
      dummy.scale.set(s * (1 + seeded(seed + 15) * .5), s * (.8 + seeded(seed + 19) * .45) * (.32 + exposure * .68), s)
      // A gentle average slope can still hide a sharp crest inside the footprint.
      // Reject those sites rather than burying the center and exposing a hollow rim.
      const ground = surface.heightAt(x, z)
      let relief = 0
      for (const dx of [-dummy.scale.x, 0, dummy.scale.x]) for (const dz of [-s, 0, s]) {
        const plane = ground - (normal.x * dx + normal.z * dz) / normal.y
        relief = Math.max(relief, Math.abs(surface.heightAt(x + dx, z + dz) - plane))
      }
      if (relief > s * .3) continue
      seatOnGround(dummy, rocks.geometry, surface, s * (.4 + (1 - exposure) * .15))
      rocks.setMatrixAt(rockCount, dummy.matrix)
      rocks.setColorAt(rockCount++, new THREE.Color().setScalar(.82 + seeded(seed + 19) * .22))
      patches.push(contactPatch(surface, x, z, s * 3.2, s * 2.8))
    }
    for (let i = 0; i < ice.count; i++) {
      const seed = i + variant * 411
      // Separated groups with breathing room and unequal height, not a wall of blocks.
      const cluster = Math.floor(seeded(seed + 7) * 7)
      const t = .085 + cluster * .036 + seeded(seed + 11) * .018
      const center = routePoint(t), side = i % 2 ? 1 : -1
      const s = 1.2 + seeded(seed + 80) ** 1.4 * 4.7
      const z = center.z
      const minimumOffset = 7 + s * 1.6
      let offset = minimumOffset + seeded(seed + 44) * 18
      // Seracs grow from the glacier floor; avoid isolated towers on cliff faces.
      while (offset > minimumOffset && surface.normalAt(center.x + side * offset, z, s).y < .82) offset = Math.max(minimumOffset, offset - 1)
      const x = clearCamp(center.x + side * offset, z, s * 1.6, side)
      if (surface.normalAt(x, z, s).y < .76) continue
      dummy.position.set(x, 0, z)
      const iceNormal = new THREE.Vector3(0, 1, 0).lerp(surface.normalAt(x, z, s), .35).normalize()
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), iceNormal)
      dummy.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), seeded(seed + 45) * Math.PI * 2))
      dummy.scale.set(s * (.7 + seeded(seed + 4) * .6), s * (.55 + seeded(seed + 12) * 1.05), s)
      seatOnGround(dummy, ice.geometry, surface, s * .14)
      ice.setMatrixAt(iceCount++, dummy.matrix)
    }
    rocks.count = rockCount; ice.count = iceCount
    const shade = new THREE.Mesh(mergeGeometries(patches)!, shadowMaterial)
    patches.forEach(patch => patch.dispose())
    rocks.name = 'grounded-rocks'; ice.name = 'grounded-ice'
    world.add(rocks, shade, ice)
    yield
  }
  addLandforms(world, surface, clearCamp)
  yield
  addSummit(world, surface, wind, shadowMaterial)
  yield
  if (showcase) {
    showcase.build(world, surface, contactMaterial)
    yield
  }

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

