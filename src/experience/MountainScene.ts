import * as THREE from 'three'
import { cameraFieldOfView, cameraPose, seeded } from './terrain'
import { environmentStages } from './environment'
import type { ExpeditionFrame } from './progress'
import { experienceConfig as config } from '../config/experience'
import { alpineWind, worldMood } from './worldMood'
import { SpatialSectionTransition } from './SpatialSectionTransition'
import { ProjectShowcase } from './ProjectShowcase'
import { projectSelection } from './projectSelection'

type SceneOptions = { canvas: HTMLCanvasElement; root: HTMLElement; onLost: () => void; onProjectsReady: (ready: boolean) => void }
type SnowLayer = { points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>; speed: number; drift: number; fall: number }

const snowStormDrift = [.55, .15, 0] as const

export class MountainScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(config.camera.desktopFov, 1, config.camera.near, config.camera.far)
  private fog = new THREE.FogExp2('#293e53', config.atmosphere.fogBase)
  private keyLight = new THREE.DirectionalLight('#d5e1ee', config.lighting.keyBase)
  private ambient = new THREE.HemisphereLight('#c0d5e3', '#536574', config.lighting.ambientBase)
  private fill = new THREE.DirectionalLight('#afcbdc', config.lighting.fill)
  private snow: SnowLayer[] = []
  private position = new THREE.Vector3()
  private target = new THREE.Vector3()
  private sky = new THREE.Color()
  private low = new THREE.Color('#486376')
  private iceSky = new THREE.Color('#3c627c')
  private basinSky = new THREE.Color('#91aebd')
  private faceSky = new THREE.Color('#527386')
  private high = new THREE.Color('#b9d5e3')
  private snowFog = new THREE.Color('#718795')
  private horizon = new THREE.Color('#e7e5d4')
  private coldLight = new THREE.Color('#d5e1ee')
  private warmLight = new THREE.Color('#ffe2bd')
  private skyMaterial: THREE.ShaderMaterial
  private lastRender = 0
  private lastProgress = -1
  private lastReducedMotion = false
  private poseRoute = -1
  private width = 1
  private height = 1
  private layoutHasExhibit = false
  private active = true
  private resumeBuild: (() => void) | null = null
  private resizeObserver: ResizeObserver
  private disposed = false
  private wind = { value: 0 }
  private stages: Generator<void, void, unknown>
  private deferred = 0
  private idle = false
  private spatialTransition: SpatialSectionTransition
  private showcase: ProjectShowcase
  private unsubscribeSelection: () => void
  private unsubscribePreparation: () => void

  constructor(private options: SceneOptions) {
    this.spatialTransition = new SpatialSectionTransition(options.root)
    const mobile = window.innerWidth < 768
    this.renderer = new THREE.WebGLRenderer({ canvas: options.canvas, antialias: !mobile, alpha: false, powerPreference: 'high-performance' })
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = config.lighting.exposure
    this.scene.fog = this.fog
    this.keyLight.position.set(-180, 240, -90)
    this.fill.position.set(200, 100, 150)
    this.scene.add(this.keyLight, this.fill, this.ambient)
    this.showcase = new ProjectShowcase(this.renderer, options.root)
    this.stages = environmentStages(this.scene, this.wind, this.showcase)
    this.stages.next()
    this.skyMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: { uSky: { value: new THREE.Color('#182b40') }, uHorizon: { value: new THREE.Color('#52687e') }, uSun: { value: new THREE.Vector3(-.42, .2, -.8).normalize() }, uGlow: { value: 0 } },
      vertexShader: 'varying vec3 vDirection; void main(){ vDirection=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `varying vec3 vDirection; uniform vec3 uSky, uHorizon, uSun; uniform float uGlow;
        void main(){ vec3 dir=normalize(vDirection); float h=dir.y;
          vec3 sky=mix(uHorizon,uSky,smoothstep(-0.08,0.7,h));
          sky += vec3(1.0,0.83,0.62) * pow(max(0.0,dot(dir,uSun)),48.0) * uGlow;
          gl_FragColor=vec4(sky,1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    })
    const sky = new THREE.Mesh(new THREE.SphereGeometry(1800, 24, 16), this.skyMaterial)
    sky.frustumCulled = false
    sky.onBeforeRender = () => { sky.position.copy(this.camera.position); sky.updateMatrixWorld() }
    this.scene.add(sky)
    options.canvas.addEventListener('webglcontextlost', this.onContextLost)
    this.resizeObserver = new ResizeObserver(this.resize)
    this.resizeObserver.observe(options.canvas.parentElement!)
    this.resize()
    this.showcase.select(projectSelection.get(), true)
    this.unsubscribeSelection = projectSelection.subscribe(() => this.showcase.select(projectSelection.get()))
    this.unsubscribePreparation = projectSelection.prepareWith(index => this.showcase.prepare(index))
    const advance = () => {
      this.deferred = 0
      if (this.disposed || !this.active) return
      try {
        const stage = this.stages.next()
        this.lastProgress = -1
        if (stage.done) { this.resumeBuild = null; this.createSnow(mobile); this.resize(); void this.showcase.warmUp(this.scene, this.camera); return }
        schedule()
      } catch (error) {
        // Visitors get the reading route; development keeps the actual cause.
        if (import.meta.env.DEV) console.error('[MountainScene] environment stage failed', error)
        this.options.onLost()
      }
    }
    const schedule = () => {
      if (this.deferred || !this.active || this.disposed) return
      this.idle = typeof window.requestIdleCallback === 'function'
      this.deferred = this.idle ? window.requestIdleCallback(advance, { timeout: 300 }) : window.setTimeout(advance, 32)
    }
    this.resumeBuild = schedule
    schedule()
  }

  /** Route suspension preserves GPU objects but does no per-frame scene work. */
  setActive(active: boolean) {
    if (this.disposed || this.active === active) return
    this.active = active
    if (!active) {
      if (this.idle) window.cancelIdleCallback(this.deferred)
      else window.clearTimeout(this.deferred)
      this.deferred = 0
      return
    }
    // resize() skips the placement solver and drawing-buffer reset when unchanged.
    this.resize()
    this.lastProgress = -1
    this.resumeBuild?.()
  }

  private createSnow(mobile: boolean) {
    const counts = [config.snow.nearCount, config.snow.middleCount, config.snow.farCount]
    const boxes = [24, 80, 190], sizes = [0.14, 0.23, 0.35]
    counts.forEach((count, layer) => {
      const positions = new Float32Array(Math.round(count * (mobile ? 0.6 : 1)) * 3)
      for (let i = 0; i < positions.length; i++) positions[i] = seeded(i + layer * 971) * boxes[layer]
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      const material = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false,
        uniforms: { uTime: { value: 0 }, uWind: { value: 1 }, uDrift: { value: 0 }, uFall: { value: 0 }, uStorm: { value: 0 }, uDensity: { value: .4 }, uLimit: { value: [14, 8, 5][layer] }, uCamera: { value: this.camera.position }, uBox: { value: boxes[layer] }, uSize: { value: sizes[layer] }, uHeight: { value: 900 }, uOpacity: { value: 0.5 } },
        vertexShader: `uniform float uTime, uWind, uDrift, uFall, uBox, uSize, uHeight, uDensity, uLimit, uStorm; uniform vec3 uCamera; varying float vAlpha;
          void main(){
            vec3 wind = vec3(uDrift * ${alpineWind.x.toFixed(2)} + sin(uTime * 0.45 + position.y) * uWind, -uFall, uDrift * ${alpineWind.z.toFixed(2)} + cos(uTime * 0.3 + position.x) * uWind * 0.4);
            vec3 p = mod(position + wind - uCamera + uBox * 0.5, uBox) - uBox * 0.5 + uCamera;
            vec4 mv = modelViewMatrix * vec4(p,1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = clamp(uSize * (0.65 + fract(position.x * 1.7) * 0.7) * uHeight * (1.0 + uStorm * ${[1.25, .85, .45][layer]}) / max(0.5,-mv.z), 1.0 + uStorm, uLimit + uStorm * ${[9, 5, 2][layer]}.0);
            float density = 1.0-smoothstep(uDensity-.06,uDensity+.06,fract(position.x*2.17+position.z*.19));
            vAlpha = density * smoothstep(1.0,3.0,-mv.z) * (1.0-smoothstep(uBox*0.35,uBox*0.66,length(p-uCamera)));
          }`,
        fragmentShader: `uniform float uOpacity, uStorm; varying float vAlpha;
          void main(){ vec2 q=mat2(.6,-.8,.8,.6)*(gl_PointCoord-.5);
            q.x *= 1.0+uStorm*2.2;
            float d=length(q)*2.0; float a=pow(max(0.0,1.0-d),1.4)*vAlpha*uOpacity;
            if(a<0.01)discard; gl_FragColor=vec4(0.86,0.91,1.0,a);
          }`,
      })
      const points = new THREE.Points(geometry, material)
      points.frustumCulled = false
      this.snow.push({ points, speed: 1 + layer * 0.3, drift: 0, fall: 0 })
      this.scene.add(points)
    })
  }

  private onContextLost = (event: Event) => { event.preventDefault(); this.options.onLost() }

  private resize = () => {
    if (this.disposed || !this.active) return
    const rect = this.options.canvas.parentElement!.getBoundingClientRect()
    const width = Math.max(1, rect.width), height = Math.max(1, rect.height)
    const hasExhibit = this.showcase.structures.items.length > 0
    const pixelRatio = Math.min(window.devicePixelRatio, width / height < .95 ? 1.25 : 1.6)
    // Route reveal and ResizeObserver can report the same size. Repeating
    // setSize clears the drawing buffer and unnecessarily solves placement again.
    if (width === this.width && height === this.height && hasExhibit === this.layoutHasExhibit && pixelRatio === this.renderer.getPixelRatio()) return
    this.layoutHasExhibit = hasExhibit
    this.width = width
    this.height = height
    this.camera.aspect = width / height
    this.camera.fov = cameraFieldOfView(Math.max(0, this.poseRoute), this.camera.aspect, width)
    this.camera.updateProjectionMatrix()
    this.spatialTransition.resize(this.camera, width, height)
    this.showcase.layout(this.camera, width, height)
    this.renderer.setPixelRatio(pixelRatio)
    this.renderer.setSize(width, height, false)
    this.snow.forEach(layer => { layer.points.material.uniforms.uHeight.value = height * this.renderer.getPixelRatio() })
    this.lastProgress = -1
    this.poseRoute = -1
  }

  update = (frame: ExpeditionFrame) => {
    if (this.disposed || !this.active) return
    if (frame.delta === 0) this.showcase.select(projectSelection.get(), true)
    if (frame.journeyProgress !== this.poseRoute) {
      this.poseRoute = frame.journeyProgress
      cameraPose(frame.journeyProgress, this.position, this.target, frame.curveParameter)
      this.camera.position.copy(this.position)
      this.camera.lookAt(this.target)
      this.camera.updateMatrixWorld()
      this.camera.fov = cameraFieldOfView(frame.journeyProgress, this.camera.aspect, this.width, this.position)
      this.camera.updateProjectionMatrix()
    }
    // Spatial UI follows every controller frame (docking settles while standing);
    // it returns immediately when nothing changed.
    this.spatialTransition.update(this.camera, frame)
    // A project change crossfades the capture; the exhibit stays fixed in world space.
    const exhibit = this.showcase.update(frame, this.camera) || this.showcase.drawWarmUp(this.camera)
    this.options.onProjectsReady(this.showcase.ready)
    const moving = frame.journeyProgress !== this.lastProgress || frame.reducedMotion !== this.lastReducedMotion || exhibit
    if (frame.reducedMotion && !moving) return
    if (!moving && frame.time - this.lastRender < 1 / 30) return
    const elapsed = Math.min(.1, Math.max(0, frame.time - this.lastRender))
    this.lastRender = frame.time
    this.lastProgress = frame.journeyProgress
    this.lastReducedMotion = frame.reducedMotion
    this.wind.value = frame.reducedMotion ? 0 : frame.time
    const mood = worldMood(frame.journeyProgress)
    this.sky.copy(this.low).lerp(this.iceSky, mood.ice).lerp(this.basinSky, mood.basin).lerp(this.faceSky, mood.face).lerp(this.snowFog, mood.storm * .85).lerp(this.high, mood.summit)
    this.fog.color.copy(this.sky).lerp(this.snowFog, mood.storm * .5)
    this.fog.density = mood.fog
    this.skyMaterial.uniforms.uSky.value.copy(this.sky)
    this.skyMaterial.uniforms.uHorizon.value.copy(this.sky).lerp(this.horizon, mood.summit * .6)
    this.skyMaterial.uniforms.uGlow.value = (mood.basin * .08 + mood.face * .1 + mood.summit * .24) * (1 - mood.arrival * .5)
    this.keyLight.intensity = mood.key
    this.keyLight.color.copy(this.coldLight).lerp(this.warmLight, mood.summit * .8 + mood.basin * .17)
    this.keyLight.position.set(-180 + mood.face * 85, 240 - mood.face * 95, -90)
    this.ambient.intensity = mood.ambient
    this.fill.intensity = .3 + mood.basin * .12 - mood.storm * .12 + mood.summit * .12
    this.snow.forEach((layer, index) => {
      layer.points.visible = !frame.reducedMotion
      // Integrate velocity: changing weather must not teleport the particle field.
      layer.drift += elapsed * mood.windSpeed * layer.speed * (1 + mood.storm * snowStormDrift[index])
      layer.fall += elapsed * (1.05 + mood.storm * 1.1) * layer.speed
      const uniforms = layer.points.material.uniforms
      uniforms.uTime.value = frame.time * layer.speed
      uniforms.uDrift.value = layer.drift; uniforms.uFall.value = layer.fall
      uniforms.uWind.value = .25 + mood.storm * 1.2
      uniforms.uStorm.value = mood.storm
      uniforms.uDensity.value = mood.snowDensity
      uniforms.uOpacity.value = .55 + mood.storm * .4 - mood.summit * .2
    })
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.disposed = true
    this.spatialTransition.dispose()
    this.unsubscribeSelection()
    this.unsubscribePreparation()
    this.showcase.dispose()
    if (this.idle) window.cancelIdleCallback(this.deferred)
    else window.clearTimeout(this.deferred)
    this.stages.return()
    this.resizeObserver.disconnect()
    this.options.canvas.removeEventListener('webglcontextlost', this.onContextLost)
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>()
    this.scene.traverse(object => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Line) {
        geometries.add(object.geometry)
        const material = object.material
        if (Array.isArray(material)) material.forEach(item => materials.add(item))
        else materials.add(material)
      }
    })
    geometries.forEach(geometry => geometry.dispose())
    materials.forEach(material => material.dispose())
    this.renderer.dispose()
    this.renderer.forceContextLoss()
    this.scene.clear()
  }
}
