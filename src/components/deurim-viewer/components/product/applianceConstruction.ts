/** Cosmetic subdivisions only. These boxes never enter layout or collision. */
import type { BoxMm } from '../../types/geometry';
import type { StaticPart, PartMaterial } from './bespoke4DoorParts';

export interface SurfacePart {
  box: BoxMm;
  material: PartMaterial;
  radiusMm?: number;
}

const bounds = (b: BoxMm) => ({
  x0: b.center.x - b.size.x / 2, x1: b.center.x + b.size.x / 2,
  y0: b.center.y - b.size.y / 2, y1: b.center.y + b.size.y / 2,
  z0: b.center.z - b.size.z / 2, z1: b.center.z + b.size.z / 2,
});
const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): BoxMm => ({
  center: { x: (x0+x1)/2, y: (y0+y1)/2, z: (z0+z1)/2 },
  size: { x: x1-x0, y: y1-y0, z: z1-z0 },
});

/** Open-backed moulded liner, inside the existing door-tub envelope.
 * A shallow recessed centre and four lips give an open leaf construction depth.
 * Rails tile; no two exposed faces overlap on one plane. */
export function doorLinerBoxes(tub: BoxMm): BoxMm[] {
  const b = bounds(tub);
  const rim = Math.min(12, tub.size.x / 8, tub.size.y / 8);
  const recess = Math.min(10, tub.size.z / 3);
  return [
    box(b.x0, b.x0+rim, b.y0, b.y1, b.z0, b.z1),
    box(b.x1-rim, b.x1, b.y0, b.y1, b.z0, b.z1),
    box(b.x0+rim, b.x1-rim, b.y0, b.y0+rim, b.z0, b.z1),
    box(b.x0+rim, b.x1-rim, b.y1-rim, b.y1, b.z0, b.z1),
    box(b.x0+rim, b.x1-rim, b.y0+rim, b.y1-rim, b.z0+recess, b.z1),
  ];
}

/** The builders describe the shell/cavity envelopes. Subdivide the former
 * solid cabinet into actual walls; the old interior envelope becomes empty air.
 * Shelves suggest depth, not manufacturer-specific storage or capacity. */
export function buildApplianceSurfaces(parts: StaticPart[], radiusMm: number): SurfacePart[] {
  const cabinet = parts.find(p => p.id === 'cabinet');
  const interior = parts.find(p => p.id === 'interior');
  if (!cabinet || !interior) return parts.map(p => ({...p, radiusMm: p.rounded ? radiusMm : 0}));
  const c = bounds(cabinet.box), i = bounds(interior.box);
  const result: SurfacePart[] = [];
  const add = (b: BoxMm, material: PartMaterial, radius = 0) => result.push({box: b, material, radiusMm: radius});
  // Five tiled shell walls, with a real cavity all the way back to the liner.
  add(box(c.x0,i.x0,c.y0,c.y1,c.z0,c.z1), 'cabinet', radiusMm);
  add(box(i.x1,c.x1,c.y0,c.y1,c.z0,c.z1), 'cabinet', radiusMm);
  add(box(i.x0,i.x1,i.y1,c.y1,c.z0,c.z1), 'cabinet', radiusMm);
  add(box(i.x0,i.x1,c.y0,i.y0,c.z0,c.z1), 'cabinet', radiusMm);
  add(box(i.x0,i.x1,i.y0,i.y1,c.z0,i.z0), 'interior');

  const mullion = parts.find(p => p.id === 'frameMullion');
  const m = mullion ? bounds(mullion.box) : null;
  const midrail = parts.find(p => p.id === 'frameMidRailLeft');
  const bottom = midrail ? bounds(midrail.box).y1 + 8 : i.y0 + 8;
  const top = i.y1 - 8;
  // Extend the existing division inward. Its visible front stays unchanged.
  if (m) add(box(m.x0,m.x1,i.y0,i.y1,i.z0+2,c.z1-2), 'interior');
  const shelfCount = parts.some(p => p.id.startsWith('storage-')) ? 0 : midrail ? 2 : 3;
  const columns = m ? [[i.x0+3,m.x0-3],[m.x1+3,i.x1-3]] : [[i.x0+3,i.x1-3]];
  for (const [x0,x1] of columns) {
    for (let n = 1; n <= shelfCount; n++) {
      const y = bottom + (top-bottom)*n/(shelfCount+1);
      add(box(x0,x1,y-3,y+3,i.z0+4,c.z1-22), 'doorTub');
    }
  }
  for (const p of parts) {
    if (p.id === 'cabinet' || p.id === 'interior') continue;
    if (p.material === 'doorTub' && !p.id.startsWith('storage-')) {
      doorLinerBoxes(p.box).forEach((b,index)=>add(b,p.material,index < 4 ? 1.5 : 0));
    } else {
      add(p.box,p.material,p.rounded ? radiusMm : p.material === 'handleBar' ? 2 : 0);
    }
  }
  return result;
}
