import * as THREE from 'three'
import { CAMP_ANGLES, CAMP_HEIGHTS, createCameraRails, mountainGeometry, radiusAt, surfacePoint } from './terrain'
import type { ExpeditionFrame } from './progress'
import { smoothstep } from './progress'
import { experienceConfig } from '../config/experience'

type SceneOptions = { canvas: HTMLCanvasElement; onLost: () => void; onBeacon: (x: number, y: number, visible: boolean) => void }

export class MountainScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(48, 1, 1, 8000)
  private fog = new THREE.FogExp2('#59656a', 0.0007)
  private keyLight = new THREE.DirectionalLight('#f0f2e5', 3)
  private ambient = new THREE.HemisphereLight('#dce9ed', '#25262a', 2.0)
  private rails = createCameraRails(false)
  private mobile = false
  private reduced = false
  private beacons: THREE.Group[] = []
  private beaconLights: THREE.Mesh[] = []
  private particles: THREE.Points
  private position = new THREE.Vector3()
  private target = new THREE.Vector3()
  private projection = new THREE.Vector3()
  private skyLow = new THREE.Color('#434f55')
  private skyHigh = new THREE.Color('#a0b2b7')
  private sky = new THREE.Color()
  private width = 1
  private height = 1
  private lastRender = 0
  private lastProgress = -1
  private resizeObserver: ResizeObserver
  private disposed = false

  constructor(private options: SceneOptions) {
    const { canvas } = options
    this.mobile = window.innerWidth < 768
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !this.mobile, alpha: false, powerPreference: 'low-power' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.mobile ? 1.25 : 1.6))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    this.scene.fog = this.fog
    this.keyLight.position.set(-650, 1300, 550)
    this.scene.add(this.keyLight, this.ambient)
    const mountain = new THREE.Mesh(mountainGeometry(this.mobile ? 52 : 84), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.98, metalness: 0, flatShading: true }))
    this.scene.add(mountain)

    // Distant ranges share a material; no imported meshes, textures, or images.
    const distantMaterial = new THREE.MeshStandardMaterial({ color: '#788b91', roughness: 1, flatShading: true })
    const distantGeometry = mountainGeometry(30, 650, 1.1, 2)
    for (let i = 0; i < 9; i++) {
      const distant = new THREE.Mesh(distantGeometry, distantMaterial)
      distant.position.set(-2700 + i * 660, -150 + Math.sin(i * 7) * 120, -1100 - Math.cos(i * 3) * 450)
      distant.scale.setScalar(0.9 + ((i * 13) % 7) * 0.17)
      distant.rotation.y = i * 1.7
      this.scene.add(distant)
    }
    const floor = new THREE.Mesh(new THREE.CircleGeometry(6500, 48), new THREE.MeshStandardMaterial({ color: '#737f81', roughness: 1 }))
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -25
    this.scene.add(floor)
    this.createBeacons()

    const particleCount = this.mobile ? 95 : 260
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.sin(i * 127.1) * 0.5) * 640
      positions[i * 3 + 1] = (Math.sin(i * 311.7) * 0.5) * 500
      positions[i * 3 + 2] = -30 - ((i * 97.3) % 500)
    }
    const particleGeometry = new THREE.BufferGeometry()
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: '#e8f0ef', size: 0.65, transparent: true, opacity: 0.25, depthWrite: false, sizeAttenuation: true }))
    this.camera.add(this.particles)
    this.scene.add(this.camera)
    canvas.addEventListener('webglcontextlost', this.onContextLost)
    this.resizeObserver = new ResizeObserver(this.resize)
    this.resizeObserver.observe(canvas.parentElement!)
    this.resize()
  }

  private createBeacons() {
    const poleGeometry = new THREE.CylinderGeometry(0.5, 0.65, 20, 6)
    const poleMaterial = new THREE.MeshStandardMaterial({ color: '#697473', metalness: 0.6, roughness: 0.6 })
    const markerGeometry = new THREE.BoxGeometry(4.8, 2.8, 0.9)
    const markerMaterial = new THREE.MeshBasicMaterial({ color: '#dfff45' })
    const shelfGeometry = new THREE.CylinderGeometry(17, 12, 5, 7)
    const shelfMaterial = new THREE.MeshStandardMaterial({ color: '#aebbbb', flatShading: true, roughness: 1 })
    CAMP_HEIGHTS.forEach((height, index) => {
      const camp = new THREE.Group()
      camp.position.copy(surfacePoint(height, CAMP_ANGLES[index], 8))
      const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial)
      shelf.position.y = -2
      const pole = new THREE.Mesh(poleGeometry, poleMaterial)
      pole.position.y = 10
      const marker = new THREE.Mesh(markerGeometry, markerMaterial)
      marker.position.y = 18
      marker.rotation.y = CAMP_ANGLES[index]
      camp.add(shelf, pole, marker)
      this.beaconLights.push(marker)
      this.beacons.push(camp)
      this.scene.add(camp)
    })
  }

  private onContextLost = (event: Event) => { event.preventDefault(); this.options.onLost() }

  private resize = () => {
    if (this.disposed) return
    const rect = this.options.canvas.parentElement!.getBoundingClientRect()
    this.width = Math.max(1, rect.width)
    this.height = Math.max(1, rect.height)
    this.mobile = this.width < 768 || this.width / this.height < 0.95
    this.rails = createCameraRails(this.mobile, this.reduced)
    this.camera.aspect = this.width / this.height
    this.camera.fov = this.mobile ? experienceConfig.camera.mobileFov : experienceConfig.camera.desktopFov
    this.camera.updateProjectionMatrix()
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.mobile ? 1.25 : 1.6))
    this.renderer.setSize(this.width, this.height, false)
    this.lastProgress = -1
  }

  update = (frame: ExpeditionFrame) => {
    if (this.disposed) return
    if (this.reduced !== frame.reducedMotion) {
      this.reduced = frame.reducedMotion
      this.rails = createCameraRails(this.mobile, this.reduced)
      this.lastProgress = -1
    }
    const moving = Math.abs(frame.progress - this.lastProgress) > 0.000001
    if (this.reduced && !moving) return
    if (!moving && frame.time - this.lastRender < 1 / 30) return
    this.lastRender = frame.time
    this.lastProgress = frame.progress
    this.rails.position.getPoint(frame.route, this.position)
    // Keep a safety margin from the analytic terrain envelope at every point on the spline.
    const angle = Math.atan2(this.position.x, this.position.z)
    const radius = Math.hypot(this.position.x, this.position.z)
    const safeRadius = radiusAt(this.position.y, angle) + experienceConfig.camera.nearTerrainClearance
    if (radius < safeRadius) { this.position.x *= safeRadius / radius; this.position.z *= safeRadius / radius }
    this.camera.position.copy(this.position)
    this.rails.target.getPoint(frame.route, this.target)
    this.camera.lookAt(this.target)
    const whiteout = Math.exp(-Math.pow((frame.progress - 0.88) / 0.042, 2))
    const summit = smoothstep((frame.progress - 0.92) / 0.075)
    this.sky.copy(this.skyLow).lerp(this.skyHigh, frame.route * 0.65 + summit * 0.35)
    this.fog.color.copy(this.sky)
    this.fog.density = experienceConfig.atmosphere.fogBase + Math.sin(frame.route * Math.PI) * experienceConfig.atmosphere.fogRouteVariation + whiteout * experienceConfig.atmosphere.whiteoutPeak - summit * experienceConfig.atmosphere.summitRelief
    this.renderer.setClearColor(this.sky)
    this.keyLight.intensity = experienceConfig.lighting.keyBase + summit * experienceConfig.lighting.keySummit
    this.ambient.intensity = experienceConfig.lighting.ambientBase + frame.route * experienceConfig.lighting.ambientRoute
    this.particles.visible = !this.reduced
    if (!this.reduced) {
      this.particles.position.y = -(frame.time * 2.2 % 60)
      this.particles.rotation.z = Math.sin(frame.time * 0.035) * 0.06
      ;(this.particles.material as THREE.PointsMaterial).opacity = 0.12 + frame.route * 0.22 + whiteout * 0.22
    }
    this.beaconLights.forEach((marker, index) => marker.scale.setScalar(index === frame.active && !this.reduced ? 1 + Math.sin(frame.time * 2) * 0.045 : 1))
    this.renderer.render(this.scene, this.camera)
    this.projection.copy(this.beacons[frame.active].position)
    this.projection.y += 22
    this.projection.project(this.camera)
    this.options.onBeacon((this.projection.x * 0.5 + 0.5) * this.width, (-this.projection.y * 0.5 + 0.5) * this.height, this.projection.z < 1 && Math.abs(this.projection.x) < 0.88 && Math.abs(this.projection.y) < 0.8)
  }

  dispose() {
    this.disposed = true
    this.resizeObserver.disconnect()
    this.options.canvas.removeEventListener('webglcontextlost', this.onContextLost)
    const geometries = new Set<THREE.BufferGeometry>()
    const materials = new Set<THREE.Material>()
    this.scene.traverse(object => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
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
