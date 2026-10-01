// Shared controls for the camera rail and its navigation diagram (world metres).
export const ascentRouteControls = [
  [0, 0], [3, .2], [12, 1], [25, 4], [35, 12], [24, 23], [0, 37],
  [-12, 39], [-15, 40], [0, 47], [28, 65], [47, 81], [38, 99], [15, 117],
  [5, 118], [5, 119], [18, 127], [44, 145], [72, 168], [84, 193], [78, 207],
  [63, 208], [45, 209], [36, 222], [46, 245], [69, 273], [83, 297], [83, 304], [78, 305],
] as const

// Uniform Catmull–Rom, tension .5: the same lateral interpolation as routeCurve.
// Kept numeric so the navigation does not eagerly load the WebGL scene.
export function routeLateralAt(route: number) {
  const p = Math.max(0, Math.min(1, route)) * (ascentRouteControls.length - 1)
  const i = Math.min(Math.floor(p), ascentRouteControls.length - 2), t = p - i
  const b = ascentRouteControls[i][0], c = ascentRouteControls[i + 1][0]
  const a = i ? ascentRouteControls[i - 1][0] : 2 * b - c
  const d = i + 2 < ascentRouteControls.length ? ascentRouteControls[i + 2][0] : 2 * c - b
  const m = (c - a) / 2, n = (d - b) / 2
  return b + m * t + (-3 * b + 3 * c - 2 * m - n) * t * t + (2 * b - 2 * c + m + n) * t * t * t
}
