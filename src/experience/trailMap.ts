import { routeLateralAt, curveParameterAt } from '../data/ascentRoute'

type Point = { route: number; x: number; y: number; length: number }
const SAMPLE_COUNT = 280

/** Fixed camera-rail shape; only resized, never rebuilt on scroll. */
export function createTrailMap(width: number, height: number, horizontal = false) {
  const lateral = Array.from({ length: SAMPLE_COUNT + 1 }, (_, i) => routeLateralAt(curveParameterAt(i / SAMPLE_COUNT)))
  const min = Math.min(...lateral), span = Math.max(...lateral) - min
  // Remove the rail's overall sideways drift in the diagram only: both ends
  // share an axis, while the real switchbacks remain. The camera is untouched.
  const drift = lateral.at(-1)! - lateral[0]
  const residual = lateral.map((x, i) => x - lateral[0] - drift * i / SAMPLE_COUNT)
  const weights = residual.map((_, i) => { const t = i / SAMPLE_COUNT; return 4 * t * (1 - t) })
  // A gentle endpoint-zero correction balances the line's lateral mass.
  const bias = residual.reduce((sum, x) => sum + x, 0) / weights.reduce((sum, x) => sum + x, 0)
  const balanced = residual.map((x, i) => x - bias * weights[i])
  const extent = Math.max(...balanced.map(Math.abs), 1)
  const points: Point[] = lateral.map((x, i) => {
    const route = i / SAMPLE_COUNT, side = (x - min) / span
    return { route, x: horizontal ? 18 + route * (width - 36) : 96 + (width - 112) * (.5 + balanced[i] / extent * .5),
      y: horizontal ? 12 + (1 - side) * 22 : height - 24 - route * (height - 48), length: 0 }
  })
  for (let i = 1; i < points.length; i++) {
    points[i].length = points[i - 1].length + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
  }
  const length = points.at(-1)!.length
  // Dense subpixel samples of the smooth source spline retain only its broad bends
  // after lateral compression. Stroke, marker and nodes use this identical polyline.
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ')
  const at = (route: number) => {
    const sample = Math.max(0, Math.min(1, route)) * SAMPLE_COUNT
    const i = Math.min(Math.floor(sample), SAMPLE_COUNT - 1), t = sample - i
    const a = points[i], b = points[i + 1]
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, length: a.length + (b.length - a.length) * t }
  }
  return { path, length, at, width, height, horizontal }
}
