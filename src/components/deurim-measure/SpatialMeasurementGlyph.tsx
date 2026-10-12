import type { MeasurementAxis } from './measurementAxis';
import { ApplianceBody, Span } from './applianceDrawing';
import { FBL, FBR, BBR, FTL, CAP_HALF_ROW, type Point } from './applianceGeometry';
export type { MeasurementAxis };
const SPANS: Record<MeasurementAxis, { from: Point; to: Point; anchors: readonly [Point, Point] }> = {
  width: { from: [16,36], to: [30,38], anchors: [FBL,FBR] },
  height: { from: [11,31], to: [11,5], anchors: [FBL,FTL] },
  depth: { from: [34,35], to: [43,30], anchors: [FBR,BBR] },
};
/** The unmeasured installation space: an open alcove, floor footprint and
 * one shared appliance. This is a measuring invitation, never a fit verdict. */
function EmptySpace() {
  return <>
    <path className="ds-glyph__room-floor" d="M12 37L43 42L59 33L28 28Z" />
    <path className="ds-glyph__room-back" d="M28 28V2L59 7V33Z" />
    <path className="ds-glyph__room-side" d="M12 37V11L28 2V28Z" />
    <path className="ds-glyph__room-rim" d="M12 37V11L43 16L59 7M43 16V42" />
    <path className="ds-glyph__footprint" d="M20 36L40 39L52 32L32 29Z" />
    <g transform="translate(6 5)"><ApplianceBody /></g>
    <Span from={[12,42]} to={[43,47]} anchors={[[12,38],[43,43]]} />
    <Span from={[7,37]} to={[7,11]} anchors={[[11,37],[11,11]]} />
    <Span from={[47,44]} to={[63,35]} anchors={[[44,42],[60,33]]} />
  </>;
}
export function SpatialMeasurementGlyph({ axis }: {axis: MeasurementAxis | 'all'}) {
  const span = axis === 'all' ? null : SPANS[axis];
  return <svg viewBox={axis === 'all' ? '0 0 70 50' : '0 -2 56 43'}
    className="ds-measure__diagram ds-glyph" aria-hidden="true" fill="none">
    {span ? <><ApplianceBody /><Span {...span} capHalf={axis === 'all' ? undefined : CAP_HALF_ROW} /></> : <EmptySpace />}
  </svg>;
}
