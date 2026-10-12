/**
 * Installation space (alcove / niche) data model.
 * All linear values are in MILLIMETRES (mm).
 *
 * This is deliberately a LOCAL installation space, not a room. There is no
 * floor plan, no furniture and no free-form walls - see PROJECT_SPEC.md
 * section 6 for the review of what a future version might add.
 */
export interface InstallationSpace {
  /** Clear width between the two side walls. */
  widthMm: number;
  /** Clear height from floor to ceiling. */
  heightMm: number;
  /**
   * Clear depth from the back wall to the front opening.
   * The side walls are modelled to run this exact depth, which is what makes
   * door <-> wall collision possible (or impossible) in the 3D scene.
   */
  depthMm: number;

  /** Whether a physical wall exists on the left side of the space. */
  hasLeftWall: boolean;
  /** Whether a physical wall exists on the right side of the space. */
  hasRightWall: boolean;
}

/** Identifier of a wall that a door can collide with. */
export type WallId = 'leftWall' | 'rightWall';

/** Where the appliance stands inside the space. */
export interface ProductPlacement {
  /**
   * Horizontal offset from the centre of the space, in mm.
   *   0        centred
   *   negative moved towards the left wall
   *   positive moved towards the right wall
   *
   * The stored value is raw user input; `utils/layout.ts` clamps it so the
   * cabinet can never pass through a wall. Geometry, clearance calculation and
   * collision detection all read the same clamped result.
   */
  offsetXMm: number;
  /**
   * Distance moved forward from the rear-most valid placement, in mm.
   * This is not a clearance value: layout derives the actual rear gap from the
   * product's published requirement plus this shopper-controlled offset.
   */
  offsetZMm?: number;
}
