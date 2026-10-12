/**
 * Layout builder - the single source of truth for scene geometry.
 *
 * Given a product, an installation space and a placement it returns every box
 * and door pose in millimetres. The React Three Fiber components, the clearance
 * calculation and the collision test all consume this same result, so what you
 * see on screen is exactly what is tested. No feature is allowed to work out a
 * position of its own.
 *
 * World frame (see PROJECT_SPEC.md section 7):
 *   X = width   0 = horizontal centre of the space, +X = right
 *   Y = height  0 = floor, +Y = up
 *   Z = depth   0 = inner face of the back wall, +Z = towards the viewer
 *
 * Placement rule: the refrigerator sits at `placement.offsetXMm` from the centre
 * of the space (clamped so it can never pass through a wall) and is pushed back
 * until its rear clearance is used up, i.e. its back face sits at
 * Z = rearClearanceMm.
 */
import type { DoorId, DoorType, HingeSide, Product } from '../types/product';
import type { InstallationSpace, ProductPlacement } from '../types/space';
import type {
  BoxMm,
  ClearanceZoneLayout,
  DoorLayout,
  InstallationLayout,
  Obb2DMm,
  OfficialEnvelopeVolume,
  ProductLayout,
  SpaceLayout,
} from '../types/geometry';
import { degToRad } from './units';
import { DOOR_LABEL } from '../locales/ko';
import { doorOpeningSpec, hasValue, isManufacturerBacked, valueOf } from './specValue';
import { hasManufacturerDoorOpening } from './productCapabilities';
import { DOOR_ANGLE_FALLBACK_MAX_DEG, isProductUsable } from './validation';
import { DOOR_TOPOLOGIES, supportsDoorSimulationTopology } from '../data/doorTopologies';
import { clampPlacement, depthPlacementRange } from './placement';

/** Thickness of every modelled wall slab. Visual + collision volume only. */
export const WALL_THICKNESS_MM = 100;
/** How far the floor slab extends past the space, for visual context. */
export const FLOOR_MARGIN_MM = 800;

/**
 * The floor is a SLAB, not a plane, and the walls run down INTO it.
 *
 * Until v0.9 the floor was a plane at y = 0 and every wall box had its bottom
 * face at exactly y = 0 as well - two faces on one plane, overlapping, which is
 * the textbook z-fight and is what made the wall/floor junction shimmer. The
 * fix is the same rule the product model already follows (PROJECT_SPEC.md
 * 18.2): solids that meet either OVERLAP so the buried face is never
 * rasterised, or are separated by a real gap.
 *
 * So the slab's top face is at y = 0 and each wall starts `WALL_FLOOR_OVERLAP_MM`
 * BELOW it. The wall's bottom face is then inside the slab, where nothing draws
 * it, and no two faces share a plane.
 */
export const FLOOR_THICKNESS_MM = 60;
export const WALL_FLOOR_OVERLAP_MM = 20;
/** Thickness of a procedurally generated door leaf. */
export const DOOR_THICKNESS_MM = 60;
/** Height of the flat floor marker used for the max-open-width envelope. */
export const MAX_OPEN_WIDTH_MARKER_HEIGHT_MM = 40;

function box(
  centerX: number,
  centerY: number,
  centerZ: number,
  sizeX: number,
  sizeY: number,
  sizeZ: number,
): BoxMm {
  return {
    center: { x: centerX, y: centerY, z: centerZ },
    size: { x: sizeX, y: sizeY, z: sizeZ },
  };
}

/**
 * How far the cabinet may be moved sideways before it touches a wall.
 * Returns 0 when the product is as wide as (or wider than) the space.
 */
export function productOffsetLimitMm(spaceWidthMm: number, productWidthMm: number): number {
  return Math.max(0, (spaceWidthMm - productWidthMm) / 2);
}

/** Clamp a raw offset into the range the space allows. */
export function clampProductOffsetXMm(
  offsetXMm: number,
  spaceWidthMm: number,
  productWidthMm: number,
): number {
  if (!Number.isFinite(offsetXMm)) return 0;
  const limit = productOffsetLimitMm(spaceWidthMm, productWidthMm);
  return Math.min(Math.max(offsetXMm, -limit), limit);
}

/** The alcove. Independent of the product, so it always exists. */
export function buildSpaceLayout(space: InstallationSpace): SpaceLayout {
  const halfSpaceWidth = space.widthMm / 2;

  const backWall = box(
    0,
    (space.heightMm - WALL_FLOOR_OVERLAP_MM) / 2,
    -WALL_THICKNESS_MM / 2,
    space.widthMm + 2 * WALL_THICKNESS_MM,
    space.heightMm + WALL_FLOOR_OVERLAP_MM,
    WALL_THICKNESS_MM,
  );

  const sideWalls: SpaceLayout['sideWalls'] = [];
  if (space.hasLeftWall) {
    sideWalls.push({
      id: 'leftWall',
      label: 'Left Wall',
      box: box(
        -halfSpaceWidth - WALL_THICKNESS_MM / 2,
        (space.heightMm - WALL_FLOOR_OVERLAP_MM) / 2,
        space.depthMm / 2,
        WALL_THICKNESS_MM,
        space.heightMm + WALL_FLOOR_OVERLAP_MM,
        space.depthMm,
      ),
    });
  }
  if (space.hasRightWall) {
    sideWalls.push({
      id: 'rightWall',
      label: 'Right Wall',
      box: box(
        halfSpaceWidth + WALL_THICKNESS_MM / 2,
        (space.heightMm - WALL_FLOOR_OVERLAP_MM) / 2,
        space.depthMm / 2,
        WALL_THICKNESS_MM,
        space.heightMm + WALL_FLOOR_OVERLAP_MM,
        space.depthMm,
      ),
    });
  }

  // The floor slab runs from just behind the back wall to well in front of the
  // opening, so an opened door always has visible ground underneath it.
  const floorBackZMm = -WALL_THICKNESS_MM;
  const floorFrontZMm = space.depthMm + FLOOR_MARGIN_MM;
  // A slab with its TOP face at y = 0, so nothing shares a plane with it.
  const floor = box(
    0,
    -FLOOR_THICKNESS_MM / 2,
    (floorBackZMm + floorFrontZMm) / 2,
    space.widthMm + 2 * (WALL_THICKNESS_MM + FLOOR_MARGIN_MM),
    FLOOR_THICKNESS_MM,
    floorFrontZMm - floorBackZMm,
  );

  return { floor, backWall, sideWalls };
}

/**
 * ONE LEAF'S OWN OPENING LIMIT.
 *
 * `single` / `french` / `sideBySide` / `fourDoor` say how many hinge columns
 * there are and where they sit. They do NOT say how far each one opens, and
 * Samsung RS84B508115 is the entry that makes the difference matter: its
 * official guide publishes 좌측 165도 · 우측 170도. So the ANGLE comes from the
 * record's per-leaf list when it has one, and from the whole-product figure
 * when it does not.
 */
interface LeafPlan {
  id: DoorId;
  hingeSide: HingeSide;
  maxAngleDeg: number;
  maxAngleIsFallback: boolean;
}

/**
 * Which leaves this product has, and how far each opens.
 *
 * The TOPOLOGY still comes from `door.type` alone, so a record cannot invent a
 * third leaf by listing one: `leaves` is read as a per-leaf ANGLE table keyed
 * by the leaf the type already implies. An entry the type does not have is
 * ignored, and a leaf the table does not mention falls back to the
 * whole-product figure. Neither can change how many doors are drawn or tested.
 */
function planLeaves(product: Product, doorType: DoorType): LeafPlan[] {
  // Stacked visual leaves do not imply hinge columns or a supported swing.
  // No default hinge, fallback angle or cosmetic panel dimension may create
  // collision geometry for this topology. A future swing builder needs its
  // own sourced hinge/leaf geometry contract before it can opt in.
  if (!supportsDoorSimulationTopology(doorType)) return [];
  if (product.category === 'real' && !hasManufacturerDoorOpening(product)) return [];
  if (doorType === 'frenchBottomDrawer' && !DOOR_TOPOLOGIES[doorType].leaves.every(({id}) => {
    const leaf = product.door.leaves?.find(entry => entry.id === id);
    return leaf?.hingeSide != null && isManufacturerBacked(doorOpeningSpec(leaf));
  })) return []; // Existing closed-only products must not acquire fallback hinges.
  const productMax = valueOf(doorOpeningSpec(product.door));
  const angleFor = (id: DoorId): { maxAngleDeg: number; maxAngleIsFallback: boolean } => {
    const leaf = product.door.leaves?.find((entry) => entry.id === id);
    const stated = leaf ? valueOf(doorOpeningSpec(leaf)) : null;
    const value = stated ?? productMax;
    return {
      maxAngleDeg: value ?? DOOR_ANGLE_FALLBACK_MAX_DEG,
      maxAngleIsFallback: value === null,
    };
  };

  return DOOR_TOPOLOGIES[doorType].leaves.flatMap(({ id, hingeSide }) => {
    const side = doorType === 'single' || doorType === 'topBottomHinged' ? product.door.leaves?.find(leaf => leaf.id === id)?.hingeSide ?? hingeSide : hingeSide;
    return side === null ? [] : [{ id, hingeSide: side, ...angleFor(id) }];
  });
}

interface DoorBuildInput {
  stacked: boolean;
  freezerOnTop: boolean;
  upperOnly: boolean;
  leaves: LeafPlan[];
  centerXMm: number;
  widthMm: number;
  heightMm: number;
  frontZMm: number;
}

/** Door leaves positioned against the cabinet the layout just placed. */
function buildDoors(input: DoorBuildInput): DoorLayout[] {
  const halfWidth = input.widthMm / 2;
  // Shared advisory split by compartment order, never an official split dimension.
  const lowerRatio = input.freezerOnTop ? 2 / 3 : 1 / 3;
  // The hinge axis is the vertical line through the centre of the leaf's outer
  // end face, so a closed leaf sits flush inside the cabinet depth envelope.
  const hingeZMm = input.frontZMm - DOOR_THICKNESS_MM / 2;

  const common = {
    heightMm: input.heightMm,
    thicknessMm: DOOR_THICKNESS_MM,
    baseYMm: 0,
    hingeZMm,
  };

  return input.leaves.map((leaf): DoorLayout => ({
    ...common,
    // Approximate 2:1 split, shared by renderer and advisory collision only.
    // This is not a manufacturer dimension or a verdict requirement.
    ...(input.stacked ? {
      baseYMm: leaf.id === 'upper' ? input.heightMm * lowerRatio : 0,
        heightMm: leaf.id === 'upper' ? input.heightMm - input.heightMm * lowerRatio : input.heightMm * lowerRatio,
    } : {}),
    ...(input.upperOnly ? { baseYMm: input.heightMm / 3, heightMm: input.heightMm * 2 / 3 } : {}),
    id: leaf.id,
    label: DOOR_LABEL[leaf.id],
    hingeSide: leaf.hingeSide,
    hingeXMm:
      leaf.hingeSide === 'left' ? input.centerXMm - halfWidth : input.centerXMm + halfWidth,
    // A single leaf spans the cabinet; a pair splits it. No maker in this
    // catalogue publishes where the split falls, so equal halves it stays.
    widthMm: input.stacked || input.leaves.length === 1 ? input.widthMm : halfWidth,
    maxAngleDeg: leaf.maxAngleDeg,
    maxAngleIsFallback: leaf.maxAngleIsFallback,
  }));
}

/**
 * Build the product geometry, or `null` when the record cannot support it
 * (a validation error, or a missing width / height / depth).
 */
export function buildProductLayout(
  product: Product,
  space: InstallationSpace,
  placement: ProductPlacement,
): ProductLayout | null {
  if (!isProductUsable(product)) return null;

  const widthMm = valueOf(product.body.widthMm) as number;
  const heightMm = valueOf(product.body.heightMm) as number;
  const depthMm = valueOf(product.body.depthMm) as number;
  // A missing rear clearance must not silently become a gap: the cabinet then
  // stands against the back wall and the rear check reports UNKNOWN.
  const rearClearanceMm = valueOf(product.installation.rearClearanceMm) ?? 0;

  const appliedOffsetXMm = clampProductOffsetXMm(placement.offsetXMm, space.widthMm, widthMm);
  const appliedOffsetZMm = clampPlacement(
    placement.offsetZMm ?? 0,
    depthPlacementRange(space.depthMm, depthMm, rearClearanceMm),
  );

  const bodyBackZMm = rearClearanceMm + appliedOffsetZMm;
  const bodyFrontZMm = bodyBackZMm + depthMm;
  const bodyCenterZMm = bodyBackZMm + depthMm / 2;

  const body = box(appliedOffsetXMm, heightMm / 2, bodyCenterZMm, widthMm, heightMm, depthMm);

  const shellDepthMm = Math.max(depthMm - DOOR_THICKNESS_MM, 1);
  const cabinetShell = box(
    appliedOffsetXMm,
    heightMm / 2,
    bodyBackZMm + shellDepthMm / 2,
    widthMm,
    heightMm,
    shellDepthMm,
  );

  const doors =
    product.door.type === null
      ? []
      : buildDoors({
          stacked: product.door.type === 'topBottomHinged',
          freezerOnTop: product.door.freezerPosition === 'top',
          upperOnly: product.door.type === 'frenchBottomDrawer',
          leaves: planLeaves(product, product.door.type),
          centerXMm: appliedOffsetXMm,
          widthMm,
          heightMm,
          frontZMm: product.body.depthExcludingHandlesMm
            ? bodyBackZMm + (valueOf(product.body.depthExcludingHandlesMm) ?? depthMm) : bodyFrontZMm,
        });

  const halfProductWidth = widthMm / 2;
  const clearanceZones: ClearanceZoneLayout[] = [];

  if (hasValue(product.installation.rearClearanceMm) && rearClearanceMm > 0) {
    clearanceZones.push({
      id: 'rear',
      label: 'Rear Clearance',
      box: box(appliedOffsetXMm, heightMm / 2, bodyBackZMm / 2, widthMm, heightMm, bodyBackZMm),
    });
  }

  const leftClearanceMm = valueOf(product.installation.leftClearanceMm);
  if (leftClearanceMm !== null && leftClearanceMm > 0) {
    clearanceZones.push({
      id: 'left',
      label: 'Left Clearance',
      box: box(
        appliedOffsetXMm - halfProductWidth - leftClearanceMm / 2,
        heightMm / 2,
        bodyCenterZMm,
        leftClearanceMm,
        heightMm,
        depthMm,
      ),
    });
  }

  const rightClearanceMm = valueOf(product.installation.rightClearanceMm);
  if (rightClearanceMm !== null && rightClearanceMm > 0) {
    clearanceZones.push({
      id: 'right',
      label: 'Right Clearance',
      box: box(
        appliedOffsetXMm + halfProductWidth + rightClearanceMm / 2,
        heightMm / 2,
        bodyCenterZMm,
        rightClearanceMm,
        heightMm,
        depthMm,
      ),
    });
  }

  return {
    body,
    cabinetShell,
    doors,
    clearanceZones,
    officialEnvelope: buildOfficialEnvelope(product, {
      centerXMm: appliedOffsetXMm,
      centerZMm: bodyCenterZMm,
      widthMm,
      heightMm,
      depthMm,
      rearClearanceMm: bodyBackZMm,
    }),
    appliedOffsetXMm,
    appliedOffsetZMm,
  };
}

interface EnvelopeBasis {
  centerXMm: number;
  centerZMm: number;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  rearClearanceMm: number;
}

/**
 * OFFICIAL INSTALLATION ENVELOPE (F-018).
 *
 * Draws the manufacturer's published installation requirements as volumes, so a
 * shopper can see how much room is actually being asked for. It is neither the
 * visual model nor the validation geometry.
 *
 * Only `official` / `derived` values are used. A product that publishes no such
 * figures (every mock product) gets an empty envelope rather than an invented
 * one.
 */
function buildOfficialEnvelope(product: Product, basis: EnvelopeBasis): OfficialEnvelopeVolume[] {
  const volumes: OfficialEnvelopeVolume[] = [];

  const leftBody = isManufacturerBacked(product.installation.leftClearanceMm)
    ? (valueOf(product.installation.leftClearanceMm) as number)
    : null;
  const rightBody = isManufacturerBacked(product.installation.rightClearanceMm)
    ? (valueOf(product.installation.rightClearanceMm) as number)
    : null;
  const rear = isManufacturerBacked(product.installation.rearClearanceMm)
    ? (valueOf(product.installation.rearClearanceMm) as number)
    : null;
  const requiredHeight = isManufacturerBacked(product.installation.requiredInstallationHeightMm)
    ? (valueOf(product.installation.requiredInstallationHeightMm) as number)
    : null;
  const doorSide = isManufacturerBacked(product.door.requiredSideClearanceMm)
    ? (valueOf(product.door.requiredSideClearanceMm) as number)
    : null;
  const maxOpenWidth = isManufacturerBacked(product.door.maxOpenOverallWidthMm)
    ? (valueOf(product.door.maxOpenOverallWidthMm) as number)
    : null;

  // 1. The total volume the cabinet plus its body clearances must occupy.
  if (leftBody !== null && rightBody !== null && rear !== null) {
    const envelopeWidthMm = basis.widthMm + leftBody + rightBody;
    const envelopeHeightMm = requiredHeight ?? basis.heightMm;
    const envelopeDepthMm = basis.depthMm + rear;
    volumes.push({
      id: 'installationEnvelope',
      label: 'Installation Envelope',
      basis: `body ${basis.widthMm} mm + side ${leftBody}/${rightBody} mm, height ${envelopeHeightMm} mm, depth ${basis.depthMm} + rear ${rear} mm`,
      box: box(
        // The clearances may be asymmetric, so the envelope is centred on the
        // midpoint of the required span, not on the cabinet.
        basis.centerXMm + (rightBody - leftBody) / 2,
        envelopeHeightMm / 2,
        basis.centerZMm - rear / 2,
        envelopeWidthMm,
        envelopeHeightMm,
        envelopeDepthMm,
      ),
    });
  }

  // 2. The side room the doors need in order to open.
  if (doorSide !== null) {
    const widthMm = basis.widthMm + 2 * doorSide;
    volumes.push({
      id: 'doorClearanceEnvelope',
      label: 'Door Clearance Envelope',
      basis: `body ${basis.widthMm} mm + ${doorSide} mm on each side`,
      box: box(
        basis.centerXMm,
        basis.heightMm / 2,
        basis.centerZMm,
        widthMm,
        basis.heightMm,
        basis.depthMm,
      ),
    });
  }

  // 3. The overall width swept with the doors fully open, as a floor footprint.
  if (maxOpenWidth !== null) {
    volumes.push({
      id: 'maxOpenWidthEnvelope',
      label: 'Max Door Open Width',
      basis: `${maxOpenWidth} mm overall width with the doors fully open`,
      box: box(
        basis.centerXMm,
        MAX_OPEN_WIDTH_MARKER_HEIGHT_MM / 2,
        basis.centerZMm,
        maxOpenWidth,
        MAX_OPEN_WIDTH_MARKER_HEIGHT_MM,
        basis.depthMm,
      ),
    });
  }

  return volumes;
}

export function buildLayout(
  product: Product,
  space: InstallationSpace,
  placement: ProductPlacement,
): InstallationLayout {
  return {
    space: buildSpaceLayout(space),
    product: buildProductLayout(product, space, placement),
  };
}


/**
 * Rotation applied to a door's hinge group, in radians around +Y.
 *
 * A left hinged leaf points towards +X when closed and must swing towards +Z
 * (towards the viewer) when opened, which is a NEGATIVE rotation around +Y.
 * A right hinged leaf is the mirror image, so it uses a positive rotation.
 */
export function doorRotationY(door: DoorLayout, angleDeg: number): number {
  const angleRad = degToRad(angleDeg);
  return door.hingeSide === 'left' ? -angleRad : angleRad;
}

/**
 * Local X offset of the leaf centre inside its hinge group.
 * The hinge group sits on the hinge axis, so the leaf is pushed half its length
 * away from that axis, towards the middle of the cabinet.
 */
export function doorLocalCenterX(door: DoorLayout): number {
  return door.hingeSide === 'left' ? door.widthMm / 2 : -door.widthMm / 2;
}

/**
 * Exact world-space oriented bounding box of a door leaf at a given angle.
 * This is the geometry that `utils/collision.ts` tests - it is derived from the
 * same numbers that position the mesh, not from a separate approximation.
 */
export function doorObbAt(door: DoorLayout, angleDeg: number): Obb2DMm {
  const rotationY = doorRotationY(door, angleDeg);
  const localX = doorLocalCenterX(door);
  const cos = Math.cos(rotationY);
  const sin = Math.sin(rotationY);

  return {
    centerX: door.hingeXMm + localX * cos,
    centerZ: door.hingeZMm - localX * sin,
    halfX: door.widthMm / 2,
    halfZ: door.thicknessMm / 2,
    rotationY,
    yMin: door.baseYMm,
    yMax: door.baseYMm + door.heightMm,
  };
}

/** Axis aligned box -> OBB with zero rotation, so walls and doors share one test. */
export function boxToObb(source: BoxMm): Obb2DMm {
  return {
    centerX: source.center.x,
    centerZ: source.center.z,
    halfX: source.size.x / 2,
    halfZ: source.size.z / 2,
    rotationY: 0,
    yMin: source.center.y - source.size.y / 2,
    yMax: source.center.y + source.size.y / 2,
  };
}

/**
 * Angular sweep of a door leaf, expressed the way `RingGeometry` wants it.
 *
 * Used ONLY by the door swing visualisation (F-014). Collision detection never
 * looks at this - it tests the door's oriented box directly.
 *
 * The ring is drawn in its local XY plane and laid flat with rotation.x = -90
 * degrees, which maps local +X to world +X and local +Y to world -Z. A left
 * hinged leaf therefore sweeps from local 0 backwards, and a right hinged leaf
 * sweeps forwards from local 180 degrees.
 */
export function doorSwingSweep(
  door: DoorLayout,
  angleDeg: number,
): { thetaStart: number; thetaLength: number; outerRadiusMm: number } {
  const angleRad = degToRad(Math.max(0, angleDeg));
  return door.hingeSide === 'left'
    ? { thetaStart: -angleRad, thetaLength: angleRad, outerRadiusMm: door.widthMm }
    : { thetaStart: Math.PI, thetaLength: angleRad, outerRadiusMm: door.widthMm };
}
