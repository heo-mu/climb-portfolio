/** Tunable, fictional expedition. Reference: observed WHITEOUT scroll sequence, 2026-09-30. */
export const experienceConfig = {
  prototype: true,
  visualSource: 'whiteout-live-scroll-and-user-reference' as const,
  camera: { desktopFov: 64, mobileFov: 72, eyeHeight: 1.8, lookAhead: 15, lookLift: 0.45, near: 0.08, far: 2400 },
  route: { depth: 1120, damping: 9, scrollScreens: 18 },
  atmosphere: { fogBase: 0.0028, fogRouteVariation: 0.0012, whiteoutPeak: 0.019, summitRelief: 0.0015 },
  lighting: { keyBase: 2.1, keySummit: 1.0, ambientBase: 1.25, ambientRoute: 0.35 },
  content: { readableRange: 0.018, transitionRange: 0.037 },
  snow: { nearCount: 180, middleCount: 650, farCount: 1100 },
}
