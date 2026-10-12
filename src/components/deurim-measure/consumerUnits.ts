/**
 * THE UNIT BOUNDARY between the engine and the shopper.
 *
 * Everything inside this service is MILLIMETRES and stays millimetres: the
 * official product data, `utils/layout.ts`, the collision test, the verdict,
 * the store's committed `InstallationSpace`, and the Three.js conversion in
 * `utils/units.ts`. Samsung publishes 912 mm; the record says 912; the
 * geometry is built from 912.
 *
 * A shopper does not measure a kitchen in millimetres. They measure it in
 * centimetres, so the consumer surface reads and writes CENTIMETRES - and this
 * module is the only place the two meet. Nothing else in the app may write
 * `/ 10` or `* 10`, for the same reason nothing may write `/ 1000` outside
 * `units.ts`: a conversion repeated in five components is five chances for
 * one of them to disagree.
 *
 * PRECISION IS NOT LOST. 1 mm is 0.1 cm exactly, so every published figure
 * survives the trip: 1853 mm reads 185.3 cm and comes back 1853.
 *
 * THE ENGINE ONLY EVER SEES WHOLE MILLIMETRES. `cmToMm` rounds, and the
 * reason is NOT the float error people expect: one decimal place times ten is
 * exact in IEEE 754 for every value this app can produce - 91.2, 185.3 and
 * 29.5 all land on 912, 1853 and 295 without help. What actually needs
 * catching is sub-millimetre INPUT. Nothing stops a shopper pasting "140.55",
 * and 1405.5 mm would put a fractional millimetre into geometry that is built
 * on whole ones. Rounding is where that stops, not where a phantom 0.0000001
 * is swept up.
 */

/** 1 cm == 10 mm. The only place this number appears. */
export const MM_PER_CM = 10;

/** Canonical millimetres -> centimetres, as a number. */
export function mmToCm(valueMm: number): number {
  return valueMm / MM_PER_CM;
}

/**
 * Centimetres -> canonical millimetres, as a WHOLE millimetre.
 *
 * The rounding is the point, not a tidy-up: it is what keeps the engine's
 * integer-millimetre invariant intact when the number arrived as a decimal
 * the shopper typed.
 */
export function cmToMm(valueCm: number): number {
  return Math.round(valueCm * MM_PER_CM);
}

/**
 * A length as a shopper reads it: centimetres, one decimal at most, and no
 * trailing zero.
 *
 *     1780 -> "178"      a whole centimetre needs no decimal
 *     1853 -> "185.3"    a published figure keeps its millimetre
 *      912 -> "91.2"
 *
 * `toFixed(1)` then `Number` is deliberate: it rounds to the tenth AND drops
 * a trailing `.0`, so "178.0 cm" can never reach the screen.
 */
export function formatCm(valueMm: number): string {
  return String(Number(mmToCm(valueMm).toFixed(1)));
}

/** The same, with the unit the whole consumer surface uses. */
export function formatCmWithUnit(valueMm: number): string {
  return `${formatCm(valueMm)}${CM_UNIT}`;
}

/**
 * The unit suffix, written once.
 *
 * No space before it. That is the grammar the panel already used for `mm`
 * and for `°`, and the point of fixing it here is that "9.4cm" and "9.4 cm"
 * can never end up on the same screen.
 */
export const CM_UNIT = 'cm';

/**
 * What a shopper typed, as canonical millimetres - or `null` if it is not a
 * number yet.
 *
 * `null` is not an error. "140." is a legal thing to have typed halfway
 * through "140.5", and so is "" and "-". The caller decides what to do about
 * it; this only answers "is there a number here yet".
 */
export function parseCmToMm(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;
  return cmToMm(parsed);
}

/**
 * Keystrokes kept, without parsing.
 *
 * The field strips everything that could not be part of a centimetre figure
 * and nothing else - it does NOT reformat, clamp or complete. "140." has to
 * survive keystroke by keystroke or a decimal can never be typed at all, so
 * a single leading dot and a single trailing dot are both legal drafts.
 */
export function keepCmDraftCharacters(text: string): string {
  const digitsAndDots = text.replace(/[^\d.]/g, '');
  const firstDot = digitsAndDots.indexOf('.');
  if (firstDot === -1) return digitsAndDots;
  // Everything after the first dot loses its dots; the first one stays put.
  return (
    digitsAndDots.slice(0, firstDot + 1) +
    digitsAndDots.slice(firstDot + 1).replace(/\./g, '')
  );
}
