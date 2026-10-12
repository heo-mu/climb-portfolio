type IssueRegion = 'left' | 'right' | 'rear' | 'top' | 'front' | 'body';
type IssueKind = 'physicalFit' | 'requiredClearance' | 'doorClearance' | 'projection';
import { ApplianceBody, Span } from '../deurim-measure/applianceDrawing';
import { LEFT_X as L, RIGHT_X as R, TOP_Y as T, BOTTOM_Y as B, FRONT_DY as F,
  DEPTH_DX as DX, DEPTH_DY as DY, poly } from '../deurim-measure/applianceGeometry';

/** Schematics share the same oblique room as the product. These glyphs are
 * mounted only for definitive failures; they never calculate a verdict. */
export function SpatialIssueGlyph({ region, kind }: {region: IssueRegion; kind: IssueKind}) {
  const side = region === 'left' || region === 'right' ? region : null;
  const topClearance = region === 'top' && kind === 'requiredClearance';
  const ceiling = topClearance ? T - 7 : T + 5;
  const wall = side === 'left' ? 8 : 44;
  const face = side === 'left' ? L : R + DX;
  const door = !!side && kind === 'doorClearance';
  return <svg viewBox="0 0 56 47" className="ds-glyph ds-issue-glyph" aria-hidden="true" fill="none">
    <g transform="translate(0 8)">
      {side && <>
        <path className="ds-glyph__room-side" d={`M${wall-2} ${T-1}l5 -3v27l-5 3Z`} />
        <path className="ds-glyph__room-rim" d={`M${wall-2} ${T-1}v27`} />
      </>}
      {region === 'top' && <>
        <polygon className="ds-glyph__room-back" points={poly([8,ceiling],[37,ceiling+4],[46,ceiling-1],[17,ceiling-5])} />
        <path className="ds-glyph__room-rim" d={`M8 ${ceiling}L37 ${ceiling+4}L46 ${ceiling-1}`} />
      </>}
      {topClearance && <>
        <polygon className="ds-glyph__short" points={poly([L,ceiling+1],[R,ceiling+F+1],[R,T+F],[L,T])} />
        <Span from={[12,ceiling+1]} to={[12,T]} />
      </>}
      <ApplianceBody />
      {region === 'body' && <>
        <path className="ds-glyph__short" d={`M${L} ${T}l2 .3v26l-2 -.3ZM${R-2} ${T+F-.3}l2 .3v26l-2 -.3Z`} />
        <path className="ds-glyph__short" d={`M${L} ${T}l2 .3l${DX} ${DY}l-2 -.3ZM${R-2} ${T+F-.3}l2 .3l${DX} ${DY}l-2 -.3Z`} />
        <path className="ds-glyph__edge" d={`M${L+2} ${T-4}v5M${R-2} ${T+F-4}v5`} />
        <Span from={[L+2,B+4]} to={[R-2,B+F+4]} />
      </>}
      {region === 'top' && !topClearance && <>
        <polygon className="ds-glyph__short" points={poly([L,T],[R,T+F],[R,ceiling+F],[L,ceiling])} />
        <polygon className="ds-glyph__short" points={poly([L,T],[R,T+F],[R+DX,T+F+DY],[L+DX,T+DY])} />
        <path className="ds-glyph__edge" d={`M11 ${ceiling}L34 ${ceiling+3.3}`} />
      </>}
      {side && <>
        <polygon className="ds-glyph__short" points={poly([wall-1,T+3],[wall+1,T+3],[wall+1,B-1],[wall-1,B-1])} />
        <Span from={[Math.min(wall,face),B-1]} to={[Math.max(wall,face),B-1]} />
      </>}
      {door && <>
        <path className="ds-glyph__door-leaf" d={side === 'left'
          ? `M${L} ${T+3}l-6 4v17l6 -5Z`
          : `M${R} ${T+F+3}l7 4v17l-7 -5Z`} />
        <path className="ds-glyph__swing" d={side === 'left'
          ? `M${L+4} ${B-4}Q${L-1} ${B+5} ${L-7} ${B}m0 0l.5 -3m-.5 3l3 .7`
          : `M${R-4} ${B-2}Q${R+1} ${B+7} ${R+8} ${B+1}m0 0l-3 1m3 -1l-.5 -3`} />
      </>}
    </g>
  </svg>;
}
