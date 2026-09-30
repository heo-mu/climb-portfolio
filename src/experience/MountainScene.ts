import * as THREE from 'three'
import { cameraPose, seeded } from './terrain'
import { createEnvironment } from './environment'
import type { ExpeditionFrame } from './progress'
import { smoothstep } from './progress'
import { experienceConfig as config } from '../config/experience'

type SceneOptions = { canvas: HTMLCanvasElement; onLost: () => void }
type SnowLayer = { points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>; speed: number }

export class MountainScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(config.camera.desktopFov, 1, config.camera.near, config.camera.far)
  private fog = new THREE.FogExp2('#293e53', config.atmosphere.fogBase)
  private keyLight = new THREE.DirectionalLight('#d5e1ee', config.lighting.keyBase)
  private ambient = new THREE.HemisphereLight('#9bb7d1', '#202a39', config.lighting.ambientBase)
  private snow: SnowLayer[] = []
  private position = new THREE.Vector3()
  private target = new THREE.Vector3()
  private sky = new THREE.Color()
  private low = new THREE.Color('#182b40')
  private middle = new THREE.Color('#718caa')
  private high = new THREE.Color('#b8ac9e')
  private snowFog = new THREE.Color('#a6b6c7')
  private horizon = new THREE.Color('#e4c4a1')
  private coldLight = new THREE.Color('#d5e1ee')
  private warmLight = new THREE.Color('#ffe2bd')
  private skyMaterial: THREE.ShaderMaterial
  private lastRender = 0
  private lastProgress = -1
  private resizeObserver: ResizeObserver
  private disposed = false

  constructor(private options: SceneOptions) {
    const mobile = window.innerWidth < 768
    this.renderer = new THREE.WebGLRenderer({ canvas: options.canvas, antialias: !mobile, alpha: false, powerPreference: 'high-performance' })
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0
    this.scene.fog = this.fog
    this.keyLight.position.set(-160, 350, -170)
    this.scene.add(this.keyLight, this.ambient, createEnvironment())
    this.skyMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: { uSky: { value: new THREE.Color('#182b40') }, uHorizon: { value: new THREE.Color('#52687e') } },
      vertexShader: 'varying vec3 vDirection; void main(){ vDirection=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'varying vec3 vDirection; uniform vec3 uSky; uniform vec3 uHorizon; void main(){ float h=normalize(vDirection).y; gl_FragColor=vec4(mix(uHorizon,uSky,smoothstep(-0.08,0.7,h)),1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',
    })
    const sky = new THREE.Mesh(new THREE.SphereGeometry(1800, 24, 16), this.skyMaterial)
    sky.frustumCulled = false
    sky.onBeforeRender = () => { sky.position.copy(this.camera.position); sky.updateMatrixWorld() }
    this.scene.add(sky)
    this.createSnow(mobile)
    options.canvas.addEventListener('webglcontextlost', this.onContextLost)
    this.resizeObserver = new ResizeObserver(this.resize)
    this.resizeObserver.observe(options.canvas.parentElement!)
    this.resize()
  }

  private createSnow(mobile: boolean) {
    const counts = [config.snow.nearCount, config.snow.middleCount, config.snow.farCount]
    const boxes = [28, 100, 240], sizes = [0.14, 0.23, 0.35]
    counts.forEach((count, layer) => {
      const positions = new Float32Array(Math.round(count * (mobile ? 0.6 : 1)) * 3)
      for (let i = 0; i < positions.length; i++) positions[i] = seeded(i + layer * 971) * boxes[layer]
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      const material = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false,
        uniforms: { uTime: { value: 0 }, uCamera: { value: this.camera.position }, uBox: { value: boxes[layer] }, uSize: { value: sizes[layer] }, uHeight: { value: 900 }, uOpacity: { value: 0.5 } },
        vertexShader: `uniform float uTime, uBox, uSize, uHeight; uniform vec3 uCamera; varying float vAlpha;
          void main(){
            vec3 wind = vec3(uTime * 0.7, -uTime * 1.1, uTime * 0.2);
            vec3 p = mod(position + wind - uCamera + uBox * 0.5, uBox) - uBox * 0.5 + uCamera;
            vec4 mv = modelViewMatrix * vec4(p,1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = clamp(uSize * uHeight / max(0.5,-mv.z), 1.0, 19.0);
            vAlpha = smoothstep(0.3,2.0,-mv.z) * (1.0-smoothstep(uBox*0.35,uBox*0.66,length(p-uCamera)));
          }`,
        fragmentShader: `uniform float uOpacity; varying float vAlpha;
          void main(){ float d=length(gl_PointCoord-0.5)*2.0; float a=pow(max(0.0,1.0-d),1.6)*vAlpha*uOpacity; if(a<0.01)discard; gl_FragColor=vec4(0.86,0.91,1.0,a); }`,
      })
      const points = new THREE.Points(geometry, material)
      points.frustumCulled = false
      this.snow.push({ points, speed: 1 + layer * 0.3 })
      this.scene.add(points)
    })
  }

  private onContextLost = (event: Event) => { event.preventDefault(); this.options.onLost() }

  private resize = () => {
    if (this.disposed) return
    const rect = this.options.canvas.parentElement!.getBoundingClientRect()
    const width = Math.max(1, rect.width), height = Math.max(1, rect.height)
    const mobile = width / height < 0.95
    this.camera.aspect = width / height
    this.camera.fov = mobile ? config.camera.mobileFov : config.camera.desktopFov
    this.camera.updateProjectionMatrix()
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.25 : 1.6))
    this.renderer.setSize(width, height, false)
    this.snow.forEach(layer => { layer.points.material.uniforms.uHeight.value = height * this.renderer.getPixelRatio() })
    this.lastProgress = -1
  }

  update = (frame: ExpeditionFrame) => {
    if (this.disposed) return
    const moving = Math.abs(frame.progress - this.lastProgress) > 0.000001
    if (frame.reducedMotion && !moving) return
    if (!moving && frame.time - this.lastRender < 1 / 30) return
    this.lastRender = frame.time
    this.lastProgress = frame.progress
    cameraPose(frame.route, this.position, this.target)
    this.camera.position.copy(this.position)
    this.camera.lookAt(this.target)
    const whiteout = Math.exp(-Math.pow((frame.route - 0.895) / 0.044, 2))
    const summit = smoothstep((frame.route - 0.95) / 0.045)
    const daylight = Math.sin(frame.route * Math.PI) * 0.78
    this.sky.copy(this.low).lerp(this.middle, daylight).lerp(this.high, summit)
    this.fog.color.copy(this.sky).lerp(this.snowFog, whiteout * 0.4)
    this.fog.density = config.atmosphere.fogBase + daylight * config.atmosphere.fogRouteVariation + whiteout * config.atmosphere.whiteoutPeak - summit * config.atmosphere.summitRelief
    this.skyMaterial.uniforms.uSky.value.copy(this.sky)
    this.skyMaterial.uniforms.uHorizon.value.copy(this.sky).lerp(this.horizon, summit * 0.7)
    this.keyLight.intensity = config.lighting.keyBase + summit * config.lighting.keySummit
    this.keyLight.color.copy(this.coldLight).lerp(this.warmLight, summit)
    this.ambient.intensity = config.lighting.ambientBase + daylight * config.lighting.ambientRoute
    this.snow.forEach(layer => {
      layer.points.visible = !frame.reducedMotion
      layer.points.material.uniforms.uTime.value = frame.time * layer.speed
      layer.points.material.uniforms.uOpacity.value = 0.7 + whiteout * 0.15 - summit * 0.35
    })
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.disposed = true
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
