/**
 * Helpers for reading `SpecValue` fields off a `Product`.
 *
 * A `SpecValue` bundles a number with its provenance, so nearly every read
 * needs the same two questions answered: "is there a value at all?" and "how
 * much can it be trusted?". These helpers keep that out of the calculation and
 * rendering code.
 */
import type { DataStatus, Product, SpecSource, SpecValue, VisualColor, VisualValue } from '../types/product';

/** Preserve the mechanical fact; only an explicitly official installation angle
 * may substitute as the supported simulation limit when that fact is missing. */
export function doorOpeningSpec(door: { maxAngleDeg: SpecValue; supportedOpeningAngleDeg?: SpecValue }): SpecValue {
  if (isManufacturerBacked(door.maxAngleDeg)) return door.maxAngleDeg;
  const supported = door.supportedOpeningAngleDeg;
  return supported?.status === 'official' && supported.value !== null && !!supported.source?.sourceUrl
    ? supported : door.maxAngleDeg;
}

/** Build a spec value. */
export function spec(value: number | null, status: DataStatus, note?: string): SpecValue {
  return note === undefined ? { value, status } : { value, status, note };
}

/** Build a value published by the manufacturer, with its own source attached. */
export function officialSpec(value: number | null, source: SpecSource, note?: string): SpecValue {
  return { value, status: 'official', source, ...(note === undefined ? {} : { note }) };
}

/** Build a value calculated from official manufacturer figures. */
export function derivedSpec(value: number | null, source: SpecSource, note: string): SpecValue {
  return { value, status: 'derived', source, note };
}

/**
 * Build a cosmetic number for the 3D model.
 * `VisualValue` is intentionally not assignable to `SpecValue`, so the compiler
 * prevents one of these from reaching a fit, clearance or collision rule.
 */
export function visualValue(value: number, note?: string): VisualValue {
  return { value, status: 'visualApproximation', ...(note === undefined ? {} : { note }) };
}

/** Build a cosmetic colour for the 3D model. */
export function visualColor(hex: string, note?: string): VisualColor {
  return { hex, status: 'visualApproximation', ...(note === undefined ? {} : { note }) };
}

/** Read a cosmetic number, with a fallback for products that omit it. */
export function visualOr(source: VisualValue | undefined, fallback: number): number {
  return source?.value ?? fallback;
}

/** Read a cosmetic colour, with a fallback for products that omit it. */
export function visualColorOr(source: VisualColor | undefined, fallback: string): string {
  return source?.hex ?? fallback;
}

/** Build a mock spec value - the only kind used by the PoC catalogue. */
export function mockSpec(value: number | null, note?: string): SpecValue {
  return spec(value, 'mock', note);
}

/** Build an explicitly missing spec value. */
export function missingSpec(status: DataStatus, note?: string): SpecValue {
  return spec(null, status, note);
}

/** True when the value can be used in a calculation. */
export function hasValue(source: SpecValue): boolean {
  return source.value !== null && Number.isFinite(source.value);
}

/** The number, or `null` when it is missing or not finite. */
export function valueOf(source: SpecValue): number | null {
  return hasValue(source) ? (source.value as number) : null;
}

/**
 * The lowest trust level among the given values, using the order
 * official > derived > estimated > mock. Used so a check that combines several
 * specification values reports the weakest source it relied on.
 */
const TRUST_ORDER: DataStatus[] = ['official', 'derived', 'estimated', 'mock'];

export function weakestStatus(...sources: SpecValue[]): DataStatus | null {
  let weakest: DataStatus | null = null;
  for (const source of sources) {
    const rank = TRUST_ORDER.indexOf(source.status);
    if (weakest === null || rank > TRUST_ORDER.indexOf(weakest)) weakest = source.status;
  }
  return weakest;
}

/** Human readable product label, e.g. "Mock Product A (French)". */
export function productDisplayName(product: Product): string {
  const { brand, modelName, modelCode } = product.identity;
  const base = `${brand} ${modelName}`.trim();
  return modelCode ? `${base} [${modelCode}]` : base;
}

/** The source recorded for one value, falling back to the record-level source. */
export function sourceOf(product: Product, value: SpecValue): SpecSource | null {
  if (value.source) return value.source;
  if (product.source.documentName) {
    return {
      documentName: product.source.documentName,
      ...(product.source.sourceUrl ? { sourceUrl: product.source.sourceUrl } : {}),
    };
  }
  return null;
}

/**
 * True when the value is published by the manufacturer, i.e. good enough to
 * decide a definitive installability verdict on its own.
 * `derived` counts because it is arithmetic on official figures;
 * `estimated` and `mock` do not.
 */
export function isManufacturerBacked(value: SpecValue): boolean {
  return hasValue(value) && (value.status === 'official' || value.status === 'derived');
}

/** Verdict input, not geometry input. Mock authority exists only on the QA bench. */
export function verdictValueOf(product: Product, value: SpecValue): number | null {
  return isManufacturerBacked(value) || (product.category === 'mock' && value.status === 'mock')
    ? valueOf(value)
    : null;
}

/** True when the product has everything needed to build the cabinet box. */
export function hasBodyGeometry(product: Product): boolean {
  return hasValue(product.body.widthMm) && hasValue(product.body.heightMm) && hasValue(product.body.depthMm);
}
