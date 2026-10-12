/**
 * Fit, clearance, door-clearance and collision checks - all installation maths.
 *
 * Pure TypeScript, millimetres only, no React and no Three.js. Every rule here
 * is mirrored in PROJECT_SPEC.md sections 9, 10 and 11.
 *
 * Three-state results: a check is PASS, FAIL or UNKNOWN. UNKNOWN means the
 * product record does not carry the value the rule needs. It is never turned
 * into a guess and never counted as a failure.
 *
 * Two authorities: a `manufacturer` check comes from published product data; a
 * `simulation` check comes from this app's procedural geometry, which only
 * approximates the real appliance. When a manufacturer figure answers the same
 * question, the manufacturer figure decides the verdict and the simulation is
 * shown as advisory (PROJECT_SPEC.md section 11.6).
 *
 * Every position used here comes from the layout produced by `utils/layout.ts`;
 * this module never works out a coordinate of its own.
 */
import type { Product, SpecValue } from '../types/product';
import type { InstallationSpace, ProductPlacement } from '../types/space';
import type { DoorLayout, InstallationLayout, ProductLayout } from '../types/geometry';
import type {
  Check,
  CheckAuthority,
  CheckGroup,
  CheckSeverity,
  CheckStatus,
  DoorCollisionCheck,
  InstallationReport,
  InstallationVerdict,
} from '../types/result';
import { boxToObb, doorObbAt } from './layout';
import { findMaxSafeAngleDeg, findWallHits, inflateObb, type WallObb } from './collision';
import { isManufacturerBacked, valueOf, verdictValueOf, weakestStatus } from './specValue';
import { hasErrors, validateProduct, validateSpace } from './validation';
import { CHECK_LABEL, MSG } from '../locales/ko';

/** Everything a check needs that is not already in the layout. */
export interface FitInput {
  product: Product;
  space: InstallationSpace;
  placement: ProductPlacement;
  layout: InstallationLayout;
  doorAnglesDeg: Record<string, number>;
  /** Service-internal conservative allowance, in mm. Default 0. */
  collisionSafetyMarginMm: number;
}

interface CheckOptions {
  authority?: CheckAuthority;
  countsTowardVerdict?: boolean;
  severity?: CheckSeverity;
}

function unknownCheck(
  id: string,
  group: CheckGroup,
  label: string,
  reason: string,
  sourceStatus: Check['sourceStatus'] = null,
  options: CheckOptions = {},
): Check {
  return {
    id,
    group,
    label,
    status: 'unknown',
    severity: options.severity ?? 'blocking',
    authority: options.authority ?? 'manufacturer',
    countsTowardVerdict: options.countsTowardVerdict ?? true,
    requiredMm: null,
    availableMm: null,
    shortageMm: null,
    reason,
    sourceStatus,
    unbounded: false,
  };
}

/** Compare a required amount against an available amount. */
function compare(
  id: string,
  group: CheckGroup,
  label: string,
  requiredMm: number,
  availableMm: number,
  sourceStatus: Check['sourceStatus'],
  options: CheckOptions = {},
): Check {
  const shortageMm = Math.max(0, requiredMm - availableMm);
  const status: CheckStatus = shortageMm > 0 ? 'fail' : 'pass';
  return {
    id,
    group,
    label,
    status,
    severity: options.severity ?? 'blocking',
    authority: options.authority ?? 'manufacturer',
    countsTowardVerdict: options.countsTowardVerdict ?? true,
    requiredMm,
    availableMm,
    shortageMm,
    reason:
      status === 'pass'
        ? MSG.fits(requiredMm, availableMm)
        : MSG.short(requiredMm, availableMm, shortageMm),
    sourceStatus,
    unbounded: false,
  };
}

/**
 * An informational row: a fact the shopper should know that does not decide
 * anything. It never counts towards the verdict.
 */
function note(
  id: string,
  label: string,
  reason: string,
  requiredMm: number | null,
  amountMm: number,
  sourceStatus: Check['sourceStatus'],
  availableMm: number | null = null,
): Check {
  return {
    id,
    group: 'note',
    label,
    status: 'info',
    severity: 'informational',
    authority: 'manufacturer',
    countsTowardVerdict: false,
    requiredMm,
    availableMm,
    shortageMm: amountMm,
    reason,
    sourceStatus,
    unbounded: false,
  };
}

/** A gap on a side with no wall cannot run out, so any requirement is met. */
function unboundedCheck(
  id: string,
  group: CheckGroup,
  label: string,
  requiredMm: number | null,
  sourceStatus: Check['sourceStatus'],
): Check {
  return {
    id,
    group,
    label,
    status: 'pass',
    severity: 'blocking',
    authority: 'manufacturer',
    countsTowardVerdict: true,
    requiredMm,
    availableMm: null,
    shortageMm: 0,
    reason: MSG.unbounded,
    sourceStatus,
    unbounded: true,
  };
}

/** Free gap between the cabinet and each side wall, at the placed position. */
export interface SideGaps {
  leftMm: number;
  rightMm: number;
  rearMm: number;
}

/**
 * Gaps derived from the placed cabinet.
 *
 *   leftGap  = (space.width - product.width) / 2 + offsetX
 *   rightGap = (space.width - product.width) / 2 - offsetX
 *   rearGap  =  space.depth - product.depth
 *
 * Moving the product right (positive offset) grows the left gap and shrinks the
 * right one by the same amount.
 */
export function computeSideGaps(space: InstallationSpace, productLayout: ProductLayout): SideGaps {
  const halfSlack = (space.widthMm - productLayout.body.size.x) / 2;
  return {
    leftMm: halfSlack + productLayout.appliedOffsetXMm,
    rightMm: halfSlack - productLayout.appliedOffsetXMm,
    rearMm: productLayout.body.center.z - productLayout.body.size.z / 2,
  };
}

/**
 * PHYSICAL FIT - does the cabinet itself go in?
 *   Width  : product.width <= space.width
 *   Height : product.height <= space.height   (the appliance itself, not the
 *            manufacturer's required installation height - see below)
 *   Depth  : product.depth + product.rearClearance <= space.depth
 */
function checkPhysicalFit(product: Product, space: InstallationSpace): Check[] {
  const widthMm = verdictValueOf(product, product.body.widthMm);
  const heightMm = verdictValueOf(product, product.body.heightMm);

  const width =
    widthMm === null
      ? unknownCheck('bodyWidth', 'physicalFit', CHECK_LABEL.bodyWidth, MSG.widthUnavailable)
      : compare('bodyWidth', 'physicalFit', CHECK_LABEL.bodyWidth, widthMm, space.widthMm, product.body.widthMm.status);

  const height =
    heightMm === null
      ? unknownCheck('bodyHeight', 'physicalFit', CHECK_LABEL.bodyHeight, MSG.heightUnavailable)
      : compare(
          'bodyHeight',
          'physicalFit',
          CHECK_LABEL.bodyHeight,
          heightMm,
          space.heightMm,
          product.body.heightMm.status,
        );

  return [width, height];
}

/**
 * DEPTH - facts, not a verdict.
 *
 * Until v0.6 the engine ran `product.depth + rearClearance <= space.depth` as a
 * BLOCKING check. That was wrong for a freestanding appliance. The depth a
 * shopper measures is the recess they are standing it in; a refrigerator deeper
 * than the recess does not fail to install, it simply stands proud of it, which
 * is how most kitchens actually look. Blocking on it rejected spaces the
 * appliance fits perfectly well - a false negative, the worst error this
 * service can make.
 *
 * So depth now produces two INFORMATIONAL rows and no judgement:
 *
 *   rearClearance    how far off the back wall to stand it. Always achievable
 *                    on a freestanding unit by pulling it forward, so it is an
 *                    instruction, not a pass/fail.
 *   frontProjection  how far it ends up standing proud:
 *                        max(0, rearClearance + product.depth - space.depth)
 *
 * What this deliberately does NOT decide: whether the shopper's recess is open
 * at the front. We never asked, so we never claim. The projection row says so
 * in plain words instead of guessing - see PROJECT_SPEC.md section 9.3.
 */
function checkDepthNotes(product: Product, space: InstallationSpace, productLayout: ProductLayout): Check[] {
  const depthMm = valueOf(product.body.depthMm);
  const rearClearanceMm = valueOf(product.installation.rearClearanceMm);

  const rear =
    rearClearanceMm === null
      ? unknownCheck(
          'rearClearance',
          'note',
          CHECK_LABEL.rearClearance,
          MSG.rearRequirementUnavailable,
          product.installation.rearClearanceMm.status,
          { severity: 'informational', countsTowardVerdict: false },
        )
      : note(
          'rearClearance',
          CHECK_LABEL.rearClearance,
          MSG.rearInstruction(rearClearanceMm),
          rearClearanceMm,
          0,
          product.installation.rearClearanceMm.status,
        );

  if (depthMm === null || rearClearanceMm === null) {
    return [
      rear,
      unknownCheck(
        'frontProjection',
        'note',
        CHECK_LABEL.frontProjection,
        MSG.depthUnavailable,
        product.body.depthMm.status,
        { severity: 'informational', countsTowardVerdict: false },
      ),
    ];
  }

  const totalDepthMm = productLayout.body.center.z + productLayout.body.size.z / 2;
  const projectionMm = Math.max(0, totalDepthMm - space.depthMm);

  return [
    rear,
    note(
      'frontProjection',
      CHECK_LABEL.frontProjection,
      projectionMm > 0 ? MSG.projects(projectionMm) : MSG.doesNotProject,
      totalDepthMm,
      projectionMm,
      weakestStatus(product.body.depthMm, product.installation.rearClearanceMm),
      space.depthMm,
    ),
  ];
}

/**
 * INSTALLATION REQUIREMENTS - the manufacturer's stated installation conditions.
 *
 * Body side clearance and rear clearance are about fitting the cabinet; the
 * required installation height is a separate, usually larger, figure than the
 * appliance height (levelling feet, lifting it into place, air gap above).
 * When it exists it takes priority over the plain physical height.
 */
function checkInstallationRequirements(
  product: Product,
  space: InstallationSpace,
  gaps: SideGaps,
): Check[] {
  const checks: Check[] = [];

  // Emitted only when the manufacturer actually states one. A product with no
  // stated requirement is judged on physical height alone.
  const requiredHeight = product.installation.requiredInstallationHeightMm;
  for (const [key, id, label, available] of [
    ['requiredInstallationWidthMm', 'requiredInstallationWidth', '설치 개구부 최소 폭', space.widthMm],
    ['requiredInstallationDepthMm', 'requiredInstallationDepth', '설치 개구부 최소 깊이', space.depthMm],
  ] as const) {
    const spec = product.installation[key];
    if (!spec) continue;
    const required = verdictValueOf(product, spec);
    checks.push(required === null
      ? unknownCheck(id, 'installationRequirement', label, '제조사의 공식 설치 개구부 기준을 확인할 수 없어요.', spec.status)
      : compare(id, 'installationRequirement', label, required, available, spec.status));
  }
  if (requiredHeight.value !== null) {
    const requiredHeightMm = verdictValueOf(product, requiredHeight);
    checks.push(
      requiredHeightMm === null
        ? unknownCheck(
            'requiredInstallationHeight',
            'installationRequirement',
            CHECK_LABEL.requiredInstallationHeight,
            MSG.installHeightUnusable,
            requiredHeight.status,
          )
        : compare(
            'requiredInstallationHeight',
            'installationRequirement',
            CHECK_LABEL.requiredInstallationHeight,
            requiredHeightMm,
            space.heightMm,
            requiredHeight.status,
          ),
    );
  }

  const sideCheck = (
    id: string,
    label: string,
    requirement: SpecValue,
    availableMm: number,
    hasWall: boolean,
  ): Check => {
    const requiredMm = verdictValueOf(product, requirement);
    if (!hasWall) return unboundedCheck(id, 'installationRequirement', label, requiredMm, requirement.status);
    if (verdictValueOf(product, product.body.widthMm) === null) {
      return unknownCheck(id, 'installationRequirement', label, MSG.widthUnavailable, product.body.widthMm.status);
    }
    if (requiredMm === null) {
      return unknownCheck(
        id,
        'installationRequirement',
        label,
        MSG.clearanceUnavailable,
        requirement.status,
        { countsTowardVerdict: false },
      );
    }
    return compare(id, 'installationRequirement', label, requiredMm, availableMm, requirement.status);
  };

  checks.push(
    sideCheck(
      'leftClearance',
      CHECK_LABEL.leftClearance,
      product.installation.leftClearanceMm,
      gaps.leftMm,
      space.hasLeftWall,
    ),
    sideCheck(
      'rightClearance',
      CHECK_LABEL.rightClearance,
      product.installation.rightClearanceMm,
      gaps.rightMm,
      space.hasRightWall,
    ),
  );

  // Rear clearance moved out of this group in v0.6: it is a placement
  // instruction a freestanding appliance can always satisfy, not a condition
  // the space can fail. It now appears in `notes`.
  return checks;
}

/**
 * DOOR USABILITY, part 1: the side space the door needs in order to open,
 * from `door.requiredSideClearanceMm`.
 *
 * This is a different question from body clearance - a cabinet can slide into a
 * niche perfectly (50 mm each side) and still have doors that cannot open
 * (295 mm each side required).
 */
function checkDoorSideClearance(
  product: Product,
  space: InstallationSpace,
  gaps: SideGaps,
  doors: DoorLayout[],
): Check[] {
  const requirement = product.door.requiredSideClearanceMm;
  const requiredMm = verdictValueOf(product, requirement);

  // The side gaps also depend on body width. An approximate box may be drawn,
  // but its dimensions cannot certify (or reject) the space beside it.
  if (verdictValueOf(product, product.body.widthMm) === null && (space.hasLeftWall || space.hasRightWall)) {
    return [unknownCheck('doorSideClearance', 'doorUsability', CHECK_LABEL.doorSideClearance,
      MSG.widthUnavailable, product.body.widthMm.status)];
  }

  /**
   * NO DOOR GEOMETRY, BUT THE REQUIREMENT IS STILL PUBLISHED.
   *
   * This branch used to return UNKNOWN and stop. It was withholding an answer
   * we actually have. The check is "is there this much room beside the
   * cabinet" - it reads the two side gaps and the manufacturer's figure, and
   * needs no door geometry whatsoever. The only thing the missing arrangement
   * takes away is WHICH SIDE the leaf hinges on, and for two of the three
   * outcomes that does not matter:
   *
   *   both sides clear the requirement      PASS, whichever side it hinges
   *   neither side clears it                FAIL, whichever side it hinges
   *   exactly one side clears it            genuinely UNKNOWN - the answer
   *                                         depends on the thing we do not know
   *
   * So the definite cases are reported definitely and the ambiguous one stays
   * UNKNOWN. Telling a shopper "we could not check it" when the answer is a
   * clear yes or a clear no is the false-uncertainty mirror of a false verdict.
   *
   * The tighter of the two gaps is reported as the available figure, so the
   * number on screen is the conservative one.
   */
  if (doors.length === 0) {
    // Without side boundaries there is no bounded side-clearance condition to
    // resolve, even when the manufacturer does not publish the hinge side.
    if (!space.hasLeftWall && !space.hasRightWall) {
      return [unboundedCheck('doorSideClearance', 'doorUsability', CHECK_LABEL.doorSideClearance, requiredMm, requirement.status)];
    }
    if (requiredMm === null) {
      return [
        unknownCheck(
          'doorSideClearance',
          'doorUsability',
          CHECK_LABEL.doorSideClearance,
          MSG.noDoorGeometry,
          requirement.status,
          { countsTowardVerdict: false, severity: 'usability' },
        ),
      ];
    }

    // A missing wall is unbounded space, so that side cannot be short.
    const leftClears = !space.hasLeftWall || gaps.leftMm >= requiredMm;
    const rightClears = !space.hasRightWall || gaps.rightMm >= requiredMm;
    const id = 'doorSideClearance';

    if (leftClears !== rightClears) {
      return [
        unknownCheck(
          id,
          'doorUsability',
          CHECK_LABEL.doorSideClearance,
          MSG.doorSideUnknownHingeSide,
          requirement.status,
        ),
      ];
    }
    const availableMm = Math.min(
      space.hasLeftWall ? gaps.leftMm : Number.POSITIVE_INFINITY,
      space.hasRightWall ? gaps.rightMm : Number.POSITIVE_INFINITY,
    );
    return [
      compare(id, 'doorUsability', CHECK_LABEL.doorSideClearance, requiredMm, availableMm, requirement.status, {
        severity: 'usability',
      }),
    ];
  }

  return doors.map((door) => {
    const id = `doorSideClearance:${door.id}`;
    const label = CHECK_LABEL.doorClearanceFor(door.id);
    const hasWall = door.hingeSide === 'left' ? space.hasLeftWall : space.hasRightWall;
    const availableMm = door.hingeSide === 'left' ? gaps.leftMm : gaps.rightMm;

    if (!hasWall) return unboundedCheck(id, 'doorUsability', label, requiredMm, requirement.status);
    if (requiredMm === null) {
      return unknownCheck(
        id,
        'doorUsability',
        label,
        MSG.doorClearanceUnavailable,
        requirement.status,
        { countsTowardVerdict: false, severity: 'usability' },
      );
    }
    return compare(id, 'doorUsability', label, requiredMm, availableMm, requirement.status, {
      severity: 'usability',
    });
  });
}

/** Walls converted once into the collision representation. */
export function wallObbsOf(layout: InstallationLayout): WallObb[] {
  return layout.space.sideWalls.map((wall) => ({ id: wall.id, obb: boxToObb(wall.box) }));
}

/**
 * True when the manufacturer publishes the door side clearance, in which case
 * the published figure decides door usability and the procedural 3D collision
 * is advisory only.
 */
export function doorClearanceIsAuthoritative(product: Product): boolean {
  return isManufacturerBacked(product.door.requiredSideClearanceMm);
}

/**
 * DOOR USABILITY, part 2: the procedural 3D collision simulation.
 *
 * ALWAYS ADVISORY. It never decides a verdict, whatever the product publishes.
 *
 * WHY THIS CHANGED IN v1.41
 *
 * The rule used to be `countsTowardVerdict: !doorClearanceIsAuthoritative`:
 * the simulation stood aside when the maker published a door-side clearance,
 * and DECIDED when the maker published nothing. That is exactly backwards. It
 * handed the most authority to the simulation in precisely the case where
 * there was least evidence to build it from, and Samsung RS84B508115 - which
 * publishes no door-side figure - was the first catalogue entry to be judged
 * that way.
 *
 * The geometry underneath cannot support a definitive answer. Measuring
 * RS84B508115 against its own installation guide:
 *
 *   the 90-degree figure is real and per-model - 90-degree side length minus
 *   body depth is 449 mm across all three official 양문형 blocks, tracking
 *   each model's own depth (915 and 740). It fixes r - s, the leaf's radial
 *   reach minus the pivot's setback.
 *
 *   it does NOT fix r and s separately, and every split on that line sweeps a
 *   different path: a sideways reach anywhere from 442 mm to 546 mm at 170
 *   degrees. Samsung publishes neither, nor the hinge inset.
 *
 *   the one published figure that could separate them - 최대 도어 열림 길이
 *   포함한 가로 길이 1,726 mm - is a FAMILY CONSTANT, identical for RS84*,
 *   RS80* and RS63* even though their door lengths differ (518 / 518 / 564).
 *   It is not a per-model swept envelope and cannot calibrate one.
 *
 * So the swept footprint carries roughly 100 mm of irreducible uncertainty per
 * side. Turning that into "이 공간에는 설치가 어려워요" would be a definitive
 * verdict resting on a number nobody published - and the direction that costs
 * most is the false one: telling somebody a refrigerator will not fit when it
 * will (rule 46).
 *
 * Nothing is hidden. The check still runs, still reports the collision, still
 * drives the door control's usable-angle marker and the red highlight in the
 * scene, and the shopper still SEES the leaf meet the wall. It simply does not
 * convert that into a definitive no. The authoritative door answer remains
 * `door.requiredSideClearanceMm`, which decides when published and reports
 * UNKNOWN when it is not.
 */
function checkDoorCollision(input: FitInput, doors: DoorLayout[]): DoorCollisionCheck[] {
  const walls = wallObbsOf(input.layout);
  const marginMm = input.collisionSafetyMarginMm;

  if (doors.length === 0) {
    return [
      {
        ...unknownCheck(
          'doorCollision',
          'doorUsability',
          CHECK_LABEL.doorCollision,
          MSG.noDoorGeometry,
          null,
          { authority: 'simulation', countsTowardVerdict: false },
        ),
        doorId: 'single',
        currentAngleDeg: 0,
        hitWalls: [],
        maxSafeAngleDeg: null,
      },
    ];
  }

  return doors.map((door): DoorCollisionCheck => {
    const currentAngleDeg = input.doorAnglesDeg[door.id] ?? 0;
    const hitWalls = findWallHits(inflateObb(doorObbAt(door, currentAngleDeg), marginMm), walls);
    const maxSafeAngleDeg = findMaxSafeAngleDeg(
      (angle) => inflateObb(doorObbAt(door, angle), marginMm),
      door.maxAngleDeg,
      walls,
    );

    const collided = hitWalls.length > 0;
    const marginNote = marginMm > 0 ? MSG.marginApplied(marginMm) : '';
    // Always said, because the simulation is always advisory - but WHY it is
    // advisory differs, and claiming the maker decided it when the maker
    // published nothing would be a false claim.
    const advisoryNote = doorClearanceIsAuthoritative(input.product)
      ? MSG.advisoryNote
      : MSG.simulationOnlyNote;

    return {
      id: `doorCollision:${door.id}`,
      group: 'doorUsability',
      label: CHECK_LABEL.doorCollisionFor(door.id),
      status: collided ? 'fail' : 'pass',
      severity: 'usability',
      authority: 'simulation',
      countsTowardVerdict: false,
      requiredMm: null,
      availableMm: null,
      shortageMm: null,
      reason: collided
        ? MSG.collision(currentAngleDeg, hitWalls) + marginNote + advisoryNote
        : MSG.clear(currentAngleDeg) + marginNote + advisoryNote,
      sourceStatus: null,
      unbounded: false,
      doorId: door.id,
      currentAngleDeg,
      hitWalls,
      maxSafeAngleDeg,
    };
  });
}

/** Every check unknown, used when validation blocks the calculation. */
function blockedReport(
  reason: string,
  productIssues: InstallationReport['productIssues'],
  spaceIssues: InstallationReport['spaceIssues'],
): InstallationReport {
  const physicalFit = [
    unknownCheck('bodyWidth', 'physicalFit', CHECK_LABEL.bodyWidth, reason),
    unknownCheck('bodyHeight', 'physicalFit', CHECK_LABEL.bodyHeight, reason),
  ];
  const installationRequirements = [
    unknownCheck('leftClearance', 'installationRequirement', CHECK_LABEL.leftClearance, reason),
    unknownCheck('rightClearance', 'installationRequirement', CHECK_LABEL.rightClearance, reason),
  ];
  const notes = [
    unknownCheck('rearClearance', 'note', CHECK_LABEL.rearClearance, reason, null, {
      severity: 'informational',
      countsTowardVerdict: false,
    }),
    unknownCheck('frontProjection', 'note', CHECK_LABEL.frontProjection, reason, null, {
      severity: 'informational',
      countsTowardVerdict: false,
    }),
  ];
  const doorClearance = [
    unknownCheck('doorSideClearance', 'doorUsability', CHECK_LABEL.doorSideClearance, reason),
  ];
  const doorCollision: DoorCollisionCheck[] = [
    {
      ...unknownCheck('doorCollision', 'doorUsability', CHECK_LABEL.doorCollision, reason, null, {
        authority: 'simulation',
      }),
      doorId: 'single',
      currentAngleDeg: 0,
      hitWalls: [],
      maxSafeAngleDeg: null,
    },
  ];

  return {
    physicalFit,
    installationRequirements,
    doorClearance,
    doorCollision,
    notes,
    verdict: 'PARTIALLY_VERIFIED',
    productIssues,
    spaceIssues,
    blocked: true,
  };
}

/**
 * Final verdict, computed from the checks that count:
 *   any FAIL                -> NOT_INSTALLABLE
 *   no FAIL but any UNKNOWN -> PARTIALLY_VERIFIED
 *   everything PASS         -> INSTALLABLE
 *
 * Advisory checks (`countsTowardVerdict: false`) are displayed but excluded, so
 * an approximate simulation can never overrule a published manufacturer figure.
 */
export function verdictOf(checks: Check[]): InstallationVerdict {
  // Informational rows carry `countsTowardVerdict: false`, so a projection can
  // never flip a verdict no matter how large it is.
  const counting = checks.filter((check) => check.countsTowardVerdict);
  if (counting.some((check) => check.status === 'fail')) return 'NOT_INSTALLABLE';
  if (counting.some((check) => check.status === 'unknown')) return 'PARTIALLY_VERIFIED';
  return 'INSTALLABLE';
}

/** Complete installation report. */
export function buildInstallationReport(input: FitInput): InstallationReport {
  const productIssues = validateProduct(input.product);
  const spaceIssues = validateSpace(input.space);

  if (hasErrors(productIssues)) {
    return blockedReport(MSG.blockedProduct, productIssues, spaceIssues);
  }
  if (hasErrors(spaceIssues)) {
    return blockedReport(MSG.blockedSpace, productIssues, spaceIssues);
  }

  const productLayout = input.layout.product;
  if (productLayout === null) {
    return blockedReport(MSG.blockedNoGeometry, productIssues, spaceIssues);
  }

  const gaps = computeSideGaps(input.space, productLayout);

  const physicalFit = checkPhysicalFit(input.product, input.space);
  const installationRequirements = checkInstallationRequirements(input.product, input.space, gaps);
  const doorClearance = checkDoorSideClearance(input.product, input.space, gaps, productLayout.doors);
  const doorCollision = checkDoorCollision(input, productLayout.doors);
  const notes = checkDepthNotes(input.product, input.space, productLayout);

  return {
    physicalFit,
    installationRequirements,
    doorClearance,
    doorCollision,
    notes,
    verdict: verdictOf([
      ...physicalFit,
      ...installationRequirements,
      ...doorClearance,
      ...doorCollision,
      ...notes,
    ]),
    productIssues,
    spaceIssues,
    blocked: false,
  };
}
