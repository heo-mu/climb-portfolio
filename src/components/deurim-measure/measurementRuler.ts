export interface RulerTick {
  valueMm: number;
  fraction: number;
  level: 'major' | 'medium' | 'minor';
  label: boolean;
}

/** Presentation density only; domain limits and measurement precision stay intact. */
export function measurementRulerTicks(minMm: number, maxMm: number, widthPx: number): RulerTick[] {
  const range = maxMm - minMm;
  if (!(range > 0) || !(widthPx > 0)) return [];
  const desiredMajor = range / Math.max(1, widthPx / 72);
  const power = 10 ** Math.floor(Math.log10(desiredMajor));
  const major = ([1, 2, 5, 10].find(n => n * power >= desiredMajor) ?? 10) * power;
  // Keep a continuous ruler rhythm independently of the sparse numeric labels.
  // Choose the subdivision nearest 8 CSS px, never compressing ticks below 6px.
  const subdivisions = [10, 20, 50].filter(count => major / count / range * widthPx >= 6);
  const subdivision = subdivisions.reduce((best, count) =>
    Math.abs(major / count / range * widthPx - 8) < Math.abs(major / best / range * widthPx - 8) ? count : best, subdivisions[0] ?? 10);
  const minor = major / subdivision;
  const values = new Set([minMm, maxMm]);
  for (let value = Math.ceil(minMm / minor) * minor; value < maxMm; value += minor) values.add(value);
  return [...values].sort((a, b) => a - b).map(valueMm => {
    const endpoint = valueMm === minMm || valueMm === maxMm;
    const fraction = (valueMm - minMm) / range;
    const isMajor = valueMm % major === 0;
    return {
      valueMm, fraction,
      level: endpoint || isMajor ? 'major' : Math.round(valueMm / minor) % 5 === 0 ? 'medium' : 'minor',
      // End labels are always present; avoid crowding them with a nearby major.
      label: endpoint || (isMajor && Math.min(fraction, 1 - fraction) * widthPx >= 36),
    };
  });
}
