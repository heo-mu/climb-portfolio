/**
 * PRODUCT PLACEMENT (F-039).
 *
 * Where the appliance stands across the width of the alcove, and what that
 * position costs on each side.
 *
 * WHY THIS MODULE EXISTS
 *
 * Placement used to be a single number written by three preset buttons, with
 * the preset arithmetic living in the store. Two things were wrong with that:
 *
 *   1. "왼쪽에 붙여서" meant flush against the wall - a zero-millimetre gap. For
 *      an appliance whose manufacturer requires 50 mm of side clearance, that
 *      is a convenience button that GUARANTEES a failure. A quick preset must
 *      not put the shopper somewhere the same screen then calls wrong.
 *
 *   2. The offset was stored in millimetres and kept across a product change,
 *      so an offset that was valid for a 912 mm cabinet silently became a
 *      different position - or an invalid one - for a wider model.
 *
 * So placement is now an INTENT (which side) plus a derived offset, and the
 * derivation knows about the manufacturer's requirement.
 *
 * Pure TypeScript, millimetres only. No React, no Three.js, no store.
 */
import type { Product } from '../types/product';
import type { InstallationSpace } from '../types/space';
import { valueOf } from './specValue';

/**
 * Where the shopper wants the appliance.
 *
 * `custom` is what a direct drag produces. It is an internal name: the consumer
 * UI shows the three presets and simply stops highlighting one when the
 * appliance has been dragged somewhere between them.
 */
export type PlacementPreset = 'left' | 'centre' | 'right' | 'custom';

export interface PlacementRange {
  /** Most negative offset - the cabinet against the left wall. */
  minMm: number;
  /** Most positive offset - against the right wall. */
  maxMm: number;
}

/** Forward travel from the rear-most valid placement. */
export function depthPlacementRange(
  spaceDepthMm: number,
  productDepthMm: number,
  rearClearanceMm: number,
): PlacementRange {
  return { minMm: 0, maxMm: Math.max(0, spaceDepthMm - productDepthMm - rearClearanceMm) };
}

/** The rear target is always zero in the forward-from-rear coordinate system. */
export function rearPlacementTargetMm(): number { return 0; }

export type PlacementBoundary = 'left' | 'right';

export interface PlacementBoundaryTargets {
  leftMm: number | null;
  rightMm: number | null;
}

/**
 * Direct-drag snap is measured in the same millimetre coordinate system as
 * placement. The release distance is deliberately larger, so ordinary pointer
 * tremor does not repeatedly attach and detach the cabinet from a wall.
 */
const BOUNDARY_SNAP_MIN_MM = 32;
const BOUNDARY_SNAP_MAX_MM = 72;
const BOUNDARY_SNAP_FRACTION_OF_TRAVEL = 0.14;
const BOUNDARY_SNAP_RELEASE_MULTIPLIER = 1.5;

export interface BoundarySnapResult {
  offsetXMm: number;
  snappedBoundary: PlacementBoundary | null;
}

/**
 * How far the cabinet can move before it leaves the opening.
 *
 * This is the PHYSICAL limit, not the recommended one: a shopper dragging is
 * allowed to see a position that fails, because seeing why it fails is the
 * point. What they cannot do is push the appliance through a wall.
 */
export function placementRange(spaceWidthMm: number, productWidthMm: number): PlacementRange {
  const limit = Math.max(0, (spaceWidthMm - productWidthMm) / 2);
  return { minMm: -limit, maxMm: limit };
}

export function clampPlacement(offsetXMm: number, range: PlacementRange): number {
  if (!Number.isFinite(offsetXMm)) return 0;
  return Math.min(Math.max(offsetXMm, range.minMm), range.maxMm);
}

/**
 * The side clearance the manufacturer asks for, or 0 when they state none.
 *
 * Never guessed: a product with no published figure gets no allowance, and the
 * relevant check reports UNKNOWN as it always has.
 */
function requiredSideClearanceMm(product: Product, side: 'left' | 'right'): number {
  const spec =
    side === 'left' ? product.installation.leftClearanceMm : product.installation.rightClearanceMm;
  return valueOf(spec) ?? 0;
}

/**
 * The offset a preset means.
 *
 * "붙여서" is read as "as far that way as it can sensibly go" - up to the wall,
 * less whatever the manufacturer requires between the cabinet and that wall. If
 * the space is too tight to honour the requirement, the preset stops at the
 * physical limit rather than refusing: the shopper still gets the position they
 * asked for, and the result panel explains what is short about it.
 *
 * A wall the shopper says is not there imposes no requirement, because there is
 * nothing to keep clear of.
 */
export function presetOffsetMm(
  preset: Exclude<PlacementPreset, 'custom'>,
  space: InstallationSpace,
  product: Product,
  productWidthMm: number,
): number {
  const range = placementRange(space.widthMm, productWidthMm);
  if (preset === 'centre') return 0;

  if (preset === 'left') {
    const keepClear = space.hasLeftWall ? requiredSideClearanceMm(product, 'left') : 0;
    // Moving left is a negative offset, so honouring the gap moves back right.
    return clampPlacement(range.minMm + keepClear, range);
  }

  const keepClear = space.hasRightWall ? requiredSideClearanceMm(product, 'right') : 0;
  return clampPlacement(range.maxMm - keepClear, range);
}

/**
 * The wall-adjacent targets shared by Quick Placement and direct dragging.
 * A missing wall has no boundary to magnetise to; its preset semantics remain
 * unchanged, but direct drag stays free on that open side.
 */
export function placementBoundaryTargets(
  space: InstallationSpace,
  product: Product,
  productWidthMm: number,
): PlacementBoundaryTargets {
  return {
    leftMm: space.hasLeftWall ? presetOffsetMm('left', space, product, productWidthMm) : null,
    rightMm: space.hasRightWall ? presetOffsetMm('right', space, product, productWidthMm) : null,
  };
}

/**
 * Resolves one direct-drag position against the existing valid wall targets.
 * `snappedBoundary` is kept only for the lifetime of a gesture by the caller;
 * placement itself remains a plain offset and therefore stays the single
 * source consumed by geometry and validation.
 */
export function snapPlacementToBoundary(
  offsetXMm: number,
  range: PlacementRange,
  targets: PlacementBoundaryTargets,
  snappedBoundary: PlacementBoundary | null,
): BoundarySnapResult {
  const clamped = clampPlacement(offsetXMm, range);
  const travelMm = range.maxMm - range.minMm;
  const thresholdMm = Math.min(
    BOUNDARY_SNAP_MAX_MM,
    Math.max(BOUNDARY_SNAP_MIN_MM, travelMm * BOUNDARY_SNAP_FRACTION_OF_TRAVEL),
  );
  const lockedTarget = snappedBoundary === null ? null : targets[`${snappedBoundary}Mm`];

  if (lockedTarget !== null && lockedTarget !== undefined) {
    if (Math.abs(clamped - lockedTarget) <= thresholdMm * BOUNDARY_SNAP_RELEASE_MULTIPLIER) {
      return { offsetXMm: lockedTarget, snappedBoundary };
    }
  }

  const candidates = (['left', 'right'] as const)
    .map((boundary) => ({ boundary, targetMm: targets[`${boundary}Mm`] }))
    .filter((candidate): candidate is { boundary: PlacementBoundary; targetMm: number } =>
      candidate.targetMm !== null && Math.abs(clamped - candidate.targetMm) <= thresholdMm,
    )
    .sort((a, b) => Math.abs(clamped - a.targetMm) - Math.abs(clamped - b.targetMm));
  const nearest = candidates[0];
  return nearest === undefined
    ? { offsetXMm: clamped, snappedBoundary: null }
    : { offsetXMm: nearest.targetMm, snappedBoundary: nearest.boundary };
}

/**
 * Which preset an offset corresponds to, or `custom`.
 *
 * Used to keep the segmented control honest after a drag: if the appliance
 * happens to land exactly where a preset would put it, that preset stays lit.
 */
export function presetForOffset(
  offsetXMm: number,
  space: InstallationSpace,
  product: Product,
  productWidthMm: number,
  toleranceMm = 1,
): PlacementPreset {
  for (const preset of ['left', 'centre', 'right'] as const) {
    if (Math.abs(offsetXMm - presetOffsetMm(preset, space, product, productWidthMm)) <= toleranceMm) {
      return preset;
    }
  }
  return 'custom';
}

/**
 * Free space on each side at a given offset.
 *
 * The same arithmetic as `computeSideGaps`, expressed against an offset rather
 * than a built layout so a drag can ask "what would the gaps be here?" without
 * rebuilding geometry on every pointer move. Both are derived from the same
 * two facts - the slack in the opening, and where the cabinet sits in it.
 */
export function gapsAtOffset(
  offsetXMm: number,
  spaceWidthMm: number,
  productWidthMm: number,
): { leftMm: number; rightMm: number } {
  const halfSlack = (spaceWidthMm - productWidthMm) / 2;
  return { leftMm: halfSlack + offsetXMm, rightMm: halfSlack - offsetXMm };
}
