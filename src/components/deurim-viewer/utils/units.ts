/**
 * Unit conversion - the ONLY place where millimetres become Three.js units.
 *
 * Product data, user input, fit calculation and collision detection all work in
 * millimetres. Three.js works in scene units. Never divide by 1000 inside a
 * component; call `mmToSceneUnit()` instead.
 */

/** 1 Three.js scene unit == 1000 mm == 1 metre. */
export const MM_PER_SCENE_UNIT = 1000;

/** Millimetres -> Three.js scene units. */
export function mmToSceneUnit(mm: number): number {
  return mm / MM_PER_SCENE_UNIT;
}

/** Three.js scene units -> millimetres. */
export function sceneUnitToMm(unit: number): number {
  return unit * MM_PER_SCENE_UNIT;
}

/** Convenience helper for R3F `position` / `args` props. */
export function mmToSceneVec3(x: number, y: number, z: number): [number, number, number] {
  return [mmToSceneUnit(x), mmToSceneUnit(y), mmToSceneUnit(z)];
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/** Clamp helper used for slider / input sanitising. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
