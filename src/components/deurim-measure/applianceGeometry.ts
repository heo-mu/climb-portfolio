/** Shared oblique perspective. Presentation coordinates, never product dimensions. */
export const LEFT_X = 16;
export const RIGHT_X = 30;
export const TOP_Y = 5;
export const BOTTOM_Y = 31;
export const FRONT_DY = 2;
export const DEPTH_DX = 9;
export const DEPTH_DY = -5;
export const SEAM_Y = 21;
export const FTL = [LEFT_X, TOP_Y] as const;
export const FTR = [RIGHT_X, TOP_Y + FRONT_DY] as const;
export const FBR = [RIGHT_X, BOTTOM_Y + FRONT_DY] as const;
export const FBL = [LEFT_X, BOTTOM_Y] as const;
export const BTL = [LEFT_X + DEPTH_DX, TOP_Y + DEPTH_DY] as const;
export const BTR = [RIGHT_X + DEPTH_DX, TOP_Y + FRONT_DY + DEPTH_DY] as const;
export const BBR = [RIGHT_X + DEPTH_DX, BOTTOM_Y + FRONT_DY + DEPTH_DY] as const;
export const SHADOW_CX = (LEFT_X + RIGHT_X + DEPTH_DX) / 2;
export const SHADOW_CY = BOTTOM_Y + FRONT_DY / 2 + DEPTH_DY / 2 + 2;
export const SHADOW_RX = 12;
export const SHADOW_RY = 3.1;
export type Point = readonly [number, number];
export const poly = (...points: ReadonlyArray<Point>) => points.map(([x,y]) => `${x},${y}`).join(' ');
export const line = (from: Point, to: Point) => `M${from[0]} ${from[1]}L${to[0]} ${to[1]}`;
export const CAP_HALF = 1.1;
export const CAP_HALF_ROW = 1.8;
export function perpendicularCap(from: Point, to: Point, half: number = CAP_HALF): Point {
  const dx = to[0]-from[0], dy = to[1]-from[1];
  const length = Math.hypot(dx,dy) || 1;
  return [-dy / length * half, dx / length * half];
}
