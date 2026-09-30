import { MathUtils } from 'three'
import { checkpoints } from '../data/expedition'

const ramp = (a: number, b: number, t: number) => MathUtils.smoothstep(t, a, b)
const band = (a: number, b: number, c: number, d: number, t: number) => ramp(a, b, t) * (1 - ramp(c, d, t))

/** Spatial weather, reversible with scroll. Camps are quiet pockets within the journey. */
export function worldMood(route: number) {
  const t = MathUtils.clamp(route, 0, 1)
  const ice = band(.09, .15, .29, .37, t)
  const basin = band(.31, .4, .53, .6, t)
  const face = band(.55, .64, .77, .84, t)
  const ridge = ramp(.78, .86, t)
  const arrival = Math.max(...checkpoints.map(camp => 1 - ramp(.012, .035, Math.abs(t - camp.route))))
  const storm = band(.81, .865, .925, .975, t) * (1 - arrival * .85)
  const summit = ramp(.955, .995, t)
  return {
    ice, basin, face, ridge, arrival, storm, summit,
    key: (2.25 - ice * .65 + basin * .15 + face * .65) * (1 - storm * .68) + summit * .65,
    ambient: 1.05 + basin * .4 + storm * .12 + arrival * .12,
    fog: .0038 + ice * .0017 - basin * .0015 + face * .0004 + storm * .016 - summit * .0025,
    snowDensity: (.38 + ice * .14 + ridge * .14 + storm * .34) * (1 - basin * .65) * (1 - summit * .7) * (1 - arrival * .18),
    windSpeed: .7 + face * 1.8 + ridge * 2.2 + storm * 8 - summit * 2,
  }
}
