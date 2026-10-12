/**
 * VALIDATION GEOMETRY, drawn (F-010).
 *
 * Shows the boxes that fit, clearance and collision are ACTUALLY computed
 * against - the product envelope, each door leaf's oriented box and each hinge
 * pivot. It is a debug overlay: it renders what the maths already used and can
 * never influence a result.
 *
 * Keeping this separate from `ProductVisualModel` is the point. The visual
 * model may be detailed and approximate; this layer is the plain truth the
 * engine works with. See PROJECT_SPEC.md section 17.
 */
import type { DoorLayout, ProductLayout } from '../types/geometry';
import { doorLocalCenterX, doorRotationY } from '../utils/layout';
import { mmToSceneUnit, mmToSceneVec3 } from '../utils/units';
import { MmBoxOutline } from './MmBox';

const BODY_OUTLINE_COLOR = '#111111';
const COLLISION_OUTLINE_COLOR = '#e02424';
const HINGE_MARKER_COLOR = '#ffb300';
const HINGE_MARKER_SIZE_MM = 60;
const HINGE_AXES_LENGTH_MM = 400;

function DoorValidationLeaf({ door, angleDeg }: { door: DoorLayout; angleDeg: number }) {
  const leafCenter = mmToSceneVec3(doorLocalCenterX(door), door.baseYMm + door.heightMm / 2, 0);
  const leafSize = mmToSceneVec3(door.widthMm, door.heightMm, door.thicknessMm);
  const markerSize = mmToSceneUnit(HINGE_MARKER_SIZE_MM);

  return (
    <group
      position={mmToSceneVec3(door.hingeXMm, 0, door.hingeZMm)}
      rotation={[0, doorRotationY(door, angleDeg), 0]}
    >
      {/* The exact oriented box that utils/collision.ts tests. */}
      <mesh position={leafCenter}>
        <boxGeometry args={leafSize} />
        <meshBasicMaterial color={COLLISION_OUTLINE_COLOR} wireframe depthWrite={false} />
      </mesh>
      {/* Hinge pivot marker plus its local axes, at the group origin. */}
      <mesh>
        <boxGeometry args={[markerSize, markerSize, markerSize]} />
        <meshBasicMaterial color={HINGE_MARKER_COLOR} />
      </mesh>
      <axesHelper args={[mmToSceneUnit(HINGE_AXES_LENGTH_MM)]} />
    </group>
  );
}

interface ValidationGeometry3DProps {
  layout: ProductLayout;
  doorAnglesDeg: Record<string, number>;
  visible: boolean;
}

export function ValidationGeometry3D({ layout, doorAnglesDeg, visible }: ValidationGeometry3DProps) {
  if (!visible) return null;

  return (
    <group>
      <MmBoxOutline box={layout.body} color={BODY_OUTLINE_COLOR} />
      {layout.doors.map((door) => (
        <DoorValidationLeaf key={door.id} door={door} angleDeg={doorAnglesDeg[door.id] ?? 0} />
      ))}
    </group>
  );
}
