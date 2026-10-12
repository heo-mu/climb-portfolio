/**
 * The only way an overlay volume gets drawn (F-023).
 *
 * A component says WHAT it is drawing (`kind`) and WHERE (`box`); the policy
 * decides the material, the depth behaviour, the side and the render order, and
 * insets the bounds so no face can land on a real surface.
 *
 * Nothing else in the app should build a translucent mesh over the product. If
 * a new overlay meaning is needed, add it to `overlayPolicy.ts` - not a new
 * `<meshStandardMaterial>` in a feature component.
 */
import * as THREE from 'three';
import type { BoxMm } from '../../types/geometry';
import { mmToSceneVec3 } from '../../utils/units';
import {
  OVERLAY_POLICY,
  drawnOverlayBox,
  isRenderableBox,
  type OverlayKind,
} from './overlayPolicy';

const SIDE = {
  front: THREE.FrontSide,
  back: THREE.BackSide,
  double: THREE.DoubleSide,
} as const;

interface OverlayVolumeProps {
  kind: OverlayKind;
  box: BoxMm;
  /**
   * Skip the inset or outset. Only for volumes that already stand in open
   * space and are bounded by nothing real - currently none, but the escape
   * hatch is explicit rather than implicit.
   */
  flush?: boolean;
  /**
   * Step back while another volume is being pointed at.
   *
   * The policy still decides HOW this kind is drawn; this only says how loudly.
   * It is a presentation state, never a change of meaning: a muted shortage is
   * still a shortage, and nothing about the verdict moves.
   */
  muted?: boolean;
}

/** How much of its opacity a volume keeps while something else has attention. */
const MUTED_OPACITY_FACTOR = 0.35;

export function OverlayVolume({ kind, box, flush = false, muted = false }: OverlayVolumeProps) {
  const policy = OVERLAY_POLICY[kind];
  const drawn = flush ? box : drawnOverlayBox(kind, box);

  // A degenerate or non-finite box is dropped rather than handed to Three.js,
  // where it would produce an invisible mesh with broken normals.
  if (!isRenderableBox(drawn)) return null;

  return (
    <mesh
      position={mmToSceneVec3(drawn.center.x, drawn.center.y, drawn.center.z)}
      renderOrder={policy.renderOrder}
    >
      <boxGeometry args={mmToSceneVec3(drawn.size.x, drawn.size.y, drawn.size.z)} />
      <meshBasicMaterial
        color={policy.color}
        transparent={policy.opacity < 1 || muted}
        opacity={muted ? policy.opacity * MUTED_OPACITY_FACTOR : policy.opacity}
        depthWrite={policy.depthWrite}
        depthTest={policy.depthTest}
        side={SIDE[policy.faces]}
        wireframe={policy.wireframe}
        toneMapped={false}
      />
    </mesh>
  );
}
