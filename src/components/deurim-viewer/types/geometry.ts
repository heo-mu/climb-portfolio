/**
 * Geometry description types.
 *
 * Everything here is expressed in MILLIMETRES and in the shared world frame:
 *   X = width   (0 = centre of the space, +X = right)
 *   Y = height  (0 = floor, +Y = up)
 *   Z = depth   (0 = inner face of the back wall, +Z = towards the viewer)
 *
 * `utils/layout.ts` is the only module that produces these values; the 3D
 * components and the collision code both consume them, so the picture on screen
 * and the numbers in the result panel can never drift apart.
 */
import type { DoorId, HingeSide } from './product';
import type { WallId } from './space';

/** A point / size triple in millimetres. */
export interface Vec3Mm {
  x: number;
  y: number;
  z: number;
}

/** An axis aligned box in millimetres. */
export interface BoxMm {
  center: Vec3Mm;
  size: Vec3Mm;
}

/**
 * An oriented bounding box footprint on the XZ (floor) plane.
 * The box is a vertical prism: `yMin`/`yMax` give its vertical extent.
 * `rotationY` is the Three.js style rotation around the +Y axis, in radians.
 */
export interface Obb2DMm {
  centerX: number;
  centerZ: number;
  /** Half size along the local U axis (door leaf length). */
  halfX: number;
  /** Half size along the local V axis (door leaf thickness). */
  halfZ: number;
  rotationY: number;
  yMin: number;
  yMax: number;
}

/** One procedurally generated door leaf. */
export interface DoorLayout {
  id: DoorId;
  /** Label used in the control panel and the result panel. */
  label: string;
  hingeSide: HingeSide;
  /** World X of the vertical hinge axis. */
  hingeXMm: number;
  /** World Z of the vertical hinge axis. */
  hingeZMm: number;
  /** Leaf length measured from the hinge axis. */
  widthMm: number;
  heightMm: number;
  thicknessMm: number;
  /** World Y of the bottom edge of the leaf. */
  baseYMm: number;
  /** Opening limit used by the sliders and by the safe-angle search. */
  maxAngleDeg: number;
  /** True when `maxAngleDeg` is a UI fallback rather than a product value. */
  maxAngleIsFallback: boolean;
}

/** A wall that participates in collision detection. */
export interface WallLayout {
  id: WallId;
  label: string;
  box: BoxMm;
}

/** Identifier of a required-clearance volume. */
export type ClearanceZoneId = 'left' | 'right' | 'rear';

export interface ClearanceZoneLayout {
  id: ClearanceZoneId;
  label: string;
  box: BoxMm;
}

/** Identifier of an Official Installation Envelope volume (F-018). */
export type OfficialEnvelopeId =
  | 'installationEnvelope'
  | 'doorClearanceEnvelope'
  | 'maxOpenWidthEnvelope';

/**
 * A volume that expresses a MANUFACTURER installation requirement in space.
 *
 * This is neither the visual model nor the validation geometry: it is the
 * published requirement drawn as a box, so a shopper can see how much room the
 * manufacturer is actually asking for. Only built from `official` / `derived`
 * values - see PROJECT_SPEC.md section 17.
 */
export interface OfficialEnvelopeVolume {
  id: OfficialEnvelopeId;
  label: string;
  box: BoxMm;
  /** Which official figures produced this volume, for the debug panel. */
  basis: string;
}

/** The alcove. Always available, because space input is always valid. */
export interface SpaceLayout {
  floor: BoxMm;
  backWall: BoxMm;
  /** Only the walls the user switched on. */
  sideWalls: WallLayout[];
}

/**
 * The appliance, as VALIDATION GEOMETRY. `null` on the parent when the body
 * dimensions are unusable.
 *
 * This is what fit, clearance and collision are computed against, and what the
 * visual model is drawn inside. The visual model may subdivide these boxes for
 * appearance, but it must never move them - see PROJECT_SPEC.md section 17.
 */
export interface ProductLayout {
  /** Full product envelope (W x H x D). Used for debug bounds and reference. */
  body: BoxMm;
  /**
   * The box actually rendered behind the doors: same as `body` but shortened by
   * one door thickness, so that body and closed door together fill exactly the
   * product depth without co-planar faces (z-fighting).
   */
  cabinetShell: BoxMm;
  /** Empty when the door layout cannot be generated from the product data. */
  doors: DoorLayout[];
  /** Only zones whose clearance requirement has a known value. */
  clearanceZones: ClearanceZoneLayout[];
  /**
   * Manufacturer installation requirements drawn as volumes. Empty when the
   * product publishes no official requirement (every mock product).
   */
  officialEnvelope: OfficialEnvelopeVolume[];
  /** Horizontal offset actually applied, after clamping to the space. */
  appliedOffsetXMm: number;
  /** Forward offset from the rear-most valid placement, after physical clamp. */
  appliedOffsetZMm: number;
}

/** Complete, ready-to-render description of one installation situation. */
export interface InstallationLayout {
  space: SpaceLayout;
  /** `null` when the product has no usable width / height / depth. */
  product: ProductLayout | null;
}
