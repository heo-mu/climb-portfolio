/**
 * Tuning surface for the technical prototype.
 * These values intentionally remain provisional until reference frames are supplied.
 */
export const experienceConfig = {
  prototype: true,
  visualSource: 'pending-reference-captures' as const,
  camera: {
    desktopFov: 48,
    mobileFov: 58,
    railTension: 0.25,
    nearTerrainClearance: 65,
  },
  atmosphere: {
    fogBase: 0.00065,
    fogRouteVariation: 0.00045,
    whiteoutPeak: 0.0033,
    summitRelief: 0.00048,
  },
  lighting: { keyBase: 2.5, keySummit: 0.7, ambientBase: 1.6, ambientRoute: 0.55 },
  content: { readableRange: 0.046, transitionRange: 0.060 },
  // Portfolio checkpoints are intentionally independent from the reference's Everest labels.
  // Replace this mapping when reference frames become the visual source of truth.
  referenceAltitude: { baseCamp: 5364, deathZone: 8000, summit: 8849 },
}
