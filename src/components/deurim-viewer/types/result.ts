/** Result types produced by `utils/fitCalculator.ts` and `utils/collision.ts`. */
import type { DataStatus, DoorId } from './product';
import type { WallId } from './space';
import type { ValidationIssue } from './validation';

/**
 * Outcome of one check.
 *
 * `unknown` is NOT a failure. It means "there is not enough trustworthy data to
 * decide". Treating it as a FAIL would reject good products; treating it as a
 * PASS would claim a verification that never happened.
 */
/**
 * `info` is not a judgement. It carries a fact the shopper should know -
 * how far the appliance will stand proud of the recess, say - that does not
 * decide whether the appliance can be installed.
 */
export type CheckStatus = 'pass' | 'fail' | 'unknown' | 'info';

/**
 * What a failing check would actually mean for the shopper.
 *
 *   blocking       the appliance cannot be installed in this space.
 *   usability      it installs, but something will not work properly -
 *                  a door that cannot open far enough, for instance.
 *   informational  a fact about the installation, not a problem. It never
 *                  counts towards the verdict.
 *
 * Added in v0.6 because the engine had been treating all three the same, and
 * that produced false negatives - see PROJECT_SPEC.md section 9.3.
 */
export type CheckSeverity = 'blocking' | 'usability' | 'informational';

/**
 * Which part of the report a check belongs to (PROJECT_SPEC.md sections 9 and 10).
 *
 * - `physicalFit`            does the cabinet itself fit in the space?
 * - `installationRequirement` does the manufacturer's stated installation
 *                            condition hold (clearances, required height)?
 * - `doorUsability`          can the doors actually be opened?
 */
export type CheckGroup = 'physicalFit' | 'installationRequirement' | 'doorUsability' | 'note';

/**
 * Where a check's authority comes from.
 *
 * - `manufacturer` the rule and its numbers come from published product data.
 * - `simulation`   the result comes from this app's procedural 3D geometry,
 *                  which only approximates the real appliance.
 *
 * A `simulation` result must never be presented as a manufacturer verdict. When
 * a manufacturer figure covers the same question, the manufacturer figure wins
 * and the simulation becomes advisory (`countsTowardVerdict: false`).
 */
export type CheckAuthority = 'manufacturer' | 'simulation';

/** One installation check. */
export interface Check {
  id: string;
  group: CheckGroup;
  label: string;
  status: CheckStatus;
  severity: CheckSeverity;
  authority: CheckAuthority;
  /**
   * False for an advisory result that is displayed but deliberately excluded
   * from the final verdict.
   */
  countsTowardVerdict: boolean;
  /** Space the product needs. `null` when the requirement is unknown. */
  requiredMm: number | null;
  /** Space the user actually has. `null` when unknown or unbounded. */
  availableMm: number | null;
  /**
   * The number this row is about, in mm.
   *  - on a shortfall: how much is missing
   *  - on an informational projection: how far the appliance stands proud
   *  - 0 when there is nothing to report, `null` when unknown
   */
  shortageMm: number | null;
  /** Plain sentence explaining the status - always populated. */
  reason: string;
  /**
   * Provenance of the product value this check depends on, so a PASS backed by
   * an estimate can be told apart from a PASS backed by an official figure.
   * `null` when the check does not depend on a product specification value.
   */
  sourceStatus: DataStatus | null;
  /** True when there is no wall on that side, so the gap cannot run out. */
  unbounded: boolean;
}

/** A door collision check carries the extra door-specific facts. */
export interface DoorCollisionCheck extends Check {
  doorId: DoorId;
  currentAngleDeg: number;
  /** Walls the leaf currently intersects. */
  hitWalls: WallId[];
  /**
   * Largest opening angle (integer degrees) that stays clear of every wall,
   * `null` when it cannot be determined (no geometry, or already blocked at 0).
   */
  maxSafeAngleDeg: number | null;
}

/**
 * Final verdict.
 *
 * - `INSTALLABLE`         every counting check passed.
 * - `NOT_INSTALLABLE`     at least one counting check definitively failed.
 * - `PARTIALLY_VERIFIED`  no failures, but at least one counting check could not
 *                         be decided from the available data.
 */
export type InstallationVerdict = 'INSTALLABLE' | 'NOT_INSTALLABLE' | 'PARTIALLY_VERIFIED';

export interface InstallationReport {
  /** Does the cabinet fit at all? */
  physicalFit: Check[];
  /** Manufacturer installation conditions: clearances and required height. */
  installationRequirements: Check[];
  /** Official door side clearance, one row per leaf. */
  doorClearance: Check[];
  /**
   * Facts rather than judgements: how the appliance must be positioned and
   * how far it will stand proud. Never affects the verdict.
   */
  notes: Check[];
  /** Procedural 3D collision simulation, one row per leaf. */
  doorCollision: DoorCollisionCheck[];
  verdict: InstallationVerdict;
  /** Data problems found before calculating. */
  productIssues: ValidationIssue[];
  spaceIssues: ValidationIssue[];
  /**
   * True when a validation ERROR stopped the calculation. Every check is then
   * UNKNOWN and the 3D product geometry is not built.
   */
  blocked: boolean;
}

/** Every check in one flat list, in display order. */
export function allChecks(report: InstallationReport): Check[] {
  return [
    ...report.physicalFit,
    ...report.installationRequirements,
    ...report.doorClearance,
    ...report.doorCollision,
    ...report.notes,
  ];
}
