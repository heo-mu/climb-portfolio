import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { rockGeometry } from './props'
import { scenePalette } from './scenePalette'

/**
 * Five exhibit structures with one material language. Units are the display width (the project captures are
 * 16:9 and are never cropped or stretched); the origin is the centre of the footing on the ground, the display
 * faces +z. Footings start no further left than x -.21, so the structure stands between the guide rope and the
 * face while its display reaches out over the walked line, well above head height. Each structure owns its
 * materials, so it can fade on its own.
 */
export const SCREEN_HEIGHT = 9 / 16

export type ShowcaseDevice = {
  slug: string
  group: THREE.Group
  /** The project capture; its texture replaces the stand-by placeholder once loaded. */
  screen: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  /** Lower hull used to seat the structure on the rendered terrain. */
  footing: THREE.BufferGeometry
  /** Contact shadow footprint, in display widths. */
  shadow: { width: number; depth: number; x: number; z: number }
  materials: THREE.Material[]
}

type Kit = ReturnType<typeof materialKit>

/** A soft diagonal reflection band for the cover glass, computed (no canvas: the builders also run in tests). */
let sheenTexture: THREE.DataTexture | null = null
function sheen() {
  if (sheenTexture) return sheenTexture
  const size = 64, data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / (size - 1), v = y / (size - 1), band = Math.exp(-Math.pow((u * .8 + v - 1.05) / .2, 2)) * .85 + (1 - v) * .15
    const value = Math.round(255 * Math.min(1, band))
    data.set([value, value, value, 255], (y * size + x) * 4)
  }
  sheenTexture = new THREE.DataTexture(data, size, size)
  sheenTexture.colorSpace = THREE.SRGBColorSpace
  sheenTexture.magFilter = THREE.LinearFilter; sheenTexture.minFilter = THREE.LinearFilter
  sheenTexture.needsUpdate = true
  return sheenTexture
}

function materialKit(environment: THREE.Texture | null, placeholder: THREE.Texture) {
  const metal = (color: string, roughness: number, metalness = .72) => new THREE.MeshStandardMaterial({ color, roughness, metalness, envMap: environment, envMapIntensity: .9 })
  return {
    // Anodised graphite aluminium, a darker anodised trim, glossy black cover glass.
    shell: metal('#5b646a', .34),
    trim: metal('#2c3338', .42, .6),
    glass: new THREE.MeshStandardMaterial({ color: '#050708', roughness: .14, metalness: .2, envMap: environment, envMapIntensity: .6 }),
    steel: metal('#626c72', .48, .55),
    matte: new THREE.MeshStandardMaterial({ color: '#30373c', roughness: .78, metalness: .15, envMap: environment, envMapIntensity: .35 }),
    concrete: new THREE.MeshStandardMaterial({ color: '#8d969b', roughness: .96 }),
    stone: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .98, flatShading: true }),
    line: new THREE.MeshBasicMaterial({ color: '#4a5c66', toneMapped: false }),
    screen: new THREE.MeshBasicMaterial({ color: '#ffffff', map: placeholder, toneMapped: false }),
    // The cover glass over the capture: a faint, fixed reflection, added light only.
    sheen: Object.assign(new THREE.MeshBasicMaterial({ map: sheen(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), { userData: { opacity: .07 } }),
    // The one lime note per structure: a stand-by indicator, a few pixels at most.
    accent: new THREE.MeshBasicMaterial({ color: scenePalette.summit, toneMapped: false }),
  }
}

function roundedRect(width: number, height: number, radius: number) {
  const shape = new THREE.Shape(), x = -width / 2, y = -height / 2, r = Math.min(radius, width / 2, height / 2)
  shape.moveTo(x + r, y)
  shape.lineTo(x + width - r, y); shape.absarc(x + width - r, y + r, r, -Math.PI / 2, 0, false)
  shape.lineTo(x + width, y + height - r); shape.absarc(x + width - r, y + height - r, r, 0, Math.PI / 2, false)
  shape.lineTo(x + r, y + height); shape.absarc(x + r, y + height - r, r, Math.PI / 2, Math.PI, false)
  shape.lineTo(x, y + r); shape.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false)
  return shape
}

/** A machined slab: rounded corners in its plane, softened edges, centred, thickness along z. */
function slab(width: number, height: number, depth: number, radius: number) {
  const bevel = Math.min(depth * .32, radius * .6)
  const source = new THREE.ExtrudeGeometry(roundedRect(width - bevel * 2, height - bevel * 2, Math.max(radius - bevel, .001)), { depth: depth - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 7 })
  source.translate(0, 0, -(depth - bevel * 2) / 2)
  source.deleteAttribute('uv'); source.deleteAttribute('normal')
  const geometry = mergeVertices(source, 1e-6)
  source.dispose()
  geometry.computeVertexNormals()
  return geometry
}

const box = (width: number, height: number, depth: number, radius = Math.min(width, height, depth) * .25) => new RoundedBoxGeometry(width, height, depth, 2, radius)

function place<T extends THREE.Object3D>(object: T, x: number, y: number, z: number, rotationX = 0) {
  object.position.set(x, y, z); object.rotation.x = rotationX
  return object
}

/** Shell, cover glass, then the capture on it: an exact 16:9 plane, inset by the bezel. */
function display(kit: Kit, width: number, height: number, depth: number, radius: number, screenOffsetY: number) {
  const group = new THREE.Group()
  group.add(new THREE.Mesh(slab(width, height, depth, radius), kit.shell))
  const glass = new THREE.Mesh(new THREE.ShapeGeometry(roundedRect(width - .006, height - .006, Math.max(radius - .003, .001)), 6), kit.glass)
  glass.position.z = depth / 2 + .0003
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1, SCREEN_HEIGHT), kit.screen)
  screen.position.set(0, screenOffsetY, depth / 2 + .0007)
  const reflection = new THREE.Mesh(new THREE.PlaneGeometry(width - .006, height - .006), kit.sheen)
  reflection.position.z = depth / 2 + .0011
  group.add(glass, screen, reflection)
  return { group, screen, front: depth / 2 + .0013 }
}

/**
 * The world's own boulder (props.rockGeometry), dressed into a plinth: its crown cut level for the device,
 * the cut face bare stone, the remaining snow cap kept on the outer rim. Normalised to a unit footprint.
 */
function plinthGeometry(variant: number, cut: number) {
  const geometry = rockGeometry(variant)
  geometry.computeBoundingBox()
  const { min, max } = geometry.boundingBox!
  const level = min.y + (max.y - min.y) * cut
  const positions = geometry.getAttribute('position'), colors = geometry.getAttribute('color')
  const stone = new THREE.Color('#46535c'), color = new THREE.Color()
  for (let i = 0; i < positions.count; i++) {
    if (positions.getY(i) < level - .02) continue
    positions.setY(i, Math.min(positions.getY(i), level))
    color.fromBufferAttribute(colors, i).lerp(stone, .78)
    colors.setXYZ(i, color.r, color.g, color.b)
  }
  geometry.translate(-(min.x + max.x) / 2, -level, -(min.z + max.z) / 2)
  geometry.scale(1 / (max.x - min.x), 1 / (level - min.y), 1 / (max.z - min.z))
  geometry.computeVertexNormals()
  return geometry
}

/** Footing geometry in the structure's own space, from the meshes that bear on the ground. */
function footingOf(group: THREE.Group, parts: THREE.Mesh[]) {
  group.updateMatrixWorld(true)
  const inverse = group.matrixWorld.clone().invert()
  return mergeGeometries(parts.map(part => {
    const geometry = part.geometry.clone()
    for (const name of Object.keys(geometry.attributes)) if (name !== 'position') geometry.deleteAttribute(name)
    return geometry.applyMatrix4(part.matrixWorld.clone().premultiply(inverse))
  }))!
}

/** 들임: a thin premium laptop on a stone plinth, the product UI as the subject. */
function laptopOnStone(kit: Kit) {
  const group = new THREE.Group()
  // Unit plinth: top at 0, bottom at -1. Scaled to a .62 x .74 footprint, its top just below eye height, so
  // the deck reads from slightly above.
  const top = .12, stone = place(new THREE.Mesh(plinthGeometry(2, .74), kit.stone), .17, top, -.1)
  stone.scale.set(.76, top + .16, .96)
  const width = 1.05, chin = .046, brow = .03, lidHeight = SCREEN_HEIGHT + chin + brow, lidDepth = .014
  const deckDepth = .7, deckHeight = .017
  const laptop = place(new THREE.Group(), 0, top, .04)
  const deck = place(new THREE.Mesh(slab(width, deckDepth, deckHeight, .022), kit.shell), 0, deckHeight / 2, 0, -Math.PI / 2)
  const well = place(new THREE.Mesh(new THREE.ShapeGeometry(roundedRect(.88, .3, .012), 4), kit.trim), 0, deckHeight + .0004, -.13, -Math.PI / 2)
  const pad = place(new THREE.Mesh(new THREE.ShapeGeometry(roundedRect(.34, .2, .014), 4), kit.glass), 0, deckHeight + .0004, .2, -Math.PI / 2)
  const hinge = place(new THREE.Mesh(new THREE.CylinderGeometry(.0095, .0095, .86, 16), kit.trim), 0, deckHeight + .004, -deckDepth / 2 + .012)
  hinge.rotation.z = Math.PI / 2
  // The lid opens to 112°, pivoting on the hinge line at the rear of the deck.
  const lid = place(new THREE.Group(), 0, deckHeight + .004, -deckDepth / 2 + .012, -.38)
  const { group: panel, screen, front } = display(kit, width, lidHeight, lidDepth, .024, (chin - brow) / 2)
  panel.position.set(0, lidHeight / 2, -lidDepth / 2 + .002)
  const camera = place(new THREE.Mesh(new THREE.CircleGeometry(.0045, 12), kit.trim), 0, lidHeight - brow / 2, front - lidDepth / 2 + .002)
  const indicator = place(new THREE.Mesh(new THREE.CircleGeometry(.0018, 8), kit.accent), .012, lidHeight - brow / 2, front - lidDepth / 2 + .002)
  lid.add(panel, camera, indicator)
  laptop.add(deck, well, pad, hinge, lid)
  group.add(stone, laptop)
  return { group, screen, footing: footingOf(group, [stone]), shadow: { width: 1, depth: 1.15, x: .17, z: -.1 } }
}

/** 삼성 BEES: a wide industrial display on steel posts set in a concrete footing. */
function wideDisplayOnPosts(kit: Kit) {
  const group = new THREE.Group()
  const bezel = .03, width = 1 + bezel * 2, height = SCREEN_HEIGHT + bezel * 2, depth = .044, bottom = .25
  const { group: panel, screen } = display(kit, width, height, depth, .012, 0)
  panel.position.set(0, bottom + height / 2, 0)
  const housing = place(new THREE.Mesh(slab(.62, .36, .056, .02), kit.trim), 0, bottom + height / 2, -depth / 2 - .026)
  const postZ = -depth / 2 - .086, postTop = bottom + height * .78, postBottom = -.06
  const footing = place(new THREE.Mesh(box(.6, .1, .26, .012), kit.concrete), .1, .02, postZ)
  const parts: THREE.Object3D[] = [panel, housing, footing]
  for (const x of [-.12, .32]) {
    parts.push(place(new THREE.Mesh(box(.038, postTop - postBottom, .038, .006), kit.steel), x, (postTop + postBottom) / 2, postZ))
    parts.push(place(new THREE.Mesh(box(.1, .012, .1, .003), kit.steel), x, .076, postZ))
    for (const y of [bottom + height * .3, bottom + height * .7]) parts.push(place(new THREE.Mesh(box(.07, .03, .04, .006), kit.steel), x, y, postZ + .034))
  }
  parts.push(place(new THREE.Mesh(box(.48, .028, .028, .006), kit.steel), .1, bottom + .05, postZ))
  // A power cabinet on the footing, between the posts at the back, with the stand-by light.
  const cabinet = place(new THREE.Mesh(box(.1, .15, .07, .01), kit.trim), .19, .07 + .075, postZ - .06)
  const indicator = place(new THREE.Mesh(new THREE.CircleGeometry(.004, 10), kit.accent), .19, .07 + .12, postZ - .06 + .0352)
  parts.push(cabinet, indicator)
  group.add(...parts)
  return { group, screen, footing: footingOf(group, [footing]), shadow: { width: .9, depth: .55, x: .1, z: postZ } }
}

/** EDK: layered panels — the dashboard in front, an etched glass plate set behind and above it, one plinth. */
function layeredPanels(kit: Kit) {
  const group = new THREE.Group()
  const plinthTop = .07
  const plinth = place(new THREE.Mesh(box(.62, plinthTop, .44, .016), kit.trim), .1, plinthTop / 2, -.08)
  const lean = -.1
  const bezel = .018, width = 1 + bezel * 2, height = SCREEN_HEIGHT + bezel * 2, depth = .024
  const front = place(new THREE.Group(), 0, .3, .06, lean)
  const { group: panel, screen } = display(kit, width, height, depth, .01, 0)
  panel.position.y = height / 2
  front.add(panel)
  // A single fin rises from the plinth through both layers.
  const fin = place(new THREE.Mesh(box(.085, .78, .03, .008), kit.shell), .1, plinthTop + .39, -.11)
  // The plate behind: smoked glass in a thin frame, etched with the earlier abstract forms as quiet lines.
  const plate = place(new THREE.Group(), -.16, .6, -.2, lean)
  const plateWidth = .96, plateHeight = .6
  const frame = place(new THREE.Mesh(slab(plateWidth, plateHeight, .016, .012), kit.trim), 0, plateHeight / 2, 0)
  const face = place(new THREE.Mesh(new THREE.ShapeGeometry(roundedRect(plateWidth - .02, plateHeight - .02, .006), 4), kit.glass), 0, plateHeight / 2, .0085)
  const etch = new THREE.Group()
  etch.position.set(0, plateHeight / 2, .0093)
  const ring = new THREE.Mesh(new THREE.RingGeometry(.2, .204, 96), kit.line); ring.scale.set(1.3, 1, 1); ring.rotation.z = -.38
  ring.position.set(.12, .1, 0)
  etch.add(ring)
  for (const [x, w] of [[-.28, .14], [-.08, .2], [.16, .1]] as const) etch.add(place(new THREE.Mesh(new THREE.PlaneGeometry(w, .0035), kit.line), x, .22, 0))
  plate.add(frame, face, etch)
  const indicator = place(new THREE.Mesh(new THREE.CircleGeometry(.0035, 10), kit.accent), .35, plinthTop * .55, .1401)
  group.add(plinth, front, fin, plate, indicator)
  return { group, screen, footing: footingOf(group, [plinth]), shadow: { width: .9, depth: .75, x: .1, z: -.08 } }
}

/** 고용노동부 AX: a document-reading tablet tilted on a lectern stand. */
function tabletOnLectern(kit: Kit) {
  const group = new THREE.Group()
  const base = place(new THREE.Mesh(box(.62, .03, .5, .01), kit.trim), .1, .015, -.08)
  const tilt = -.42, ledgeY = .27, ledgeZ = .06
  const bezel = .046, width = 1 + bezel * 2, height = SCREEN_HEIGHT + bezel * 2, depth = .032
  const tablet = place(new THREE.Group(), 0, ledgeY + .012, ledgeZ, tilt)
  const { group: panel, screen } = display(kit, width, height, depth, .05, 0)
  panel.position.set(0, height / 2, 0)
  tablet.add(panel)
  const ledge = place(new THREE.Mesh(box(.64, .026, .05, .008), kit.shell), 0, ledgeY, ledgeZ + .012)
  // A slanted cradle behind the tablet, an A-frame of two legs, all on one base plate.
  const cradle = place(new THREE.Mesh(box(.5, .36, .02, .006), kit.shell), .1, ledgeY + .19, ledgeZ - .1, tilt)
  const legTop = new THREE.Vector3(0, ledgeY + .3, ledgeZ - .17), legs: THREE.Mesh[] = []
  for (const x of [-.2, .2]) {
    const foot = new THREE.Vector3(.1 + x * 1.2, .03, -.28), direction = legTop.clone().setX(.1 + x).sub(foot)
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.009, .011, direction.length(), 12), kit.steel)
    leg.position.copy(foot).addScaledVector(direction, .5)
    leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize())
    legs.push(leg)
  }
  const column = place(new THREE.Mesh(box(.05, ledgeY - .03, .05, .01), kit.shell), .1, .03 + (ledgeY - .03) / 2, ledgeZ + .005)
  const indicator = place(new THREE.Mesh(new THREE.CircleGeometry(.003, 10), kit.accent), .28, ledgeY, ledgeZ + .0375)
  group.add(base, tablet, ledge, cradle, ...legs, column, indicator)
  return { group, screen, footing: footingOf(group, [base]), shadow: { width: .95, depth: .8, x: .1, z: -.08 } }
}

/** 사내 그룹웨어: an orderly workstation — a wide monitor on its stand, keyboard and pad on a desk. */
function workstation(kit: Kit) {
  const group = new THREE.Group()
  const deskTop = .2, deskWidth = 1.16, deskDepth = .5, deskX = .1
  const top = place(new THREE.Mesh(slab(deskWidth, deskDepth, .026, .014), kit.matte), deskX, deskTop - .013, -.04, -Math.PI / 2)
  // Panel legs set in from the ends: the top cantilevers past them, the footprint stays compact.
  const legs = [-.17, .37].map(x => place(new THREE.Mesh(box(.032, deskTop - .026, deskDepth - .08, .008), kit.shell), x, (deskTop - .026) / 2, -.04))
  const rail = place(new THREE.Mesh(box(.54, .05, .018, .006), kit.shell), deskX, deskTop - .05, -.25)
  const bezel = .016, chin = .03, width = 1 + bezel * 2, height = SCREEN_HEIGHT + bezel + chin, depth = .02
  const monitorBottom = deskTop + .07
  const { group: monitor, screen, front } = display(kit, width, height, depth, .008, (chin - bezel) / 2)
  monitor.position.set(0, monitorBottom + height / 2, -.12)
  const neck = place(new THREE.Mesh(box(.07, .2, .014, .005), kit.shell), 0, deskTop + .11, -.145)
  const foot = place(new THREE.Mesh(box(.28, .01, .16, .004), kit.shell), 0, deskTop + .005, -.12)
  const keyboard = place(new THREE.Mesh(box(.42, .012, .13, .005), kit.trim), -.06, deskTop + .006, .1)
  const pad = place(new THREE.Mesh(box(.12, .008, .095, .004), kit.glass), .26, deskTop + .004, .1)
  const indicator = place(new THREE.Mesh(new THREE.CircleGeometry(.0025, 10), kit.accent), .44, monitorBottom + chin / 2, -.12 + front)
  group.add(top, ...legs, rail, monitor, neck, foot, keyboard, pad, indicator)
  return { group, screen, footing: footingOf(group, legs), shadow: { width: 1.2, depth: .62, x: deskX, z: -.04 } }
}

const builders: Record<string, (kit: Kit) => Omit<ShowcaseDevice, 'slug' | 'materials'>> = {
  deurim: laptopOnStone,
  'samsung-bees': wideDisplayOnPosts,
  edk: layeredPanels,
  'moel-ax': tabletOnLectern,
  groupware: workstation,
}

export function buildDevice(slug: string, environment: THREE.Texture | null, placeholder: THREE.Texture): ShowcaseDevice {
  const kit = materialKit(environment, placeholder)
  const device = builders[slug](kit)
  device.group.name = `showcase-${slug}`
  device.screen.name = 'showcase-screen'
  return { slug, ...device, materials: Object.values(kit) }
}
