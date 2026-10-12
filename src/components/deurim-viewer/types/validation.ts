/** Validation issue types, produced by `utils/validation.ts`. */

/**
 * - `error`   the data is impossible (a negative width, an angle over 180 deg).
 *             Geometry and checks are NOT calculated while an error exists.
 * - `warning` the data is merely incomplete. Calculation continues and the
 *             affected checks report UNKNOWN.
 */
export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  /** Dotted path of the offending field, e.g. `body.widthMm`. */
  field: string;
  severity: ValidationSeverity;
  message: string;
}
