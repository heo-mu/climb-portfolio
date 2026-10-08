import * as THREE from 'three'
import { projects } from '../data/projects'
import { checkpoints } from '../data/checkpoints'
import { buildDisplay, captureFit, SCREEN_HEIGHT, type ShowcaseDevice } from './showcaseDevices'
import { cameraFieldOfView, cameraPose, showcaseSite, type TerrainSurface } from './terrain'
import { contactPatch, seatOnGround } from './grounding'
import { campZones, projectsPresentation, type ExpeditionFrame } from './progress'
import { CaptureDecoder } from './CaptureDecoder'

const CROSSFADE = .28
const PROJECTS = checkpoints.findIndex(camp => camp.id === 'high-camp')
/** Where the exhibit may stand, in the High Camp view (metres): ahead of the plateau the walker can rest on. */
const ANCHOR = { forward: [100, 110, 120], right: 100 }
/** Display width search range in metres; final size is fitted independently in projected space. */
const SCALE = { max: 140, min: 40 }
const GROUND_EMBED = .003
/** Lateral limit for anything on the ground: the guide rope runs just inside it. */
const ROPE_CLEARANCE = 3.3
/** Below head height (m above the shelf), nothing may reach into the walked line. */
const WALK = { height: 2.3, clearance: 1.1 }
type Exhibit = ShowcaseDevice & {
  /** Contact shadow: a wide soft patch and a tight core where the footing meets the snow. */
  shade: THREE.Mesh
  core: THREE.Mesh
  bury: number
  rest: { scale: number }
  silhouette: THREE.Vector3[]
  /** Corners of every part held above the ground: none may meet the snow face. */
  hull: THREE.Vector3[]
  groundHull: THREE.Vector3[]
}

const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
const up = new THREE.Vector3(0, 1, 0)
// The lower edge is the critical sightline over the ridge; sample it more densely.
const visibilityFace = [
  ...Array.from({ length: 9 }, (_, i) => [-.514 + 1.028 * i / 8, -.295]),
  ...[-.514, 0, .514].flatMap(x => [[x, 0], [x, .295]]),
]
const screenHitCorners = [[-.5, -1], [.5, -1], [-.5, 1], [.5, 1]] as const
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

/** A world-fixed camp display; selection changes only its capture. */
export class ProjectShowcase {
  readonly group = new THREE.Group()
  private exhibit: Exhibit | null = null
  private surface: TerrainSurface | null = null
  private environment: THREE.WebGLRenderTarget | null = null
  // Stand-by: an unlit panel until the capture has arrived, never a white flash.
  private placeholder = new THREE.DataTexture(new Uint8Array([9, 12, 15, 255]), 1, 1)
  private selected = 0
  private displayed = -1
  private transition = 1
  private instantSelection = false
  private textures: (THREE.Texture | null)[] = projects.map(() => null)
  private bitmaps: ImageBitmap[] = []
  private decoder = new CaptureDecoder()
  private preparing = new Map<number, Promise<void>>()
  private enabled = false
  private layoutReady = false
  private loading = false
  private disposed = false
  private dirty = true
  private lastTime = -1
  private width = 1
  private height = 1
  private nearness = 0
  private limits = { left: -1, right: 1 }
  private poseRoute = -1
  private linkState = ''
  private linkRoute = -1
  private reported = ''
  private view = new THREE.PerspectiveCamera()
  private corner = new THREE.Vector3()
  private sight = new THREE.Vector3()
  private revealPoints: THREE.Vector3[] = []

  constructor(private renderer: THREE.WebGLRenderer | null = null, private root: HTMLElement | null = null) {
    this.link = root?.querySelector<HTMLAnchorElement>('.showcase-link') ?? null
    this.group.name = 'project-showcase'
    this.placeholder.colorSpace = THREE.SRGBColorSpace
    this.placeholder.needsUpdate = true
    if (renderer) this.environment = exhibitEnvironment(renderer)
  }

  private link: HTMLAnchorElement | null = null
  private visibilityProfile = new Float32Array(129)
  private reportedPresence = -1
  build(world: THREE.Group, surface: TerrainSurface, shadow: () => THREE.Material) {
    this.surface = surface
    const device = buildDisplay(this.environment?.texture ?? null, this.placeholder)
    const shadeMaterial = shadow(), coreMaterial = shadow()
    shadeMaterial.userData.opacity = .5; coreMaterial.userData.opacity = .8
    const shade = new THREE.Mesh(new THREE.BufferGeometry(), shadeMaterial), core = new THREE.Mesh(new THREE.BufferGeometry(), coreMaterial)
    shade.name = 'showcase-shadow'; core.name = 'showcase-contact'
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
    this.exhibit = { ...device, materials: [...device.materials, shadeMaterial, coreMaterial], shade, core, bury: -device.footing.boundingBox!.min.y + GROUND_EMBED, rest: { scale: 1 }, silhouette, hull, groundHull }
    this.group.add(device.group, shade, core)
    world.add(this.group)
    this.select(this.selected, true)
  }

  /** The composition is set for the camp's own view, where every route to Projects arrives, in this viewport. */
  layout(camera: THREE.PerspectiveCamera, width: number, height: number) {
    this.group.matrixAutoUpdate = false
    this.group.matrix.identity()
    this.group.updateMatrixWorld(true)
    this.width = width; this.height = height
    const slot = this.exhibit
    if (!this.surface || !slot) return
    // Measure the destination layout, not the previous viewport's 2D grid.
    if (this.root) this.root.dataset.showcase = width > 1024 && camera.aspect >= 1.2 ? '3d' : '2d'
    const view = this.view, target = new THREE.Vector3()
    view.fov = cameraFieldOfView(showcaseSite.progress, camera.aspect, width); view.aspect = camera.aspect; view.near = camera.near; view.far = camera.far
    view.updateProjectionMatrix()
    cameraPose(showcaseSite.progress, view.position, target)
    view.lookAt(target); view.updateMatrixWorld(true)
    // Parallel to the camp camera's image plane, not aimed at its off-centre eye position.
    // Only the display tilts: the support and footing remain vertical and grounded.
    const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(view.quaternion)
    const facing = Math.atan2(normal.x, normal.z)
    const quaternion = new THREE.Quaternion().setFromAxisAngle(up, facing)
    slot.group.position.set(0, 0, 0); slot.group.quaternion.identity(); slot.group.scale.setScalar(1)
    slot.panel.quaternion.copy(quaternion).invert().multiply(view.quaternion)
    slot.fitStand()
    slot.group.updateMatrixWorld(true)
    slot.hull = []
    slot.group.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return
      const part = new THREE.Box3().setFromObject(object)
      if (part.min.y > .1) slot.hull.push(...corners(part))
    })
    slot.silhouette = [...slot.hull, ...slot.groundHull]
    const limits = this.limits = this.freeSpace(width)
    type Placement = { anchor: THREE.Vector3; quaternion: THREE.Quaternion; facing: number; scale: number; size: number }
    // Fit the common display between the text and trail, with its footing beyond the rope.
    const readingViews = Array.from({ length: 11 }, (_, i) => THREE.MathUtils.lerp(...campZones[PROJECTS].arrival, i / 10)).map(progress => {
      const probe = view.clone()
      cameraPose(progress, probe.position, target)
      probe.fov = cameraFieldOfView(progress, probe.aspect, width)
      probe.updateProjectionMatrix(); probe.lookAt(target); probe.updateMatrixWorld(true)
      return probe
    })
    const installation = new THREE.Object3D()
    const place = (slot: Exhibit, forward: number, scale: number): Placement | null => {
      for (let right = ROPE_CLEARANCE; right <= ANCHOR.right; right += 1) {
        const anchor = showcaseSite.toWorld(forward, right)
        const box = this.projectedBox(slot, anchor, quaternion, scale)
        // Candidate footings stay outside the rope and the walked corridor.
        if (!box.clear || !box.walk) continue
        if (box.right > limits.right || box.top > .76 || box.bottom < -.86) continue
        if (box.screenRight - box.screenLeft > .98 || box.left + box.right < limits.left + limits.right) continue
        if (box.face && box.left >= limits.left && box.screenLeft >= limits.left + .025) {
          installation.position.copy(anchor); installation.quaternion.copy(quaternion); installation.scale.setScalar(scale)
          seatOnGround(installation, slot.footing, this.surface!, slot.bury * scale)
          const seated = this.projectedBox(slot, anchor, quaternion, scale, installation.position.y)
          if (!seated.face || seated.left < limits.left || seated.right > limits.right || seated.top > .76 || seated.bottom < -.86) continue
          const matrix = installation.matrix.clone().multiply(slot.panel.matrixWorld)
          this.revealPoints = visibilityFace.map(([x, y]) => new THREE.Vector3(x, y, .021).applyMatrix4(matrix))
          if (readingViews.every(probe => this.measureClearance(probe, 1.25) === 1)) return { anchor, quaternion, facing, scale, size: box.screenRight - box.screenLeft }
        }
      }
      return null
    }
    let placement: Placement | null = null
    for (const forward of ANCHOR.forward) {
      for (let scale = SCALE.max; scale >= SCALE.min; scale -= 1) {
        const candidate = place(slot, forward, scale)
        if (candidate) { if (!placement || candidate.size > placement.size) placement = candidate; break }
      }
    }
    this.enabled = width > 1024 && camera.aspect >= 1.2 && placement !== null
    this.layoutReady = true
    const { anchor, scale } = placement ?? { anchor: showcaseSite.toWorld(ANCHOR.forward[0], ANCHOR.right), scale: SCALE.min }
    slot.group.position.copy(anchor); slot.group.quaternion.copy(quaternion); slot.group.scale.setScalar(scale)
    seatOnGround(slot.group, slot.footing, this.surface, slot.bury * scale)
    slot.rest.scale = scale
    slot.group.updateMatrixWorld(true)
    // Test the complete face; the grounded support may be naturally occluded by snow.
    this.revealPoints = visibilityFace.map(([x, y]) => new THREE.Vector3(x, y, .021).applyMatrix4(slot.panel.matrixWorld))
    const { width: w, depth: d, x, z } = slot.shadow
    const center = new THREE.Vector3(x, 0, z).applyMatrix4(slot.group.matrixWorld)
    slot.shade.geometry.dispose(); slot.core.geometry.dispose()
    slot.shade.geometry = contactPatch(this.surface, center.x, center.z, w * scale * 1.35, d * scale * 1.35, facing, 48)
    const footing = slot.footing.boundingBox!, base = new THREE.Vector3((footing.min.x + footing.max.x) / 2, 0, (footing.min.z + footing.max.z) / 2).applyMatrix4(slot.group.matrixWorld)
    slot.core.geometry = contactPatch(this.surface, base.x, base.z, (footing.max.x - footing.min.x) * scale * 1.45, (footing.max.z - footing.min.z) * scale * 1.5, facing, 32)
    // Terrain sightlines are sampled once on layout, never during scrolling.
    const probe = view.clone()
    for (let i = 0; i < this.visibilityProfile.length; i++) {
      const progress = .68 + .24 * i / (this.visibilityProfile.length - 1)
      cameraPose(progress, probe.position, target)
      probe.fov = cameraFieldOfView(progress, probe.aspect, width)
      probe.updateProjectionMatrix(); probe.lookAt(target); probe.updateMatrixWorld(true)
      this.visibilityProfile[i] = this.enabled ? this.measureClearance(probe) : 0
    }
    this.apply(slot)
    if (this.root) this.root.dataset.showcase = this.enabled ? '3d' : '2d'
    this.linkState = ''
    this.dirty = true
  }

  /** NDC span left free by the Projects text (left) and the trail labels (right), measured from layout boxes. */
  private freeSpace(width: number) {
    const root = this.root
    const labels = root ? Array.from(root.querySelectorAll<HTMLElement>('.trail-checkpoint .nav-label')).map(label => label.getBoundingClientRect()).filter(rect => rect.width) : []
    const right = labels.length ? Math.min(...labels.map(rect => rect.left)) - 24 : width * .86
    const text = root?.querySelector<HTMLElement>('#high-camp .projects-editorial')
    let left = width * .34
    if (text) {
      // Offsets ignore the spatial transforms the panel may be carrying right now.
      left = text.offsetWidth + 24
      for (let node: HTMLElement | null = text; node; node = node.offsetParent as HTMLElement | null) left += node.offsetLeft
    }
    return { left: left / width * 2 - 1, right: right / width * 2 - 1 }
  }

  private projectedBox(slot: Exhibit, anchor: THREE.Vector3, quaternion: THREE.Quaternion, scale: number, height = showcaseSite.level - GROUND_EMBED * scale) {
    const origin = anchor.clone().setY(height)
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
    // below head height: the screen may reach over the walker, the base may not.
    let face = true, walk = true
    for (const point of slot.hull) {
      const p = this.corner.copy(point).applyMatrix4(matrix)
      const lateral = (p.x - site.x) * across.x + (p.z - site.z) * across.z
      face &&= p.y >= this.surface!.heightAt(p.x, p.z) + .15
      walk &&= p.y - showcaseSite.level >= WALK.height || lateral >= WALK.clearance
    }
    // Validate the rotated parts' world bounds too: their exposed corners must
    // not disappear into the rising edge of the new camp shelf.
    const bounds = new THREE.Box3()
    for (let start = 0; start < slot.hull.length && face; start += 8) {
      bounds.makeEmpty()
      for (let i = start; i < start + 8; i++) bounds.expandByPoint(this.corner.copy(slot.hull[i]).applyMatrix4(matrix))
      for (const p of [bounds.min, bounds.max]) face &&= p.y >= this.surface!.heightAt(p.x, p.z) + .15
    }
    return { right, top, left, bottom, screenLeft, screenRight, clear: nearest >= ROPE_CLEARANCE, face, walk }
  }

  select(index: number, instant = false) {
    if (!projects[index]) return
    if (index === this.selected && !instant) return
    this.selected = index
    if (instant) { this.transition = 1; this.instantSelection = true }
    this.dirty = true
  }

  /** Per controller frame. Returns true while something on the exhibit is still moving. */
  update(frame: ExpeditionFrame, camera: THREE.PerspectiveCamera) {
    const slot = this.exhibit
    if (!slot) return false
    const delta = this.lastTime < 0 ? 0 : Math.min(.1, Math.max(0, frame.time - this.lastTime))
    this.lastTime = frame.time
    // Captures load on the way up (or as soon as Projects is the destination), never at Home.
    if (this.enabled && !this.loading && (frame.journeyProgress > .38 || frame.destination >= PROJECTS)) void this.loadCaptures()
    let moving = false
    // Camera staging and presence share the same arrival envelope, in either direction.
    if (this.enabled && (frame.journeyProgress !== this.poseRoute || this.dirty)) {
      this.poseRoute = frame.journeyProgress
      const { presence } = projectsPresentation(frame.journeyProgress)
      // The exhibit and its shadows stay at their surveyed world pose.
      const nearness = (this.displayed >= 0 || this.textures[this.selected]) && presence > 0 ? this.clearanceAt(frame.journeyProgress) * presence : 0
      if (nearness !== this.nearness) { this.nearness = nearness; this.apply(slot) }
    }
    const screen = slot.screen.material.uniforms
    if (this.displayed !== this.selected && this.textures[this.selected]) {
      screen.fromMap.value = screen.toMap.value
      screen.fromFit.value.copy(screen.toFit.value)
      screen.toMap.value = this.textures[this.selected]
      const { width, height } = projects[this.selected].screen
      screen.toFit.value.copy(captureFit(width, height))
      this.transition = this.displayed < 0 || this.instantSelection ? 1 : 0
      this.displayed = this.selected
      screen.mixAmount.value = this.transition
    }
    if (this.instantSelection && this.displayed === this.selected) screen.mixAmount.value = 1
    this.instantSelection = false
    if (this.transition < 1) {
      this.transition = frame.reducedMotion ? 1 : Math.min(1, this.transition + delta / CROSSFADE)
      screen.mixAmount.value = smootherstep(this.transition)
      moving = true
    }
    this.placeLink(frame, camera)
    this.report()
    const dirty = this.dirty
    this.dirty = false
    return moving || dirty
  }

  /** Cached terrain visibility; the object never follows the camera. */
  private clearanceAt(progress: number) {
    const sample = THREE.MathUtils.clamp((progress - .68) / .24, 0, 1) * (this.visibilityProfile.length - 1)
    const low = Math.min(Math.floor(sample), this.visibilityProfile.length - 2)
    return THREE.MathUtils.lerp(this.visibilityProfile[low], this.visibilityProfile[low + 1], sample - low)
  }

  private measureClearance(camera: THREE.PerspectiveCamera, clearHeight = .45) {
    let clearance = Infinity, margin = Infinity
    for (const point of this.revealPoints) {
      const projected = this.corner.copy(point).project(camera)
      if (projected.z >= 1 || projected.z <= -1) return 0
      margin = Math.min(margin, 1 - Math.abs(projected.x), 1 - Math.abs(projected.y))
      if (margin <= 0) return 0
      const distance = camera.position.distanceTo(point)
      // Stop short of the footing's intentional contact with the snow.
      for (let step = 1; step < distance - 3; step += 1) {
        this.sight.lerpVectors(camera.position, point, step / distance)
        clearance = Math.min(clearance, this.sight.y - this.surface!.heightAt(this.sight.x, this.sight.z))
        if (clearance <= .05) return 0
      }
    }
    return THREE.MathUtils.smoothstep(clearance, .05, clearHeight) * THREE.MathUtils.smoothstep(margin, .015, .06)
  }

  private apply(slot: Exhibit) {
    const shown = this.nearness
    slot.group.visible = slot.shade.visible = slot.core.visible = this.enabled && shown > .001
    // Only journey approach/exit affects presence. Selection never touches geometry or transforms.
    for (const material of slot.materials) {
      if (material === slot.screen.material) continue
      const base = material.userData.opacity as number | undefined
      const transparent = shown < .999 || base !== undefined
      if (material.transparent !== transparent) { material.transparent = transparent; material.needsUpdate = true }
      material.opacity = (base ?? 1) * shown
    }
    slot.screen.material.uniforms.presence.value = shown
  }

  private async loadCaptures() {
    this.loading = true
    const order = [this.selected, ...projects.map((_, i) => i).filter(i => i !== this.selected)]
    for (const index of order) {
      if (this.disposed) return
      try { await this.prepare(index) } catch { /* Keep the current exhibit; selection can retry. */ }
    }
  }

  /** Commit selection only after the original is decoded and uploaded to this display. */
  prepare(index: number): Promise<void> {
    if (this.textures[index] || this.disposed) return Promise.resolve()
    const existing = this.preparing.get(index)
    if (existing) return existing
    const limit = Math.min(4096, this.renderer?.capabilities.maxTextureSize ?? 4096)
    const pending = this.decoder.decode(index, limit).then(async image => {
      const bitmap = 'close' in image ? image as ImageBitmap : null
      if (this.disposed) { bitmap?.close(); return }
      const texture = new THREE.Texture(bitmap ?? image)
      if (bitmap) texture.flipY = false
      texture.colorSpace = THREE.SRGBColorSpace
      texture.anisotropy = Math.min(16, this.renderer?.capabilities.getMaxAnisotropy() ?? 1)
      texture.magFilter = THREE.LinearFilter
      texture.minFilter = THREE.LinearMipmapLinearFilter
      texture.generateMipmaps = true
      texture.needsUpdate = true
      // Upload between frames, so the first sight of a capture never stalls the walk.
      await idle()
      if (this.disposed) { texture.dispose(); bitmap?.close(); return }
      try { this.renderer?.initTexture(texture) } catch (error) { texture.dispose(); bitmap?.close(); throw error }
      if (bitmap) this.bitmaps.push(bitmap)
      this.textures[index] = texture
      this.dirty = true
    }).finally(() => this.preparing.delete(index))
    this.preparing.set(index, pending)
    return pending
  }

  /** A pointer target over the visible display, so the exhibit itself opens the project. */
  private placeLink(frame: ExpeditionFrame, camera: THREE.PerspectiveCamera) {
    const link = this.link
    if (!link) return
    const slot = this.exhibit
    if (!slot) return
    if (!this.enabled || !frame.sections[PROJECTS]?.interactive || frame.returningHome || this.displayed !== this.selected || this.transition < 1 || this.nearness < 1) {
      if (this.linkState !== 'hidden') { link.style.visibility = 'hidden'; this.linkState = 'hidden' }
      return
    }
    if (!this.dirty && this.linkState !== 'hidden' && this.linkRoute === frame.journeyProgress) return
    this.linkRoute = frame.journeyProgress
    slot.screen.updateWorldMatrix(true, false)
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity
    for (const [x, y] of screenHitCorners) {
      const p = this.corner.set(x, y * SCREEN_HEIGHT / 2, 0).applyMatrix4(slot.screen.matrixWorld).project(camera)
      const px = (p.x + 1) / 2 * this.width, py = (1 - p.y) / 2 * this.height
      left = Math.min(left, px); right = Math.max(right, px); top = Math.min(top, py); bottom = Math.max(bottom, py)
    }
    const x = Math.round(left), y = Math.round(top), w = Math.round(right - left), h = Math.round(bottom - top)
    const state = `${x},${y},${w},${h}`
    if (state === this.linkState) return
    this.linkState = state
    link.style.visibility = 'visible'
    link.style.transform = `translate(${x}px, ${y}px)`
    link.style.width = `${w}px`; link.style.height = `${h}px`
  }

  /**
   * Compiles the frame at rest and on journey departure before its first appearance,
   * without touching what is on view: copies of the materials, lit like the world, in a scene of their own.
   * Programs are shared by their parameters, so the exhibit's own materials find them ready.
   */
  async warmUp(world: THREE.Scene, camera: THREE.Camera) {
    const slot = this.exhibit
    if (!this.renderer || !slot) return
    const scene = new THREE.Scene(), copies: THREE.Material[] = []
    scene.fog = world.fog
    world.traverse(object => { if (object instanceof THREE.Light) scene.add(object.clone()) })
    const meshes: THREE.Mesh[] = [slot.shade, slot.core]
    slot.group.traverse(object => { if (object instanceof THREE.Mesh) meshes.push(object) })
    for (const transparent of [false, true]) meshes.forEach(object => {
      if (!(object instanceof THREE.Mesh)) return
      const material = (object.material as THREE.Material).clone()
      // The live chassis is transparent while hidden. Derive the parked
      // variant explicitly instead of inheriting that transient fade state.
      material.transparent = transparent || object === slot.screen || material.userData.opacity !== undefined
      copies.push(material)
      const copy = new THREE.Mesh(object.geometry, material)
      copy.frustumCulled = false
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
    if (!this.warm || this.warmDrawn || !this.renderer) return false
    this.renderer.render(this.warm.scene, camera)
    // Keep both program variants referenced until scene disposal. Disposing the
    // copies here evicts their programs and recompiles them on first approach.
    this.warmDrawn = true
    return true
  }

  private warmDrawn = false

  /** The structures as laid out for this viewport, read-only, for checks. */
  get structures() {
    const slot = this.exhibit
    return { enabled: this.enabled, items: slot ? [{ group: slot.group, screen: slot.screen, footing: slot.footing, bury: slot.bury, scale: slot.rest.scale }] : [] }
  }

  get ready() { return !!this.exhibit && this.layoutReady && (!this.enabled || this.displayed >= 0) }

  /** What the exhibit shows, on the root for the DOM and its checks: the settled project and whether its capture is lit. */
  private report() {
    const presence = this.enabled ? this.nearness : 0
    if (this.root && this.reportedPresence !== presence) { this.root.dataset.showcasePresence = String(presence); this.reportedPresence = presence }
    const settled = this.displayed === this.selected && this.transition === 1
    const state = this.enabled ? `${settled ? projects[this.selected].slug : ''}|${settled}` : ''
    if (state === this.reported || !this.root) return
    this.reported = state
    if (!this.enabled || !settled) delete this.root.dataset.showcaseProject
    else this.root.dataset.showcaseProject = projects[this.selected].slug
    this.root.dataset.showcaseLit = String(this.enabled && settled)
  }

  dispose() {
    this.disposed = true
    this.decoder.dispose()
    this.textures.forEach(texture => texture?.dispose())
    this.bitmaps.forEach(bitmap => bitmap.close())
    this.exhibit?.footing.dispose()
    this.placeholder.dispose()
    this.environment?.dispose()
    this.warm?.copies.forEach(material => material.dispose())
    this.warm = null
    if (this.root) { delete this.root.dataset.showcase; delete this.root.dataset.showcaseProject; delete this.root.dataset.showcaseLit }
  }
}
