import { MathUtils } from 'three'
import { journeyAtCurveParameter } from '../data/ascentRoute'
import { checkpoints } from '../data/expedition'

const iceBounds = [.09, .15, .29, .37].map(journeyAtCurveParameter)
const basinBounds = [.31, .4, .53, .6].map(journeyAtCurveParameter)
const faceBounds = [.55, .64, .77, .84].map(journeyAtCurveParameter)
const ridgeBounds = [.78, .86].map(journeyAtCurveParameter)
const stormBounds = [.83, .89, .935, 1].map(journeyAtCurveParameter)
const summitBounds = [.955, .995].map(journeyAtCurveParameter)
const ramp = (a: number, b: number, t: number) => MathUtils.smoothstep(t, a, b)
const band = (a: number, b: number, c: number, d: number, t: number) => ramp(a, b, t) * (1 - ramp(c, d, t))

/** Horizontal downstream direction shared by snowfall and the summit cloth. */
export const alpineWind = { x: 1, z: .22 } as const

/** Spatial weather, reversible with scroll. Camps are quiet pockets within the journey. */
export function worldMood(route: number) {
  const t = MathUtils.clamp(route, 0, 1)
  const ice = band(iceBounds[0], iceBounds[1], iceBounds[2], iceBounds[3], t)
  const basin = band(basinBounds[0], basinBounds[1], basinBounds[2], basinBounds[3], t)
  const face = band(faceBounds[0], faceBounds[1], faceBounds[2], faceBounds[3], t)
  const ridge = ramp(ridgeBounds[0], ridgeBounds[1], t)
  let arrival = 0
  for (const camp of checkpoints) arrival = Math.max(arrival, 1 - ramp(.015, .045, Math.abs(t - camp.progress)))
  const storm = band(stormBounds[0], stormBounds[1], stormBounds[2], stormBounds[3], t)
  const summit = ramp(summitBounds[0], summitBounds[1], t)
  return {
    ice, basin, face, ridge, arrival, storm, summit,
    key: (2.25 - ice * .65 + basin * .15 + face * .65) * (1 - storm * .68) + summit * .95,
    ambient: 1.05 + basin * .4 + storm * .12 + arrival * .12 + summit * .35,
    fog: .0038 + ice * .0017 - basin * .0015 + face * .0004 + storm * .018 - summit * .0029,
    snowDensity: (.38 + ice * .14 + ridge * .14 + storm * .48) * (1 - basin * .65) * (1 - summit * .82) * (1 - arrival * .18),
    windSpeed: .7 + face * 1.8 + ridge * 2.2 + storm * 11 + summit * 1.2,
  }
}
