import { Matrix4, PerspectiveCamera, Vector3 } from 'three'
import { cameraPose } from './terrain'
import { smoothstep } from './progress'

// The scene keeps looking uphill. This rearward departure projection briefly
// shows the composition left at camp, using its actual lateral motion and
// orientation, with longitudinal travel reflected into recession. The world
// anchor never follows the camera. A normal forward projection would immediately
// cull a camp anchor behind the camera (or enlarge a plane in front of it).
const anchorDepth = 18
const fogStart = 28
const fogEnd = 62 // Camp has disappeared before the About reading zone.

export class SpatialAnchorProjection {
  readonly matrix = new Matrix4()
  readonly origin = new Vector3()
  distance = 0
  opacity = 1
  backdrop = 1
  blur = 0
  private plane = new Matrix4()
  private viewport = new Matrix4()
  private departureView = new Matrix4()
  private forward = new Vector3()
  private displacement = new Vector3()
  private departurePosition = new Vector3()
  private homeCamera = new PerspectiveCamera()
  private target = new Vector3()

  constructor(private anchorRoute = 0) {}

  resize(camera: PerspectiveCamera, width: number, height: number, captureCamera = false) {
    if (captureCamera) {
      this.origin.copy(camera.position)
      this.homeCamera.position.copy(this.origin)
      this.homeCamera.quaternion.copy(camera.quaternion)
    } else {
      cameraPose(this.anchorRoute, this.origin, this.target)
      this.homeCamera.position.copy(this.origin)
      this.homeCamera.lookAt(this.target)
    }
    this.homeCamera.updateMatrixWorld()
    this.homeCamera.getWorldDirection(this.forward)
    const unitsPerPixel = 2 * anchorDepth * Math.tan(camera.fov * Math.PI / 360) / height
    this.plane.copy(this.homeCamera.matrixWorld)
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
    this.opacity = (1 - .3 * recession) * (1 - smoothstep((this.distance - fogStart) / (fogEnd - fogStart)))
    this.backdrop = 1 - smoothstep(this.distance / 22)
    this.blur = 2 * smoothstep((this.distance - 12) / 40)
    if (this.opacity === 0) return
    this.displacement.copy(camera.position).sub(this.origin)
    // Ahead of an anchor: ordinary approach. Beyond it: the same rearward
    // departure used at Home. No input-direction latch; reverse is deterministic.
    this.departurePosition.copy(camera.position).addScaledVector(this.forward, -2 * Math.max(0, this.displacement.dot(this.forward)))
    this.departureView.copy(camera.matrixWorld).setPosition(this.departurePosition).invert()
    this.matrix.copy(this.viewport).multiply(camera.projectionMatrix)
      .multiply(this.departureView).multiply(this.plane)
    this.matrix.multiplyScalar(1 / anchorDepth)
    // Embed the plane's 3x3 homography in an invertible CSS 4x4 matrix.
    // A zero z row projects correctly mathematically but browsers cull it.
    const elements = this.matrix.elements
    elements[8] = elements[9] = elements[11] = 0
    elements[10] = 1
  }
}
