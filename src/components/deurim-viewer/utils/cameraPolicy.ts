/**
 * CAMERA POLICY (F-037).
 *
 * This is not a free 3D viewer. Every camera state it allows has to earn its
 * place by answering one of the questions the service exists for:
 *
 *   무엇을 재고 있는가        the dimension being entered, in the room
 *   어디가 부족한가           the gap, and which side it is on
 *   제품과 공간의 관계        the appliance standing in the space
 *   왜 이 결과가 나왔는가     the requirement against what is there
 *
 * WHAT WAS WRONG
 *
 * The framing came from the PRODUCT's own span at 2.2x, so the appliance filled
 * the frame and the thing being judged - the space around it - was cropped
 * away. The distance limits (0.6 to 18 scene units, a 30x range) allowed a
 * close-up of a door panel and a view from across an imaginary street, neither
 * of which tells anyone whether a refrigerator fits.
 *
 * WHAT REPLACED IT
 *
 * Framing is derived from the INSTALLATION SPACE together with the product, not
 * from the product alone, and the limits are expressed as multiples of that
 * same subject. So the policy holds for a 600 mm appliance in a galley kitchen
 * and for a 1200 mm one in an open wall, with no per-SKU numbers anywhere.
 *
 * Pure TypeScript: no React, no Three.js. Millimetres in, millimetres out.
 */
import type { BoxMm } from '../types/geometry';
import type { InstallationSpace } from '../types/space';

/** What the camera is looking at, in millimetres. */
export interface CameraSubject {
  /** Centre of the framed volume. */
  centerMm: { x: number; y: number; z: number };
  /** The volume's extent, used to derive every distance. */
  sizeMm: { x: number; y: number; z: number };
}

export interface CameraPose {
  targetMm: { x: number; y: number; z: number };
  positionMm: { x: number; y: number; z: number };
}

/**
 * Front-facing, with a restrained amount of height to keep the floor and side
 * gaps legible without turning the view into a plan shot.
 *
 * High enough to read the floor and the gaps at the sides, low enough that the
 * product still reads as something standing in a room rather than a plan view.
 */
const DIRECTION = { x: 0, y: 0.18, z: 1 };

/**
 * The camera's vertical field of view, in degrees.
 *
 * Lives here rather than only in the Canvas because every distance in this
 * policy is derived from it. If the two disagreed the framing would be wrong by
 * exactly that difference.
 */
export const CAMERA_FOV_DEG = 40;

/**
 * Breathing room around the framed subject at the default view.
 *
 * 1.28 leaves the appliance clear of the two panels without stranding it in
 * empty floor. The panels take roughly the outer fifth of the width each, and
 * the vertical extent is what actually binds at this aspect ratio.
 */
const DEFAULT_MARGIN = 1.28;

/**
 * NEAR LIMIT - "closer than this tells you nothing new".
 *
 * 0.45 of the default framing still holds the appliance and the gap beside it
 * together. Closer than that and it is a door panel: the texture gets bigger,
 * the installation question does not get clearer.
 */
const MIN_DISTANCE_FACTOR = 0.45;

/**
 * FAR LIMIT - "further than this and the gaps stop being legible".
 *
 * 1.9x the default framing. Beyond it a 50 mm clearance is a couple of pixels
 * and the scene is a small object in an empty field, which is viewer behaviour
 * rather than product behaviour.
 */
const MAX_DISTANCE_FACTOR = 1.9;

/**
 * Vertical orbit limits.
 *
 * `maxPolarAngle` is exactly horizontal, and that is deliberate: at 90 degrees
 * the camera sits at the height of its target, which is always above the floor,
 * so the limit holds at every zoom distance. A larger angle would be safe when
 * zoomed in and underground when zoomed out.
 */
export const ORBIT_MIN_POLAR_ANGLE = 0.35;
export const ORBIT_MAX_POLAR_ANGLE = Math.PI / 2;

/**
 * THE SUBJECT: the appliance together with the space it has to fit in.
 *
 * Framing the product alone was the original mistake - it produced a handsome
 * product shot that answered none of the service's questions. The union of the
 * two is what a shopper is actually judging.
 */
export function cameraSubject(space: InstallationSpace, productBody: BoxMm | null): CameraSubject {
  if (productBody === null) {
    return {
      centerMm: { x: 0, y: space.heightMm / 2, z: space.depthMm / 2 },
      sizeMm: { x: space.widthMm, y: space.heightMm, z: space.depthMm },
    };
  }

  // The union of the product and the opening, in each axis.
  const halfWidth = Math.max(space.widthMm / 2, Math.abs(productBody.center.x) + productBody.size.x / 2);
  const height = Math.max(space.heightMm, productBody.size.y);
  const depth = Math.max(space.depthMm, productBody.center.z + productBody.size.z / 2);

  return {
    centerMm: {
      x: 0,
      // Slightly below the true mid-height: the floor line and the side gaps
      // are near the bottom of the subject and matter more than the ceiling.
      y: height * 0.46,
      z: depth / 2,
    },
    sizeMm: { x: halfWidth * 2, y: height, z: depth },
  };
}

/** The span every distance in this policy is a multiple of. */
export function subjectSpanMm(subject: CameraSubject): number {
  return Math.max(subject.sizeMm.x, subject.sizeMm.y);
}

/**
 * The radius of the sphere that contains the whole subject.
 *
 * DEPTH MATTERS, which is what a span-based distance missed: the appliance's
 * front face is most of a metre nearer the camera than the subject's centre, so
 * framing on the centre distance cropped the product top and bottom. Fitting a
 * sphere handles every axis at once and cannot be caught out by a deep space or
 * an oblique view.
 */
function boundingRadiusMm(subject: CameraSubject): number {
  return (
    0.5 *
    Math.hypot(subject.sizeMm.x, subject.sizeMm.y, subject.sizeMm.z)
  );
}

/**
 * The distance at which the whole subject fits the vertical field of view.
 *
 * The standard fit: d = r / sin(fov / 2).
 */
export function defaultDistanceMm(subject: CameraSubject): number {
  const halfFov = (CAMERA_FOV_DEG / 2) * (Math.PI / 180);
  return (boundingRadiusMm(subject) / Math.sin(halfFov)) * DEFAULT_MARGIN;
}

export function minDistanceMm(subject: CameraSubject): number {
  return defaultDistanceMm(subject) * MIN_DISTANCE_FACTOR;
}

export function maxDistanceMm(subject: CameraSubject): number {
  return defaultDistanceMm(subject) * MAX_DISTANCE_FACTOR;
}

/** The default pose: the whole subject, from the centred front. */
export function defaultPose(subject: CameraSubject): CameraPose {
  return poseFrom(subject.centerMm, DIRECTION, defaultDistanceMm(subject));
}

/**
 * A pose looking at one region - a shortage volume, say - without leaving the
 * limits a shopper could have reached by dragging.
 *
 * The distance is clamped into the policy's own range, so focusing an issue can
 * never put the camera somewhere orbiting cannot get back from.
 */
export function focusPoseFor(
  subject: CameraSubject,
  regionCenterMm: { x: number; y: number; z: number },
  regionSizeMm: { x: number; y: number; z: number },
  approach: { x: number; y: number; z: number },
): CameraPose {
  const regionSpan = Math.max(regionSizeMm.x, regionSizeMm.y, regionSizeMm.z);
  // Never tighter than the near limit: a 6 mm gap must not pull the camera into
  // the cabinet. The gap is made legible by getting close to the LIMIT, not by
  // framing the gap itself.
  const distance = clamp(
    Math.max(regionSpan * 2.4, minDistanceMm(subject)),
    minDistanceMm(subject),
    maxDistanceMm(subject),
  );
  return poseFrom(regionCenterMm, withinPolarLimits(approach), distance);
}

/**
 * Pulls an approach direction inside the orbit limits.
 *
 * Clamping the DIRECTION rather than the resulting position keeps the framing
 * the caller asked for while guaranteeing the camera lands somewhere the
 * shopper could have orbited to themselves.
 */
export function withinPolarLimits(direction: { x: number; y: number; z: number }) {
  const length = Math.hypot(direction.x, direction.y, direction.z);
  if (length === 0) return direction;
  const polar = Math.acos(direction.y / length);
  const clamped = clamp(polar, ORBIT_MIN_POLAR_ANGLE, ORBIT_MAX_POLAR_ANGLE);
  if (clamped === polar) return direction;

  const horizontal = Math.hypot(direction.x, direction.z);
  if (horizontal === 0) {
    return { x: 0, y: Math.cos(clamped) * length, z: Math.sin(clamped) * length };
  }
  const scale = (Math.sin(clamped) * length) / horizontal;
  return { x: direction.x * scale, y: Math.cos(clamped) * length, z: direction.z * scale };
}

function poseFrom(
  targetMm: { x: number; y: number; z: number },
  direction: { x: number; y: number; z: number },
  distanceMm: number,
): CameraPose {
  const length = Math.hypot(direction.x, direction.y, direction.z);
  return {
    targetMm: { ...targetMm },
    positionMm: {
      x: targetMm.x + (direction.x / length) * distanceMm,
      y: targetMm.y + (direction.y / length) * distanceMm,
      z: targetMm.z + (direction.z / length) * distanceMm,
    },
  };
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

/**
 * PAN IS OFF IN THE SHOPPER FLOW.
 *
 * Panning moves the target, which is the one thing the distance and polar
 * limits are anchored to - so with pan enabled a shopper can slide the whole
 * scene behind a panel or off the edge, and every other limit becomes
 * meaningless. It also serves no task here: the subject is always the appliance
 * in its space, and the camera is already framed on exactly that.
 *
 * The QA bench keeps it, because inspecting geometry genuinely needs it.
 */
export const CONSUMER_PAN_ENABLED = false;
