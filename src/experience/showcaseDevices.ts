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
  const metal = new THREE.MeshStandardMaterial({ color: '#a5b1b9', roughness: .24, metalness: .82, envMap: environment, envMapIntensity: 1.1 })
  const graphite = new THREE.MeshStandardMaterial({ color: '#28343d', roughness: .34, metalness: .72, envMap: environment, envMapIntensity: .75 })
  const gasket = new THREE.MeshStandardMaterial({ color: '#090d11', roughness: .65, metalness: .15 })
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
        // A modest mip bias preserves fine UI strokes without nearest-neighbour shimmer.
        return texture2D(image, uv, -.35);
      }
      void main() {
        gl_FragColor = mix(capture(fromMap, fromFit), capture(toMap, toFit), mixAmount);
        gl_FragColor.a *= presence;
        #include <colorspace_fragment>
      }`,
  })
  const part = (name: string, w: number, h: number, d: number, x: number, y: number, z: number, material = metal, radius = .006) => {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, Math.min(radius, d / 2)), material)
    mesh.name = name
    mesh.position.set(x, y, z); group.add(mesh)
    return mesh
  }
  const bottom = .225, center = bottom + SCREEN_HEIGHT / 2
  const panel = new THREE.Group()
  panel.position.y = center
  group.add(panel)
  // A machined silver perimeter around a recessed, dark optical edge.
  // The panel alone tilts; the weighted foot and tapered neck stay grounded.
  panel.add(part('display-shell', 1.024, SCREEN_HEIGHT + .024, .028, 0, 0, -.003))
  panel.add(part('display-rear', 1.002, SCREEN_HEIGHT + .002, .036, 0, 0, -.027, graphite, .009))
  panel.add(part('display-bezel', 1.012, SCREEN_HEIGHT + .012, .008, 0, 0, .014, gasket, .003))

  // The hinge belongs to the tilted housing. The neck terminates at this actual
  // attachment point, rather than at a separately guessed height/depth.
  const mount = new THREE.Vector3(0, -.19, -.055)
  const hinge = part('display-hinge', .13, .07, .045, ...mount.toArray(), graphite, .012)
  panel.add(hinge)
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 1, 12, 24), metal)
  neck.name = 'display-neck'
  group.add(neck)
  neck.geometry.scale(.084, 1, .04)
  const neckSource = neck.geometry.getAttribute('position').clone()
  const neckPoints = neck.geometry.getAttribute('position')
  const root = new THREE.Vector3(0, .016, -.052)
  const tip = new THREE.Vector3(), elbow = new THREE.Vector3(), spine = new THREE.Vector3()
  const fitStand = () => {
    tip.copy(mount).applyQuaternion(panel.quaternion).add(panel.position)
    elbow.set(0, -SCREEN_HEIGHT / 2 - .035, -.085).applyQuaternion(panel.quaternion).add(panel.position)
    for (let i = 0; i < neckPoints.count; i++) {
      const t = neckSource.getY(i) + .5
      if (t < .65) spine.lerpVectors(root, elbow, t / .65)
      else spine.lerpVectors(elbow, tip, (t - .65) / .35)
      neckPoints.setXYZ(i, neckSource.getX(i) * (1 - .3 * t), spine.y, spine.z + neckSource.getZ(i))
    }
    neckPoints.needsUpdate = true
    neck.geometry.computeVertexNormals()
    neck.geometry.computeBoundingBox()
    neck.geometry.computeBoundingSphere()
  }
  fitStand()
  const base = part('display-foot', .32, .02, .20, 0, .01, -.04, metal, .008)
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1, SCREEN_HEIGHT), screenMaterial)
  screen.name = 'showcase-screen'
  // Positive separation from the chassis avoids coplanar depth noise at a distance.
  screen.position.set(0, 0, .021)
  screen.renderOrder = 20
  panel.add(screen)
  const footing = base.geometry.clone().translate(...base.position.toArray())
  return { group, panel, screen, footing, fitStand, shadow: { width: .47, depth: .32, x: 0, z: -.045 }, materials: [metal, graphite, gasket, screenMaterial] as THREE.Material[] }
}
