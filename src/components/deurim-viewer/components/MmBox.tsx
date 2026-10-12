/**
 * Small rendering helper: draws a `BoxMm` (millimetre box) as a Three.js mesh,
 * converting to scene units in exactly one place.
 *
 * Rendering note: the material is SINGLE-SIDED by default. Double-sided opaque
 * boxes render their interior faces too, which both wastes fill rate and gives
 * the depth buffer two candidate surfaces per pixel - a classic source of
 * flicker where geometry meets. Only genuinely see-through volumes that must
 * read from inside as well as outside (the alcove walls) opt into `doubleSide`.
 */
import * as THREE from 'three';
import type { BoxMm } from '../types/geometry';
import { mmToSceneVec3 } from '../utils/units';

interface MmBoxProps {
  box: BoxMm;
  color: string;
  opacity?: number;
  wireframe?: boolean;
  /** Turn off depth writing for see-through volumes such as clearance zones. */
  depthWrite?: boolean;
  /**
   * Which faces to draw.
   *   'front'  default; opaque solids and thin translucent slabs
   *   'double' translucent volumes the camera can be inside, e.g. alcove walls
   *   'back'   translucent volumes that ENCLOSE something: only the far faces
   *            are drawn, so the enclosed object is not washed over by a near
   *            face while the boundary is still readable
   */
  faces?: 'front' | 'back' | 'double';
  emissive?: string;
  emissiveIntensity?: number;
  renderOrder?: number;
}

export function MmBox({
  box,
  color,
  opacity = 1,
  wireframe = false,
  depthWrite = true,
  faces = 'front',
  emissive,
  emissiveIntensity = 0,
  renderOrder = 0,
}: MmBoxProps) {
  const transparent = opacity < 1;

  return (
    <mesh
      position={mmToSceneVec3(box.center.x, box.center.y, box.center.z)}
      renderOrder={renderOrder}
    >
      <boxGeometry args={mmToSceneVec3(box.size.x, box.size.y, box.size.z)} />
      <meshStandardMaterial
        color={color}
        transparent={transparent}
        opacity={opacity}
        wireframe={wireframe}
        depthWrite={depthWrite}
        side={faces === 'double' ? THREE.DoubleSide : faces === 'back' ? THREE.BackSide : THREE.FrontSide}
        emissive={emissive ?? '#000000'}
        emissiveIntensity={emissive ? emissiveIntensity : 0}
      />
    </mesh>
  );
}

/**
 * Wireframe outline of a box, used by debug mode only.
 *
 * Never draw this over a filled box of the SAME dimensions outside debug mode:
 * the lines land exactly on the filled surface and shimmer as the camera moves.
 */
export function MmBoxOutline({ box, color }: { box: BoxMm; color: string }) {
  return <MmBox box={box} color={color} wireframe depthWrite={false} />;
}
