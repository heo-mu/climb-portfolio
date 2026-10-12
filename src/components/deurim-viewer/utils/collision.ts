/**
 * Door <-> wall collision detection.
 *
 * ALGORITHM: 2D Separating Axis Theorem (SAT) on the XZ floor plane, combined
 * with a 1D overlap test on the Y axis.
 *
 * Why this and not a Box3 / AABB test: an opened door is a ROTATED box. Its
 * axis aligned bounding box is much larger than the door itself, so an AABB
 * test reports collisions that do not physically happen (false positives).
 * Both a door leaf and a wall are rectangular prisms whose vertical edges are
 * parallel to +Y, therefore the exact 3D problem reduces to
 *   (rotated rectangle vs rectangle on XZ)  AND  (interval overlap on Y),
 * which SAT solves exactly - no approximation for a given door angle.
 *
 * This module is pure TypeScript. It imports no React and no Three.js, and it
 * works entirely in millimetres.
 */
import type { Obb2DMm } from '../types/geometry';
import type { WallId } from '../types/space';

/** Contact tolerance. Two shapes that merely touch are reported as clear. */
export const COLLISION_EPSILON_MM = 0.5;

/**
 * Grow an oriented box outwards by `marginMm` on every side of its footprint.
 *
 * This implements the Collision Safety Margin (F-015): a service-internal,
 * deliberately conservative allowance for door handles, manufacturing tolerance
 * and installation slop, none of which the plain box models. It is NOT a
 * manufacturer requirement, and the default is 0 mm.
 *
 * The vertical extent is left alone: a door leaf and a wall always overlap
 * vertically in this model, so inflating Y could never change an outcome.
 */
export function inflateObb(obb: Obb2DMm, marginMm: number): Obb2DMm {
  if (!Number.isFinite(marginMm) || marginMm <= 0) return obb;
  return { ...obb, halfX: obb.halfX + marginMm, halfZ: obb.halfZ + marginMm };
}

interface Point2D {
  x: number;
  z: number;
}

/** The two world-space edge directions of an OBB footprint. */
function obbAxes(obb: Obb2DMm): Point2D[] {
  const cos = Math.cos(obb.rotationY);
  const sin = Math.sin(obb.rotationY);
  // Local (1,0) and (0,1) transformed by the same Y rotation Three.js applies.
  return [
    { x: cos, z: -sin },
    { x: sin, z: cos },
  ];
}

/** The four world-space corners of an OBB footprint. */
export function obbCorners(obb: Obb2DMm): Point2D[] {
  const [u, v] = obbAxes(obb);
  const corners: Point2D[] = [];
  for (const su of [-1, 1]) {
    for (const sv of [-1, 1]) {
      corners.push({
        x: obb.centerX + u.x * obb.halfX * su + v.x * obb.halfZ * sv,
        z: obb.centerZ + u.z * obb.halfX * su + v.z * obb.halfZ * sv,
      });
    }
  }
  return corners;
}

function projectOntoAxis(corners: Point2D[], axis: Point2D): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const corner of corners) {
    const projection = corner.x * axis.x + corner.z * axis.z;
    if (projection < min) min = projection;
    if (projection > max) max = projection;
  }
  return { min, max };
}

/** True when the two footprints overlap by more than the contact tolerance. */
export function footprintsOverlap(a: Obb2DMm, b: Obb2DMm, epsilonMm = COLLISION_EPSILON_MM): boolean {
  const cornersA = obbCorners(a);
  const cornersB = obbCorners(b);
  const axes = [...obbAxes(a), ...obbAxes(b)];

  for (const axis of axes) {
    const projectionA = projectOntoAxis(cornersA, axis);
    const projectionB = projectOntoAxis(cornersB, axis);
    // A single separating axis is enough to prove there is no intersection.
    if (projectionA.max - projectionB.min <= epsilonMm) return false;
    if (projectionB.max - projectionA.min <= epsilonMm) return false;
  }
  return true;
}

/** True when the two vertical extents overlap by more than the tolerance. */
export function verticalRangesOverlap(a: Obb2DMm, b: Obb2DMm, epsilonMm = COLLISION_EPSILON_MM): boolean {
  return a.yMax - b.yMin > epsilonMm && b.yMax - a.yMin > epsilonMm;
}

/** Full 3D test between two vertical rectangular prisms. */
export function prismsIntersect(a: Obb2DMm, b: Obb2DMm): boolean {
  return verticalRangesOverlap(a, b) && footprintsOverlap(a, b);
}

export interface WallObb {
  id: WallId;
  obb: Obb2DMm;
}

/** Every wall the given door pose currently intersects. */
export function findWallHits(doorObb: Obb2DMm, walls: WallObb[]): WallId[] {
  return walls.filter((wall) => prismsIntersect(doorObb, wall.obb)).map((wall) => wall.id);
}

/**
 * Largest integer opening angle in [0, maxAngleDeg] that stays clear of every
 * wall, found by sampling one degree at a time from closed to open.
 *
 * SAMPLING, NOT BISECTION - and that is a measured decision, not caution.
 *
 * A bisection needs the collision-free angles to form a prefix: once the leaf
 * touches a wall it must never come clear again. `npm run verify` sweeps 480
 * geometry combinations at half-degree resolution to test exactly that, and the
 * answer depends on the safety margin:
 *
 *   margin 0 mm   monotonic - the blocked angles are a tail
 *   margin 20 mm  NOT monotonic - an inflated leaf can foul a wall around 110
 *                 degrees and come clear again by 125
 *
 * A bisection was written, and the equivalence check against this sweep caught
 * it returning 125 where the truth is 110 - an overstated maximum, which is the
 * worst direction for this particular error to go. So the sweep stays. It costs
 * at most ~126 tests per door and correctness is not negotiable for a number a
 * shopper uses to decide whether a door will open in their kitchen.
 *
 * Returns `null` when even the closed door already intersects a wall.
 */
export function findMaxSafeAngleDeg(
  buildObb: (angleDeg: number) => Obb2DMm,
  maxAngleDeg: number,
  walls: WallObb[],
  stepDeg = 1,
): number | null {
  let lastSafe: number | null = null;
  for (let angle = 0; angle <= maxAngleDeg + 1e-9; angle += stepDeg) {
    if (findWallHits(buildObb(angle), walls).length > 0) return lastSafe;
    lastSafe = angle;
  }
  return lastSafe;
}
