import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

// Originals share this format; contain UVs preserve small native aspect differences.
export const SCREEN_HEIGHT = 9 / 16
export const captureFit = (width: number, height: number) => {
  const ratio = width / height / (1 / SCREEN_HEIGHT)
  return new THREE.Vector2(Math.min(1, ratio), Math.min(1, 1 / ratio))
}

export type ShowcaseDevice = ReturnType<typeof buildDisplay>

/** One quiet physical frame, shared by every project. Only its screen samplers change. */
export function buildDisplay(environment: THREE.Texture | null, placeholder: THREE.Texture) {
  const group = new THREE.Group()
  group.name = 'showcase-display'
  const metal = new THREE.MeshStandardMaterial({ color: '#30383e', roughness: .48, metalness: .65, envMap: environment, envMapIntensity: .65 })
  const screenMaterial = new THREE.ShaderMaterial({
    // Draw after weather with world depth testing: foreground snow cannot cover the work.
    transparent: true, depthWrite: true, toneMapped: false, fog: false,
    uniforms: {
      fromMap: { value: placeholder }, toMap: { value: placeholder },
      fromFit: { value: new THREE.Vector2(1, 1) }, toFit: { value: new THREE.Vector2(1, 1) },
      mixAmount: { value: 1 }, presence: { value: 1 },
    },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform sampler2D fromMap, toMap;
      uniform vec2 fromFit, toFit;
      uniform float mixAmount, presence;
      varying vec2 vUv;
      vec4 capture(sampler2D image, vec2 fit) {
        vec2 uv = (vUv - .5) / fit + .5;
        if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) return vec4(.003, .004, .005, 1.0);
        return texture2D(image, uv);
      }
      void main() {
        gl_FragColor = mix(capture(fromMap, fromFit), capture(toMap, toFit), mixAmount);
        gl_FragColor.a *= presence;
        #include <colorspace_fragment>
      }`,
  })
  const part = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(.004, d / 4)), metal)
    mesh.position.set(x, y, z); group.add(mesh)
    return mesh
  }
  const bottom = .14, center = bottom + SCREEN_HEIGHT / 2
  const panel = new THREE.Group()
  panel.position.y = center
  group.add(panel)
  const bezel = part(1.018, SCREEN_HEIGHT + .018, .018, 0, 0, 0)
  panel.add(bezel)
  part(.036, .22, .024, 0, .12, -.025)
  const base = part(.28, .018, .18, 0, .009, -.025)
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1, SCREEN_HEIGHT), screenMaterial)
  screen.name = 'showcase-screen'
  // Positive separation from the chassis avoids coplanar depth noise at a distance.
  screen.position.set(0, 0, .012)
  screen.renderOrder = 20
  panel.add(screen)
  const footing = base.geometry.clone().translate(...base.position.toArray())
  return { group, panel, screen, footing, shadow: { width: .4, depth: .28, x: 0, z: -.025 }, materials: [metal, screenMaterial] as THREE.Material[] }
}
