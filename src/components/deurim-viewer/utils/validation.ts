/**
 * All validation rules in one module - product data and user measurements.
 *
 * Two different failure modes are deliberately kept apart:
 *
 *   ERROR   the data is impossible (negative width, 400 degree door angle).
 *           Geometry and checks are NOT calculated; the UI shows the error.
 *   WARNING the data is merely missing. Calculation continues and the affected
 *           checks report UNKNOWN.
 *
 * This module is pure TypeScript: no React, no Three.js, millimetres only.
 */
import type { DoorType, HingeSide, Product, SpecValue } from '../types/product';
import { DOOR_TOPOLOGIES } from '../data/doorTopologies';
import type { InstallationSpace } from '../types/space';
import type { ValidationIssue } from '../types/validation';
import { MEASUREMENT_DEFINITIONS, measurementByField, type MeasurementField } from '../data/measurements';
import { doorOpeningSpec, hasValue } from './specValue';
import { FIELD_LABEL, VALIDATION } from '../locales/ko';

/** A door cannot physically swing further than a half turn. */
export const MAX_ALLOWED_DOOR_ANGLE_DEG = 180;

/**
 * Opening limit used when a product does not state one. It only bounds the
 * slider and the safe-angle search; it is never presented as a product value,
 * and any door built on it is flagged via `DoorLayout.maxAngleIsFallback`.
 */
export const DOOR_ANGLE_FALLBACK_MAX_DEG = 90;

function error(field: string, message: string): ValidationIssue {
  return { field, severity: 'error', message };
}

function warning(field: string, message: string): ValidationIssue {
  return { field, severity: 'warning', message };
}

/** A present value must be a finite number; a missing value is only a warning. */
function checkPositiveSpec(
  field: string,
  label: string,
  source: SpecValue,
  issues: ValidationIssue[],
  { requiredForGeometry }: { requiredForGeometry: boolean },
): void {
  if (source.value === null) {
    issues.push(
      warning(
        field,
        requiredForGeometry
          ? VALIDATION.missingForGeometry(label)
          : VALIDATION.missingForCheck(label),
      ),
    );
    return;
  }
  if (!Number.isFinite(source.value)) {
    issues.push(error(field, VALIDATION.notFinite(label)));
    return;
  }
  if (source.value <= 0) {
    issues.push(error(field, VALIDATION.mustBePositive(label, source.value)));
  }
}

/**
 * A clearance of exactly 0 mm is legitimate ("no gap required").
 *
 * `warnWhenMissing: false` is for OPTIONAL requirements - a figure whose absence
 * means "the manufacturer states no such requirement" rather than "we are
 * missing data". The required installation height is the one such field today.
 */
function checkNonNegativeSpec(
  field: string,
  label: string,
  source: SpecValue,
  issues: ValidationIssue[],
  { warnWhenMissing = true }: { warnWhenMissing?: boolean } = {},
): void {
  if (source.value === null) {
    if (warnWhenMissing) {
      issues.push(warning(field, VALIDATION.missingForCheck(label)));
    }
    return;
  }
  if (!Number.isFinite(source.value)) {
    issues.push(error(field, VALIDATION.notFinite(label)));
    return;
  }
  if (source.value < 0) {
    issues.push(error(field, VALIDATION.cannotBeNegative(label, source.value)));
  }
}

/**
 * Which leaf ids and hinge sides a door type implies.
 *
 * The single source of that mapping for validation; `utils/layout.ts` builds
 * the same set. A record cannot add a leaf the type does not have, so this is
 * what a per-leaf table is checked against.
 */
function expectedLeaves(doorType: DoorType): Record<string, HingeSide | null> {
  return Object.fromEntries(DOOR_TOPOLOGIES[doorType].leaves.map(leaf => [leaf.id, leaf.hingeSide]));
}

/**
 * PER-LEAF DOOR DATA MUST DESCRIBE THE DOORS THIS PRODUCT ACTUALLY HAS.
 *
 * A leaf table is an ANGLE table, not a second topology. Everything that could
 * make it silently disagree with `door.type` is an error rather than a
 * warning, because a leaf nobody notices is one the slider will never offer
 * and the collision test will never run:
 *
 *   - a leaf the type does not have (a `right` on a single-door appliance)
 *   - the same leaf twice
 *   - a hinge on the wrong edge
 *   - a leaf maximum TIGHTER than the whole-product figure, which would mean
 *     the product-level number is not the conservative one it is declared to be
 */
function validateDoorLeaves(product: Product, issues: ValidationIssue[]): void {
  const leaves = product.door.leaves;
  if (!leaves || product.door.type === null) return;

  const expected = expectedLeaves(product.door.type);
  const productMaxDeg = doorOpeningSpec(product.door).value;
  const seen = new Set<string>();

  for (const leaf of leaves) {
    const field = `door.leaves.${leaf.id}`;
    const expectedSide = expected[leaf.id];
    if (expectedSide === undefined) {
      issues.push(error(field, VALIDATION.doorLeafUnknownSide(leaf.id)));
      continue;
    }
    if (seen.has(leaf.id)) {
      issues.push(error(field, VALIDATION.doorLeafDuplicate(leaf.id)));
      continue;
    }
    seen.add(leaf.id);

    if (expectedSide !== null && leaf.hingeSide !== expectedSide && !(product.door.type === 'single' && leaf.hingeSide === 'right')) {
      issues.push(
        error(field, VALIDATION.doorLeafHingeMismatch(leaf.id, expectedSide, leaf.hingeSide ?? 'unknown')),
      );
    }

    checkNonNegativeSpec(field, FIELD_LABEL.maxDoorAngle, doorOpeningSpec(leaf), issues, {
      warnWhenMissing: false,
    });
    const leafMaxDeg = doorOpeningSpec(leaf).value;
    if (leafMaxDeg !== null && Number.isFinite(leafMaxDeg)) {
      if (leafMaxDeg > MAX_ALLOWED_DOOR_ANGLE_DEG) {
        issues.push(
          error(field, VALIDATION.maxAngleTooLarge(MAX_ALLOWED_DOOR_ANGLE_DEG, leafMaxDeg)),
        );
      }
      if (productMaxDeg !== null && Number.isFinite(productMaxDeg) && leafMaxDeg < productMaxDeg) {
        issues.push(
          error(field, VALIDATION.doorLeafAngleBelowProduct(leaf.id, leafMaxDeg, productMaxDeg)),
        );
      }
    }
  }
}

/**
 * Validate one product record.
 * Returns every issue found; the caller decides what to do with them.
 */
export function validateProduct(product: Product): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!product.id) issues.push(error('id', VALIDATION.required(FIELD_LABEL.id)));
  if (!product.identity.brand) issues.push(error('identity.brand', VALIDATION.required(FIELD_LABEL.brand)));
  if (!product.identity.modelName) {
    issues.push(error('identity.modelName', VALIDATION.required(FIELD_LABEL.modelName)));
  }

  checkPositiveSpec('body.widthMm', FIELD_LABEL.bodyWidth, product.body.widthMm, issues, { requiredForGeometry: true });
  checkPositiveSpec('body.heightMm', FIELD_LABEL.bodyHeight, product.body.heightMm, issues, { requiredForGeometry: true });
  checkPositiveSpec('body.depthMm', FIELD_LABEL.bodyDepth, product.body.depthMm, issues, { requiredForGeometry: true });

  checkNonNegativeSpec('installation.rearClearanceMm', FIELD_LABEL.rearClearance, product.installation.rearClearanceMm, issues);
  for (const key of ['requiredInstallationWidthMm', 'requiredInstallationDepthMm'] as const) {
    const spec = product.installation[key];
    if (spec) checkNonNegativeSpec(`installation.${key}`, key === 'requiredInstallationWidthMm' ? '설치 개구부 최소 폭' : '설치 개구부 최소 깊이', spec, issues);
  }
  checkNonNegativeSpec('installation.leftClearanceMm', FIELD_LABEL.leftClearance, product.installation.leftClearanceMm, issues);
  checkNonNegativeSpec('installation.rightClearanceMm', FIELD_LABEL.rightClearance, product.installation.rightClearanceMm, issues);

  if (product.door.type === null) {
    issues.push(warning('door.type', VALIDATION.doorTypeMissing));
  }

  const maxAngle = doorOpeningSpec(product.door);
  if (maxAngle.value === null) {
    issues.push(warning('door.maxAngleDeg', VALIDATION.maxAngleMissing(DOOR_ANGLE_FALLBACK_MAX_DEG)));
  } else if (!Number.isFinite(maxAngle.value)) {
    issues.push(error('door.maxAngleDeg', VALIDATION.notFinite(FIELD_LABEL.maxDoorAngle)));
  } else if (maxAngle.value < 0) {
    issues.push(error('door.maxAngleDeg', VALIDATION.cannotBeNegative(FIELD_LABEL.maxDoorAngle, maxAngle.value)));
  } else if (maxAngle.value > MAX_ALLOWED_DOOR_ANGLE_DEG) {
    issues.push(
      error('door.maxAngleDeg', VALIDATION.maxAngleTooLarge(MAX_ALLOWED_DOOR_ANGLE_DEG, maxAngle.value)),
    );
  }

  validateDoorLeaves(product, issues);

  checkNonNegativeSpec(
    'installation.requiredInstallationHeightMm',
    FIELD_LABEL.requiredInstallationHeight,
    product.installation.requiredInstallationHeightMm,
    issues,
    { warnWhenMissing: false },
  );

  /**
   * The two depths must agree about which is which.
   *
   * `depthExcludingDoorMm` is the SAME rear extremity measured to the cabinet
   * face instead of the door face, so it can only ever be the smaller of the
   * two. A record where it is larger has swapped the references, and the door
   * assembly depth derived from them would come out negative.
   */
  const bodyDepthMm = product.body.depthMm.value;
  const noDoorDepthMm = product.body.depthExcludingDoorMm.value;
  const noHandleDepth = product.body.depthExcludingHandlesMm;
  if (noHandleDepth) {
    checkNonNegativeSpec('body.depthExcludingHandlesMm', '손잡이 제외 깊이', noHandleDepth, issues, { warnWhenMissing: false });
    if (bodyDepthMm !== null && noHandleDepth.value !== null && noHandleDepth.value > bodyDepthMm) {
      issues.push(error('body.depthExcludingHandlesMm', '손잡이 제외 깊이는 전체 깊이보다 클 수 없어요.'));
    }
  }
  checkNonNegativeSpec(
    'body.depthExcludingDoorMm',
    FIELD_LABEL.bodyDepthExcludingDoor,
    product.body.depthExcludingDoorMm,
    issues,
    { warnWhenMissing: false },
  );
  if (
    bodyDepthMm !== null && noDoorDepthMm !== null &&
    Number.isFinite(bodyDepthMm) && Number.isFinite(noDoorDepthMm) &&
    noDoorDepthMm > bodyDepthMm
  ) {
    issues.push(
      error('body.depthExcludingDoorMm', VALIDATION.depthExcludingDoorTooLarge(bodyDepthMm, noDoorDepthMm)),
    );
  }

  checkNonNegativeSpec('door.depthAt90Mm', FIELD_LABEL.depthAt90, product.door.depthAt90Mm, issues);
  checkNonNegativeSpec(
    'door.maxOpenOverallWidthMm',
    FIELD_LABEL.maxOpenOverallWidth,
    product.door.maxOpenOverallWidthMm,
    issues,
  );
  checkNonNegativeSpec(
    'door.requiredSideClearanceMm',
    FIELD_LABEL.doorSideClearance,
    product.door.requiredSideClearanceMm,
    issues,
  );

  // Data honesty: a non-mock record must say where it came from.
  if (product.source.dataStatus !== 'mock' && !product.source.sourceUrl && !product.source.documentName) {
    issues.push(error('source', VALIDATION.sourceRequired));
  }

  return issues;
}

export function hasErrors(issues: ValidationIssue[]): boolean {
  return issues.some((issue) => issue.severity === 'error');
}

/** Validate the user's measurements against the measurement definitions. */
export function validateSpace(space: InstallationSpace): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const definition of MEASUREMENT_DEFINITIONS) {
    const value = space[definition.field];
    if (!Number.isFinite(value)) {
      issues.push(error(definition.field, VALIDATION.measurementNotNumber(definition.label)));
      continue;
    }
    if (value < definition.minMm) {
      issues.push(
        error(definition.field, VALIDATION.measurementTooSmall(definition.label, definition.minMm, value)),
      );
    } else if (value > definition.maxMm) {
      issues.push(
        error(definition.field, VALIDATION.measurementTooLarge(definition.label, definition.maxMm, value)),
      );
    }
  }

  return issues;
}

/**
 * Turn raw input into a value that is always safe for the 3D scene.
 * A non-numeric entry keeps the previous value; anything else is clamped into
 * the measurement's plausible range, so geometry can never receive NaN.
 */
export function sanitizeMeasurement(
  field: MeasurementField,
  rawValue: number,
  previousValue: number,
): number {
  const definition = measurementByField(field);
  if (!Number.isFinite(rawValue)) return previousValue;
  return Math.min(Math.max(rawValue, definition.minMm), definition.maxMm);
}

/** Keep an arbitrary number finite and inside a range (sliders, offsets, margins). */
export function sanitizeNumber(rawValue: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(rawValue)) return fallback;
  return Math.min(Math.max(rawValue, min), max);
}

/** True when the product can be used for geometry at all. */
export function isProductUsable(product: Product): boolean {
  return (
    !hasErrors(validateProduct(product)) &&
    hasValue(product.body.widthMm) &&
    hasValue(product.body.heightMm) &&
    hasValue(product.body.depthMm)
  );
}
