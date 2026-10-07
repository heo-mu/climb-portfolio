import { experienceConfig } from '../config/experience'

// Shared controls for the camera rail and its navigation diagram (world metres).
export const ascentRouteControls = [
  [0, 0], [3, .2], [12, 1], [25, 4], [35, 12], [24, 23], [0, 37],
  [-12, 39], [-15, 40], [0, 47], [28, 65], [47, 81], [38, 99], [15, 117],
  [5, 118], [5, 119], [18, 127], [44, 145], [72, 168], [84, 193], [78, 207],
  [63, 208], [45, 209], [36, 222], [46, 245], [69, 273], [83, 297], [83, 304], [78, 305],
] as const

/** Longitudinal spacing of the controls; the rail's depth is linear in route. */
export const ROUTE_CONTROL_SPACING = 40

// Uniform Catmull–Rom, tension .5: the same interpolation as routeCurve.
// Kept numeric so the navigation does not eagerly load the WebGL scene.
function catmullRom(route: number, axis: 0 | 1) {
  const p = Math.max(0, Math.min(1, route)) * (ascentRouteControls.length - 1)
  const i = Math.min(Math.floor(p), ascentRouteControls.length - 2), t = p - i
  const b = ascentRouteControls[i][axis], c = ascentRouteControls[i + 1][axis]
  const a = i ? ascentRouteControls[i - 1][axis] : 2 * b - c
  const d = i + 2 < ascentRouteControls.length ? ascentRouteControls[i + 2][axis] : 2 * c - b
  const m = (c - a) / 2, n = (d - b) / 2
  return b + m * t + (-3 * b + 3 * c - 2 * m - n) * t * t + (2 * b - 2 * c + m + n) * t * t * t
}

export const routeLateralAt = (route: number) => catmullRom(route, 0)

/** Eye on the rail at a legacy curve parameter, without loading three.js. */
export function routeEyeAt(route: number): [number, number, number] {
  const eye = { x: 0, y: 0, z: 0 }
  writeRouteEye(route, eye)
  return [eye.x, eye.y, eye.z]
}

export function writeRouteEye(curveParameter: number, out: { x: number; y: number; z: number }) {
  const r = Math.max(0, Math.min(1, curveParameter))
  out.x = catmullRom(r, 0)
  out.y = catmullRom(r, 1) + experienceConfig.camera.eyeHeight
  out.z = -r * (ascentRouteControls.length - 1) * ROUTE_CONTROL_SPACING
}

// World dressing retains its original spline parameter. Only the walking rail
// uses normalized cumulative distance; never rebuild this table during scroll.
const ARC_SAMPLES = 8192
const arcLengths = new Float64Array(ARC_SAMPLES + 1)
for (let i = 1; i <= ARC_SAMPLES; i++) {
  const a = routeEyeAt((i - 1) / ARC_SAMPLES), b = routeEyeAt(i / ARC_SAMPLES)
  arcLengths[i] = arcLengths[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
}
export const journeyLength = arcLengths[ARC_SAMPLES]

/** Canonical journey distance -> legacy world spline parameter. */
export function curveParameterAt(journeyProgress: number) {
  const distance = Math.max(0, Math.min(1, journeyProgress)) * journeyLength
  let low = 0, high = ARC_SAMPLES
  while (high - low > 1) {
    const middle = (low + high) >>> 1
    if (arcLengths[middle] < distance) low = middle; else high = middle
  }
  return (low + (distance - arcLengths[low]) / (arcLengths[high] - arcLengths[low])) / ARC_SAMPLES
}

/** Legacy world landmark -> canonical journey distance (initialization only). */
export function journeyAtCurveParameter(curveParameter: number) {
  const sample = Math.max(0, Math.min(1, curveParameter)) * ARC_SAMPLES
  const i = Math.min(ARC_SAMPLES - 1, Math.floor(sample)), t = sample - i
  return (arcLengths[i] + (arcLengths[i + 1] - arcLengths[i]) * t) / journeyLength
}
