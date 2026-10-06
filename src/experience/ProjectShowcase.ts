import * as THREE from 'three'
import { projects } from '../data/projects'
import { checkpoints } from '../data/checkpoints'
import { buildDevice, SCREEN_HEIGHT, type ShowcaseDevice } from './showcaseDevices'
import { cameraFieldOfView, exhibitionCameraPose, showcaseSite, type TerrainSurface } from './terrain'
import { contactPatch, seatOnGround } from './grounding'
import type { ExpeditionFrame } from './progress'

// s: the leaving structure clears first, the next settles from the opposite side (≈ .6 s in all).
const FADE_OUT = .24, FADE_IN = .38, HANDOFF = .3, POWER_ON = .34
const PROJECTS = checkpoints.findIndex(camp => camp.id === 'high-camp')
/** Where the exhibit may stand, in the High Camp view (metres): ahead of the plateau the walker can rest on. */
const ANCHOR = { forward: [30, 36, 42], right: 38 }
/** Display width search range in metres; final size is fitted independently in projected space. */
const SCALE = { max: 52, min: 12 }
/** Lateral limit for anything on the ground: the guide rope runs just inside it. */
const ROPE_CLEARANCE = 3.3
/** Below head height (m above the shelf), nothing may reach into the walked line. */
const WALK = { height: 2.3, clearance: 1.1 }
const TINT = new THREE.Color('#e7ecef')
/** Walking on past the exhibit, it dissolves into the weather like the camp panels, before the walker reaches it (m). */
const PASSING = { start: 6.5, end: 2.5 }
/** NDC: as the nearing exhibit would slide under the trail navigation, it yields over this much overflow; the
    first sliver (still within the 32 px kept before the labels) absorbs seating and rounding differences. */
const YIELD = { after: .02, over: .35 }

type Slot = ShowcaseDevice & {
  presence: number
  texture: THREE.Texture | null
  power: number
  /** Contact shadow: a wide soft patch and a tight core where the footing meets the snow. */
  shade: THREE.Mesh
  core: THREE.Mesh
  bury: number
  rest: { position: THREE.Vector3; quaternion: THREE.Quaternion; scale: number; matrix: THREE.Matrix4 }
  silhouette: THREE.Vector3[]
  /** Corners of every part held above the ground: none may meet the snow face. */
  hull: THREE.Vector3[]
  groundHull: THREE.Vector3[]
  /** Forward distance of the structure's nearest point in the High Camp view, for the passing dissolve. */
  front: number
}

const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
const toward = (value: number, target: number, step: number) => value < target ? Math.min(target, value + step) : Math.max(target, value - step)
const up = new THREE.Vector3(0, 1, 0), behind = new THREE.Vector3(), turn = new THREE.Quaternion()
const corners = (box: THREE.Box3) => [0, 1].flatMap(x => [0, 1].flatMap(y => [0, 1].map(z => new THREE.Vector3(x ? box.max.x : box.min.x, y ? box.max.y : box.min.y, z ? box.max.z : box.min.z))))
const idle = () => new Promise<void>(resolve => typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(() => resolve(), { timeout: 200 }) : window.setTimeout(resolve, 16))

/** A cold sky over bright snow, with the key light's highlight: what the anodised metal reflects. */
function exhibitEnvironment(renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene()
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { uTop: { value: new THREE.Color('#4f6f84') }, uHorizon: { value: new THREE.Color('#d9e2e6') }, uGround: { value: new THREE.Color('#a9b7bf') }, uSun: { value: new THREE.Vector3(-180, 240, -90).normalize() } },
    vertexShader: 'varying vec3 vDirection; void main(){ vDirection = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 uTop, uHorizon, uGround, uSun; varying vec3 vDirection;
      void main(){ float h = vDirection.y;
        vec3 color = h > 0.0 ? mix(uHorizon, uTop, pow(h, .55)) : mix(uHorizon, uGround, pow(-h, .45));
        color += vec3(1.0, .96, .9) * pow(max(dot(vDirection, uSun), 0.0), 90.0) * 2.4;
        gl_FragColor = vec4(color, 1.0); }`,
  })
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), material)
  scene.add(sphere)
  const generator = new THREE.PMREMGenerator(renderer)
  const target = generator.fromScene(scene, .015)
  generator.dispose(); sphere.geometry.dispose(); material.dispose()
  return target
}

/**
 * The Projects exhibit: five structures standing on one levelled shelf in the High Camp view, of which only
 * the selected one is present. Real geometry in the shared world (its light, fog and terrain); project changes
 * cross over inside the camp without touching the camera, the journey or the terrain.
 */
export class ProjectShowcase {
  readonly group = new THREE.Group()
  private slots: Slot[] = []
  private surface: TerrainSurface | null = null
  private environment: THREE.WebGLRenderTarget | null = null
  // Stand-by: an unlit panel until the capture has arrived, never a white flash.
  private placeholder = new THREE.DataTexture(new Uint8Array([9, 12, 15, 255]), 1, 1)
  private selected = 0
  private enabled = false
  private loading = false
  private disposed = false
  private dirty = true
  private lastTime = -1
  private width = 1
  private height = 1
  private hover = 0
  private nearness = 1
  private limits = { left: -1, right: 1 }
  private poseRoute = -1
  private hovering = false
  private linkState = ''
  private reported = ''
  private view = new THREE.PerspectiveCamera()
  private corner = new THREE.Vector3()

  constructor(private renderer: THREE.WebGLRenderer | null = null, private root: HTMLElement | null = null) {
    this.group.name = 'project-showcase'
    this.placeholder.colorSpace = THREE.SRGBColorSpace
    this.placeholder.needsUpdate = true
    if (renderer) this.environment = exhibitEnvironment(renderer)
    this.link?.addEventListener('pointerenter', this.onEnter)
    this.link?.addEventListener('pointerleave', this.onLeave)
  }

  private get link() { return this.root?.querySelector<HTMLAnchorElement>('.showcase-link') ?? null }
  private onEnter = () => { this.hovering = true; this.dirty = true }
  private onLeave = () => { this.hovering = false; this.dirty = true }

  /** One environment stage: every structure is built once; textures arrive later, near the camp. */
  build(world: THREE.Group, surface: TerrainSurface, shadow: () => THREE.Material) {
    this.surface = surface
    for (const project of projects) {
      const device = buildDevice(project.slug, this.environment?.texture ?? null, this.placeholder)
      const shadeMaterial = shadow(), coreMaterial = shadow()
      shadeMaterial.userData.opacity = .4; coreMaterial.userData.opacity = .5
      const shade = new THREE.Mesh(new THREE.BufferGeometry(), shadeMaterial), core = new THREE.Mesh(new THREE.BufferGeometry(), coreMaterial)
      shade.name = `showcase-shadow-${project.slug}`; core.name = `showcase-contact-${project.slug}`
      device.footing.computeBoundingBox()
      const hull: THREE.Vector3[] = []
      device.group.updateMatrixWorld(true)
      device.group.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return
        const part = new THREE.Box3().setFromObject(object)
        if (part.min.y > .1) hull.push(...corners(part))
      })
      // What the eye sees: the parts themselves, not the empty corners of the overall box.
      const footingPoints = device.footing.getAttribute('position')
      const groundHull = [...new Map(Array.from({ length: footingPoints.count }, (_, i) => {
        const p = new THREE.Vector3().fromBufferAttribute(footingPoints, i)
        return [p.toArray().map(n => n.toFixed(5)).join(','), p] as const
      })).values()]
      const silhouette = [...hull, ...groundHull]
      device.group.visible = shade.visible = core.visible = false
      this.slots.push({ ...device, materials: [...device.materials, shadeMaterial, coreMaterial], presence: 0, texture: null, power: 0, shade, core, bury: -device.footing.boundingBox!.min.y + .014, rest: { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), scale: 1, matrix: new THREE.Matrix4() }, silhouette, hull, groundHull, front: Infinity })
      this.group.add(device.group, shade, core)
    }
    world.add(this.group)
    this.select(this.selected, true)
  }

  /** The composition is set for the camp's own view, where every route to Projects arrives, in this viewport. */
  layout(camera: THREE.PerspectiveCamera, width: number, height: number) {
    this.width = width; this.height = height
    if (!this.surface) return
    const view = this.view, target = new THREE.Vector3()
    view.fov = cameraFieldOfView(showcaseSite.route, camera.aspect, width); view.aspect = camera.aspect; view.near = camera.near; view.far = camera.far
    view.updateProjectionMatrix()
    exhibitionCameraPose(showcaseSite.route, view.position, target, width, camera.aspect)
    view.lookAt(target); view.updateMatrixWorld(true)
    const limits = this.limits = this.freeSpace(width)
    type Placement = { anchor: THREE.Vector3; quaternion: THREE.Quaternion; facing: number; scale: number; size: number }
    // Each structure takes the nearest spot to the walked line where its footing clears the rope, nothing
    // meets the face or the walker, and its display stays between the text and the trail.
    const place = (slot: Slot, forward: number, scale: number): Placement | null => {
      for (let right = ROPE_CLEARANCE; right <= ANCHOR.right; right += .4) {
        const anchor = showcaseSite.toWorld(forward, right)
        // A restrained three-quarter view exposes the chassis while keeping the capture readable.
        const facing = Math.atan2(view.position.x - anchor.x, view.position.z - anchor.z) + .24
        const quaternion = new THREE.Quaternion().setFromAxisAngle(up, facing)
        const box = this.projectedBox(slot, anchor, quaternion, scale)
        // The rope and the walker are left behind by stepping right; the face and the trail only get closer.
        if (!box.clear || !box.walk) continue
        if (box.right > limits.right || box.top > .76 || box.bottom < -.86) continue
        if (box.face && box.left >= limits.left && box.screenLeft >= limits.left + .025) return { anchor, quaternion, facing, scale, size: box.screenRight - box.screenLeft }
      }
      return null
    }
    // Fit the actual silhouette of each exhibit independently. A tall layered display must never
    // shrink the laptop or workstation; the projected capture, not world-unit scale, is the priority.
    const placements = this.slots.map(slot => {
      let best: Placement | null = null
      for (const forward of ANCHOR.forward) {
        for (let scale = SCALE.max; scale >= SCALE.min; scale -= .4) {
          const candidate = place(slot, forward, scale)
          if (candidate) { if (!best || candidate.size > best.size) best = candidate; break }
        }
      }
      return best
    })
    // The same landscape condition the panel layout uses (styles.css): narrower screens show the flat capture.
    this.enabled = width > 1000 && camera.aspect >= 1.2 && placements.every(Boolean)
    for (const [index, slot] of this.slots.entries()) {
      const { anchor, quaternion, facing, scale } = placements[index] ?? { anchor: showcaseSite.toWorld(ANCHOR.forward[0], ANCHOR.right), quaternion: new THREE.Quaternion(), facing: 0, scale: SCALE.min }
      slot.group.position.copy(anchor); slot.group.quaternion.copy(quaternion); slot.group.scale.setScalar(scale)
      seatOnGround(slot.group, slot.footing, this.surface, slot.bury * scale)
      slot.rest.position.copy(slot.group.position); slot.rest.quaternion.copy(quaternion); slot.rest.scale = scale
      slot.group.updateMatrixWorld(true)
      slot.rest.matrix.copy(slot.group.matrixWorld)
      slot.front = Math.min(...slot.silhouette.map(point => { const p = this.corner.copy(point).applyMatrix4(slot.group.matrixWorld).sub(showcaseSite.origin); return p.x * showcaseSite.forward.x + p.z * showcaseSite.forward.z }))
      const { width: w, depth: d, x, z } = slot.shadow
      const center = new THREE.Vector3(x, 0, z).applyMatrix4(slot.group.matrixWorld)
      slot.shade.geometry.dispose(); slot.core.geometry.dispose()
      slot.shade.geometry = contactPatch(this.surface, center.x, center.z, w * scale * 1.35, d * scale * 1.35, facing)
      const footing = slot.footing.boundingBox!, base = new THREE.Vector3((footing.min.x + footing.max.x) / 2, 0, (footing.min.z + footing.max.z) / 2).applyMatrix4(slot.group.matrixWorld)
      slot.core.geometry = contactPatch(this.surface, base.x, base.z, (footing.max.x - footing.min.x) * scale * 1.25, (footing.max.z - footing.min.z) * scale * 1.3, facing)
      this.apply(slot)
    }
    if (this.root) this.root.dataset.showcase = this.enabled ? '3d' : '2d'
    this.linkState = ''
    this.dirty = true
  }

  /** NDC span left free by the Projects text (left) and the trail labels (right), measured from layout boxes. */
  private freeSpace(width: number) {
    const root = this.root
    const labels = root ? Array.from(root.querySelectorAll<HTMLElement>('.trail-checkpoint .nav-label')).map(label => label.getBoundingClientRect()).filter(rect => rect.width) : []
    const right = labels.length ? Math.min(...labels.map(rect => rect.left)) - 32 : width * .86
    const text = root?.querySelector<HTMLElement>('#high-camp .project-preview')
    let left = width * .34
    if (text) {
      // Offsets ignore the spatial transforms the panel may be carrying right now.
      left = text.offsetWidth + 24
      for (let node: HTMLElement | null = text; node; node = node.offsetParent as HTMLElement | null) left += node.offsetLeft
    }
    return { left: left / width * 2 - 1, right: right / width * 2 - 1 }
  }

  private projectedBox(slot: Slot, anchor: THREE.Vector3, quaternion: THREE.Quaternion, scale: number) {
    const origin = anchor.clone().setY(showcaseSite.level - .014 * scale)
    const matrix = new THREE.Matrix4().compose(origin, quaternion, new THREE.Vector3(scale, scale, scale))
    let right = -Infinity, top = -Infinity, left = Infinity, bottom = Infinity, screenLeft = Infinity, screenRight = -Infinity
    for (const point of slot.silhouette) {
      const p = this.corner.copy(point).applyMatrix4(matrix).project(this.view)
      right = Math.max(right, p.x); top = Math.max(top, p.y); left = Math.min(left, p.x); bottom = Math.min(bottom, p.y)
    }
    slot.group.updateMatrixWorld(true)
    const screenMatrix = slot.screen.matrixWorld.clone().premultiply(slot.group.matrixWorld.clone().invert()).premultiply(matrix)
    for (const x of [-.5, .5]) for (const y of [-SCREEN_HEIGHT / 2, SCREEN_HEIGHT / 2]) {
      const p = this.corner.set(x, y, 0).applyMatrix4(screenMatrix).project(this.view)
      screenLeft = Math.min(screenLeft, p.x); screenRight = Math.max(screenRight, p.x)
    }
    if (right > this.limits.right || left < this.limits.left || top > .76 || bottom < -.86) {
      return { right, top, left, bottom, screenLeft, screenRight, clear: false, face: false, walk: false }
    }
    // Whatever stands on the ground keeps outside the guide rope; displays may reach over it, well above head height.
    const { origin: site, right: across } = showcaseSite
    let nearest = Infinity
    for (const point of slot.groundHull) {
      const p = this.corner.copy(point).applyMatrix4(matrix)
      nearest = Math.min(nearest, (p.x - site.x) * across.x + (p.z - site.z) * across.z)
    }
    // Above-ground parts keep clear of the shelf's rising edge and the face behind it, and of the walked line
    // below head height: a display may reach over the walker, a desk or a laptop may not.
    let face = true, walk = true
    for (const point of slot.hull) {
      const p = this.corner.copy(point).applyMatrix4(matrix)
      const lateral = (p.x - site.x) * across.x + (p.z - site.z) * across.z
      face &&= p.y >= this.surface!.heightAt(p.x, p.z) + .15
      walk &&= p.y - showcaseSite.level >= WALK.height || lateral >= WALK.clearance
    }
    return { right, top, left, bottom, screenLeft, screenRight, clear: nearest >= ROPE_CLEARANCE, face, walk }
  }

  select(index: number, instant = false) {
    this.selected = index
    if (instant) this.slots.forEach((slot, i) => { slot.presence = i === index ? 1 : 0; this.apply(slot) })
    this.dirty = true
  }

  /** Per controller frame. Returns true while something on the exhibit is still moving. */
  update(frame: ExpeditionFrame, camera: THREE.PerspectiveCamera) {
    if (!this.slots.length) return false
    const delta = this.lastTime < 0 ? 0 : Math.min(.1, Math.max(0, frame.time - this.lastTime))
    this.lastTime = frame.time
    // Captures load on the way up (or as soon as Projects is the destination), never at Home.
    if (this.enabled && !this.loading && (frame.progress > .38 || frame.destination >= PROJECTS)) void this.loadCaptures()
    let moving = false
    // Nearing the exhibit on the way up, it yields as it would slide under the trail, and clears before the
    // walker would reach it; walking back, it returns the same way. Only the camera position decides.
    if (this.enabled && (frame.route !== this.poseRoute || this.dirty)) {
      this.poseRoute = frame.route
      const slot = this.slots[this.selected]
      const ahead = slot.front - ((camera.position.x - showcaseSite.origin.x) * showcaseSite.forward.x + (camera.position.z - showcaseSite.origin.z) * showcaseSite.forward.z)
      let right = -Infinity
      // Far down the route the exhibit is a small shape ahead; only near the camp can it reach the trail.
      if (ahead < 60) for (const point of slot.silhouette) right = Math.max(right, this.corner.copy(point).applyMatrix4(slot.rest.matrix).project(camera).x)
      const nearness = Math.min(THREE.MathUtils.smoothstep(ahead, PASSING.end, PASSING.start), 1 - THREE.MathUtils.smoothstep(right - this.limits.right - YIELD.after, 0, YIELD.over))
      if (nearness !== this.nearness) { this.nearness = nearness; this.slots.forEach(item => this.apply(item)) }
    }
    const leaving = this.slots.some((slot, i) => i !== this.selected && slot.presence > HANDOFF)
    this.slots.forEach((slot, i) => {
      const target = i === this.selected ? (leaving ? slot.presence : 1) : 0
      const presence = frame.reducedMotion ? target : toward(slot.presence, target, delta / (target > slot.presence ? FADE_IN : FADE_OUT))
      const power = slot.texture ? (frame.reducedMotion ? 1 : toward(slot.power, 1, delta / POWER_ON)) : 0
      if (presence !== slot.presence || power !== slot.power) {
        slot.presence = presence; slot.power = power
        this.apply(slot)
      }
      moving ||= slot.presence !== target || (slot.texture !== null && slot.power < 1)
    })
    const hover = frame.reducedMotion ? Number(this.hovering) : toward(this.hover, Number(this.hovering), delta / .2)
    if (hover !== this.hover) { this.hover = hover; this.apply(this.slots[this.selected]); moving = true }
    this.placeLink(frame, camera)
    this.report()
    const dirty = this.dirty
    this.dirty = false
    return moving || dirty
  }

  private apply(slot: Slot) {
    const selected = slot === this.slots[this.selected], settle = 1 - smootherstep(slot.presence)
    const shown = smootherstep(slot.presence) * this.nearness
    slot.group.visible = slot.shade.visible = slot.core.visible = this.enabled && shown > .001
    // Leaving recedes a little and turns away; arriving settles from slightly nearer, turned the other way.
    const side = selected ? -1 : 1, rest = slot.rest
    behind.set(0, 0, -1).applyQuaternion(rest.quaternion)
    slot.group.position.copy(rest.position).addScaledVector(behind, settle * .065 * rest.scale * side)
    slot.group.quaternion.copy(rest.quaternion).multiply(turn.setFromAxisAngle(up, settle * .075 * side))
    slot.group.scale.setScalar(rest.scale * (1 - settle * .015))
    for (const material of slot.materials) {
      // Base opacity lives in userData: the shadows and the glass sheen are always blended. At rest the
      // structure renders opaque; three.js bakes that into the program, so a change recompiles (cached).
      const base = material.userData.opacity as number | undefined, transparent = shown < .999 || base !== undefined
      if (material.transparent !== transparent) { material.transparent = transparent; material.needsUpdate = true }
      material.opacity = (base ?? 1) * shown
    }
    const level = .045 + (1 - .045) * smootherstep(slot.power)
    slot.screen.material.color.copy(TINT).multiplyScalar(level * (1 + (selected ? this.hover : 0) * .07))
    if (!slot.texture) slot.screen.material.color.setScalar(1)
  }

  private async loadCaptures() {
    this.loading = true
    const order = [this.selected, ...projects.map((_, i) => i).filter(i => i !== this.selected)]
    for (const index of order) {
      if (this.disposed) return
      const image = new Image()
      image.decoding = 'async'
      image.src = projects[index].screen.desktop
      try { await image.decode() } catch { continue }
      if (this.disposed) return
      const texture = new THREE.Texture(image)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.anisotropy = Math.min(8, this.renderer?.capabilities.getMaxAnisotropy() ?? 1)
      texture.needsUpdate = true
      // Upload between frames, so the first sight of a capture never stalls the walk.
      await idle()
      if (this.disposed) { texture.dispose(); return }
      this.renderer?.initTexture(texture)
      const slot = this.slots[index]
      slot.texture = texture
      slot.screen.material.map = texture
      this.apply(slot)
      this.dirty = true
    }
  }

  /** A pointer target over the visible display, so the exhibit itself opens the project. */
  private placeLink(frame: ExpeditionFrame, camera: THREE.PerspectiveCamera) {
    const link = this.link
    if (!link) return
    const slot = this.slots[this.selected]
    if (!this.enabled || !frame.sections[PROJECTS]?.interactive || frame.returningHome || slot.presence < 1 || this.nearness < 1) {
      if (this.linkState !== 'hidden') { link.style.visibility = 'hidden'; this.linkState = 'hidden' }
      return
    }
    slot.screen.updateWorldMatrix(true, false)
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity
    for (const [x, y] of [[-.5, -1], [.5, -1], [-.5, 1], [.5, 1]]) {
      const p = this.corner.set(x, y * SCREEN_HEIGHT / 2, 0).applyMatrix4(slot.screen.matrixWorld).project(camera)
      const px = (p.x + 1) / 2 * this.width, py = (1 - p.y) / 2 * this.height
      left = Math.min(left, px); right = Math.max(right, px); top = Math.min(top, py); bottom = Math.max(bottom, py)
    }
    const state = [left, top, right - left, bottom - top].map(Math.round).join(',')
    if (state === this.linkState) return
    this.linkState = state
    const [x, y, w, h] = state.split(',').map(Number)
    link.style.visibility = 'visible'
    link.style.transform = `translate(${x}px, ${y}px)`
    link.style.width = `${w}px`; link.style.height = `${h}px`
  }

  /**
   * Compiles both renderings of every structure (at rest, and crossing over) before the first project change,
   * without touching what is on view: copies of the materials, lit like the world, in a scene of their own.
   * Programs are shared by their parameters, so the exhibit's own materials find them ready.
   */
  async warmUp(world: THREE.Scene, camera: THREE.Camera) {
    if (!this.renderer || !this.slots.length) return
    const scene = new THREE.Scene(), copies: THREE.Material[] = []
    scene.fog = world.fog
    world.traverse(object => { if (object instanceof THREE.Light) scene.add(object.clone()) })
    for (const transparent of [false, true]) for (const slot of this.slots) slot.group.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return
      const material = (object.material as THREE.Material).clone()
      material.transparent = transparent || material.userData.opacity !== undefined
      copies.push(material)
      const copy = new THREE.Mesh(object.geometry, material)
      copy.matrixAutoUpdate = false
      copy.matrix.copy(object.matrixWorld)
      scene.add(copy)
    })
    try { await this.renderer.compileAsync(scene, camera) } catch { copies.forEach(material => material.dispose()); return }
    if (this.disposed) { copies.forEach(material => material.dispose()); return }
    this.warm = { scene, copies }
  }

  private warm: { scene: THREE.Scene; copies: THREE.Material[] } | null = null

  /** Draws the warm-up copies once, inside a frame that then renders the world over them: first-draw costs
      (buffers, program setup) are paid here, at Home, not at the first project change. */
  drawWarmUp(camera: THREE.Camera) {
    if (!this.warm || !this.renderer) return false
    this.renderer.render(this.warm.scene, camera)
    this.warm.copies.forEach(material => material.dispose())
    this.warm = null
    return true
  }

  /** The structures as laid out for this viewport, read-only, for checks. */
  get structures() {
    return { enabled: this.enabled, items: this.slots.map(({ slug, group, screen, footing, bury, rest }) => ({ slug, group, screen, footing, bury, scale: rest.scale })) }
  }

  /** What the exhibit shows, on the root for the DOM and its checks: the settled project and whether its capture is lit. */
  private report() {
    const slot = this.slots[this.selected]
    const settled = this.slots.every(item => item === slot ? item.presence === 1 : item.presence === 0)
    const state = this.enabled ? `${settled ? slot.slug : ''}|${settled && slot.power === 1}` : ''
    if (state === this.reported || !this.root) return
    this.reported = state
    if (!this.enabled || !settled) delete this.root.dataset.showcaseProject
    else this.root.dataset.showcaseProject = slot.slug
    this.root.dataset.showcaseLit = String(this.enabled && settled && slot.power === 1)
  }

  dispose() {
    this.disposed = true
    this.link?.removeEventListener('pointerenter', this.onEnter)
    this.link?.removeEventListener('pointerleave', this.onLeave)
    for (const slot of this.slots) slot.texture?.dispose()
    this.placeholder.dispose()
    this.environment?.dispose()
    if (this.root) { delete this.root.dataset.showcase; delete this.root.dataset.showcaseProject; delete this.root.dataset.showcaseLit }
  }
}
