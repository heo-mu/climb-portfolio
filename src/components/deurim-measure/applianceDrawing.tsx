import { useId } from 'react';
import { LEFT_X as L, RIGHT_X as R, TOP_Y as T, BOTTOM_Y as B, FRONT_DY as F,
  DEPTH_DX as DX, DEPTH_DY as DY, SEAM_Y as S, SHADOW_CX, SHADOW_CY,
  SHADOW_RX, SHADOW_RY, line, perpendicularCap, type Point } from './applianceGeometry';

/** Extension lines connect the shared dimension grammar to the object. */
export function Span({ from, to, capHalf, anchors }: {
  from: Point; to: Point; capHalf?: number; anchors?: readonly [Point, Point];
}) {
  const [cx,cy] = perpendicularCap(from,to,capHalf);
  return <g className="ds-glyph__span">
    {anchors && <g className="ds-glyph__extensions">
      <path d={line(anchors[0],from)} /><path d={line(anchors[1],to)} />
    </g>}
    <path d={line(from,to)} />
    <path d={line([from[0]-cx,from[1]-cy],[from[0]+cx,from[1]+cy])} />
    <path d={line([to[0]-cx,to[1]-cy],[to[0]+cx,to[1]+cy])} />
  </g>;
}
export function GroundShadow() {
  return <ellipse className="ds-glyph__shadow" cx={SHADOW_CX} cy={SHADOW_CY} rx={SHADOW_RX} ry={SHADOW_RY} />;
}

/** Satin white, lit from upper left. Instance-local gradient IDs prevent
 * collisions. Opaque stops occlude the room. The rounded silhouette, recessed
 * division and inset plinth are identical across every consumer surface. */
export function ApplianceBody() {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const front = `appliance-${id}-front`, side = `appliance-${id}-side`, top = `appliance-${id}-top`;
  return <>
    <defs>
      <linearGradient id={front} x1="0" y1="0" x2="1" y2="0.8" gradientUnits="objectBoundingBox">
        <stop stopColor="#FFFFFF" /><stop offset="0.52" stopColor="#F2F3F8" /><stop offset="1" stopColor="#E3E6F0" />
      </linearGradient>
      <linearGradient id={side} x1="0" y1="0" x2="1" y2="0.35" gradientUnits="objectBoundingBox">
        <stop stopColor="#D5D9E7" /><stop offset="0.65" stopColor="#E0E3EE" /><stop offset="1" stopColor="#C9CFDF" />
      </linearGradient>
      <linearGradient id={top} x1="0" y1="0" x2="0.8" y2="1" gradientUnits="objectBoundingBox">
        <stop stopColor="#F0F2F9" /><stop offset="1" stopColor="#FFFFFF" />
      </linearGradient>
    </defs>
    <GroundShadow />
    <path className="ds-glyph__plinth" d={`M${L+1} ${B-0.8}L${R} ${B+F-0.8}L${R+DX-1} ${B+F+DY-0.8}v1.5L${R} ${B+F+0.7}L${L+1} ${B+0.5}Z`} />
    <path className="ds-glyph__face ds-glyph__face--top" style={{fill:`url(#${top})`}}
      d={`M${L} ${T+0.6}Q${L} ${T} ${L+0.7} ${T-0.4}L${L+DX-0.5} ${T+DY+0.3}Q${L+DX} ${T+DY} ${L+DX+0.7} ${T+DY+0.1}L${R+DX-0.5} ${T+F+DY}Q${R+DX} ${T+F+DY} ${R+DX} ${T+F+DY+0.7}L${R} ${T+F+0.8}Z`} />
    <path className="ds-glyph__face ds-glyph__face--side" style={{fill:`url(#${side})`}}
      d={`M${R} ${T+F}L${R+DX} ${T+F+DY+0.4}V${B+F+DY-0.6}Q${R+DX} ${B+F+DY} ${R+DX-0.6} ${B+F+DY+0.3}L${R} ${B+F}Z`} />
    <path className="ds-glyph__face ds-glyph__face--front" style={{fill:`url(#${front})`}}
      d={`M${L+0.7} ${T}L${R-0.5} ${T+F-0.1}Q${R} ${T+F} ${R} ${T+F+0.7}V${B+F-0.6}Q${R} ${B+F} ${R-0.7} ${B+F-0.1}L${L+0.7} ${B+0.1}Q${L} ${B} ${L} ${B-0.7}V${T+0.7}Q${L} ${T} ${L+0.7} ${T}Z`} />
    <path className="ds-glyph__highlight" d={`M${L+0.8} ${T+0.7}L${R-0.7} ${T+F+0.6}V${B+F-0.8}`} />
    <path className="ds-glyph__seam" d={`M${L+0.3} ${S}L${R} ${S+F}L${R+DX-0.3} ${S+F+DY}`} />
    <path className="ds-glyph__seam-light" d={`M${L+0.4} ${S+0.7}L${R} ${S+F+0.7}L${R+DX-0.5} ${S+F+DY+0.7}`} />
    <path className="ds-glyph__handle" d={`M${R-2} ${T+F+6}v6M${R-2} ${S+F+2.3}v4.1`} />
  </>;
}
