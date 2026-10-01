/** Tunable, fictional expedition. Reference: observed WHITEOUT scroll sequence, 2026-09-30. */
export const experienceConfig = {
  camera: { desktopFov: 64, mobileFov: 72, eyeHeight: 1.8, lookAhead: 15, lookLift: 0.45, near: 0.08, far: 2400 },
  route: { depth: 1120, damping: 9, scrollScreens: 18 },
  atmosphere: { fogBase: 0.0028, fogRouteVariation: 0.0012, whiteoutPeak: 0.019, summitRelief: 0.0015 },
  lighting: { exposure: 1.04, keyBase: 2.7, keySummit: 0.35, ambientBase: 1.2, ambientRoute: 0.22, fill: 0.38 },
  // A camp is arrived (readable, interactive, current in the trail) while the eye
  // is within `arrivalDistance` metres of its reading plateau. Home stays tighter
  // so a single wheel step still departs.
  content: { readableRange: 0.024, arrivalDistance: 5, homeArrivalDistance: 3 },
  home: { exitRange: 0.022 },
  snow: { nearCount: 220, middleCount: 800, farCount: 1400 },
}
