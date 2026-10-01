import { Matrix4, PerspectiveCamera, Vector3 } from 'three'
import { cameraPose } from './terrain'
import { smoothstep } from './progress'

// The scene keeps looking uphill. Ahead of an anchor this is an ordinary
// perspective approach; beyond it, a rearward departure projection briefly
// shows the composition left at camp, using the walker's actual lateral motion
// and orientation, with longitudinal travel reflected into recession. The world
// anchor never follows the camera. A normal forward projection would cull a
// passed anchor behind the camera (or enlarge a plane in front of it).
const anchorDepth = 18

/** Distances over which a composition dissolves into the weather. */
export type AnchorFog = { start: number; end: number }
// Home's full-bleed statement recedes visibly before dissolving.
export const homeFog: AnchorFog = { start: 28, end: 62 }
// Camp panels carry solid artwork that the DOM cannot hide behind terrain:
// they dissolve sooner, while their silhouette is still small.
export const campFog: AnchorFog = { start: 14, end: 58 }

export class SpatialAnchorProjection {
  readonly matrix = new Matrix4()
  readonly origin = new Vector3()
  distance = 0
  opacity = 1
  backdrop = 1
  blur = 0
  private plane = new Matrix4()
  private viewport = new Matrix4()
  private view = new Matrix4()
  private forward = new Vector3()
  private displacement = new Vector3()
  private eye = new Vector3()
  private anchorCamera = new PerspectiveCamera()
  private target = new Vector3()

  constructor(private anchorRoute = 0, private fog: AnchorFog = homeFog) {}

  resize(camera: PerspectiveCamera, width: number, height: number) {
    cameraPose(this.anchorRoute, this.origin, this.target)
    this.anchorCamera.position.copy(this.origin)
    this.anchorCamera.lookAt(this.target)
    this.anchorCamera.updateMatrixWorld()
    this.anchorCamera.getWorldDirection(this.forward)
    const unitsPerPixel = 2 * anchorDepth * Math.tan(camera.fov * Math.PI / 360) / height
    this.plane.copy(this.anchorCamera.matrixWorld)
      .multiply(new Matrix4().makeTranslation(0, 0, -anchorDepth))
      .multiply(new Matrix4().makeScale(unitsPerPixel, -unitsPerPixel, 1))
      .multiply(new Matrix4().makeTranslation(-width / 2, -height / 2, 0))
    // Homogeneous clip coordinates -> CSS pixels. Keep w for real perspective,
    // flatten z so the DOM plane does not intersect unrelated UI stacking layers.
    this.viewport.set(width / 2, 0, 0, width / 2, 0, -height / 2, 0, height / 2, 0, 0, 0, 0, 0, 0, 0, 1)
  }

  update(camera: PerspectiveCamera) {
    this.distance = camera.position.distanceTo(this.origin)
    const recession = this.distance / (anchorDepth + this.distance)
    this.opacity = (1 - .3 * recession) * (1 - smoothstep((this.distance - this.fog.start) / (this.fog.end - this.fog.start)))
    this.backdrop = 1 - smoothstep(this.distance / 22)
    this.blur = 2 * smoothstep((this.distance - 12) / 40)
    if (this.opacity === 0) return
    this.displacement.copy(camera.position).sub(this.origin)
    // Ahead of an anchor: ordinary approach. Beyond it: the rearward departure.
    // No input-direction latch, so reverse travel is deterministic.
    this.eye.copy(camera.position).addScaledVector(this.forward, -2 * Math.max(0, this.displacement.dot(this.forward)))
    this.view.copy(camera.matrixWorld).setPosition(this.eye).invert()
    this.matrix.copy(this.viewport).multiply(camera.projectionMatrix)
      .multiply(this.view).multiply(this.plane)
    this.matrix.multiplyScalar(1 / anchorDepth)
    // Embed the plane's 3x3 homography in an invertible CSS 4x4 matrix.
    // A zero z row projects correctly mathematically but browsers cull it.
    const elements = this.matrix.elements
    elements[8] = elements[9] = elements[11] = 0
    elements[10] = 1
  }
}
