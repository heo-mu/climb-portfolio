/** Tunable, fictional expedition. Reference: observed WHITEOUT scroll sequence, 2026-09-30. */
export const experienceConfig = {
  camera: { desktopFov: 64, mobileFov: 72, eyeHeight: 1.8, lookAhead: 15, lookLift: 0.45, near: 0.08, far: 2400 },
  route: { depth: 1120, damping: 9, scrollScreens: 18 },
  atmosphere: { fogBase: 0.0028 },
  lighting: { exposure: 1.04, keyBase: 2.7, ambientBase: 1.2, fill: 0.38 },
  // A camp is arrived (readable, interactive, current in the trail) while the eye
  // is within `arrivalDistance` metres of its reading plateau, and docks there when
  // the walker will stop inside it. Home docks only within `homeDockDistance`, so a
  // single wheel step still departs instead of springing back.
  content: { readableRange: 0.030, arrivalDistance: 5, homeDockDistance: 3 },
  home: { exitRange: 0.022 },
  snow: { nearCount: 220, middleCount: 800, farCount: 1400 },
}
