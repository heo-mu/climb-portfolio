/**
 * Overlay rendering policy (F-023).
 *
 * WHY THIS EXISTS
 *
 * The product model itself renders cleanly. The flicker came back whenever a
 * requirement, clearance or shortage volume was drawn on top of it, because
 * each of those components invented its own material settings and, worse, its
 * own bounds - and those bounds kept landing exactly on a real surface. A
 * shortage volume that starts at the wall's inner face shares a plane with the
 * wall. A required-area box the size of the product shares six planes with the
 * product.
 *
 * Fixing that per component would leave the next product, and the next overlay,
 * to reintroduce it. So there are two rules, enforced here rather than
 * remembered:
 *
 *   1. AN OVERLAY NEVER SHARES A PLANE WITH REAL GEOMETRY.
 *      Every overlay volume is moved off its nominal bounds by
 *      `OVERLAY_SURFACE_INSET_MM`. This is a stated rendering policy applied
 *      uniformly by one function - not an epsilon sprinkled per model - and the
 *      label always states the true figure, never the inset one.
 *
 *      WHICH WAY IT MOVES DEPENDS ON WHAT THE VOLUME IS ABOUT. A volume in
 *      open air is pulled IN, off the wall or ceiling that bounds it. A volume
 *      that is about a part of the APPLIANCE - the section standing above the
 *      ceiling, the part hanging over a wall - is pushed OUT, because insetting
 *      it buries it a few millimetres under the product's own surfaces, where
 *      the only thing that reaches the screen is whatever leaks through the
 *      door seams and side panels. That is exactly how a height failure came
 *      to look like a stripe down the side of a cabinet rather than the top of
 *      it: correct volume, drawn inside solid geometry.
 *
 *   2. MATERIAL SETTINGS COME FROM THE SEMANTIC TYPE, NOT THE COMPONENT.
 *      Six overlay meanings, six presets. A component picks a meaning; it does
 *      not pick `depthWrite` or `side`.
 *
 * `polygonOffset` is deliberately not used. It hides a geometry problem rather
 * than fixing one, and it does not survive a new model.
 *
 * Pure TypeScript: no React, no Three.js imports.
 */
import type { BoxMm } from '../../types/geometry';

/**
 * How far an overlay volume is pulled back from its nominal bounds so that no
 * face can land on a product, wall, floor or ceiling surface.
 *
 * Large enough to beat depth-buffer precision at any camera distance this scene
 * allows, small enough to be invisible against a 195 mm shortfall.
 */
export const OVERLAY_SURFACE_INSET_MM = 4;

/** An overlay volume must stay visible even after the inset. */
export const OVERLAY_MIN_THICKNESS_MM = 8;

/**
 * What an overlay MEANS. The rendering follows from this, never the other way
 * round.
 *
 *   requirement  the room the manufacturer asks for - quiet, sits behind
 *   shortage     the part of it the space does not provide - the loud one
 *   overflow     the same fact seen from the other side: the part of the
 *                APPLIANCE that is past the boundary. Same red, because to a
 *                shopper it is the same problem - what differs is that this one
 *                contains solid product geometry, so it wraps it instead of
 *                sitting inside it.
 *   information  a fact, e.g. how far the appliance stands proud. Never red.
 *   measurement  dimension lines and their labels while a field has focus
 *   success      a passing area. Consumer mode barely uses this on purpose.
 *   debug        developer wireframes
 */
export type OverlayKind =
  | 'requirement'
  | 'shortage'
  | 'overflow'
  | 'information'
  | 'measurement'
  | 'success'
  | 'debug';

export interface OverlayRenderPolicy {
  color: string;
  opacity: number;
  /** `false` for every translucent overlay: they must not fight for depth. */
  depthWrite: boolean;
  /** Overlays are still occluded by the product, so this stays true. */
  depthTest: boolean;
  /**
   * `front` for a volume read from outside, `back` for one that ENCLOSES the
   * appliance so its near faces do not wash over it. `double` is a last resort
   * - it doubles the blend and was a contributor to the original artefacts.
   */
  faces: 'front' | 'back' | 'double';
  /** Ordering among translucent overlays only. Never used to mask a bug. */
  renderOrder: number;
  wireframe: boolean;
  /**
   * Which way the volume is moved off its nominal bounds.
   *
   *   inset   a volume bounded by real surfaces it must not touch - the wall
   *           beside it, the ceiling above it.
   *   outset  a volume that is ABOUT a solid it contains, so it has to sit
   *           outside that solid's surfaces to be seen at all.
   */
  surface: 'inset' | 'outset';
}

/**
 * Colours are the semantic tokens from the design system, restated here because
 * a Three.js material cannot read a CSS variable. The mapping is documented in
 * PROJECT_SPEC.md section 21.6 and must be changed in both places together.
 */
export const OVERLAY_POLICY: Record<OverlayKind, OverlayRenderPolicy> = {
  requirement: {
    color: '#2f6fe0',
    opacity: 0.08,
    depthWrite: false,
    depthTest: true,
    faces: 'back',
    renderOrder: 10,
    wireframe: false,
    surface: 'inset',
  },
  shortage: {
    color: '#cf3a2e',
    opacity: 0.3,
    depthWrite: false,
    depthTest: true,
    faces: 'front',
    renderOrder: 12,
    wireframe: false,
    surface: 'inset',
  },
  /*
   * The same red as `shortage` and deliberately so - one problem, one colour
   * (a second shade would be a legend to learn). What differs is geometric:
   * this one contains the appliance, so it is pushed out past the product's
   * surfaces and read from outside, which tints the offending section rather
   * than hiding under it.
   */
  overflow: {
    color: '#cf3a2e',
    opacity: 0.3,
    depthWrite: false,
    depthTest: true,
    faces: 'front',
    renderOrder: 12,
    wireframe: false,
    surface: 'outset',
  },
  information: {
    color: '#737d88',
    opacity: 0.22,
    depthWrite: false,
    depthTest: true,
    faces: 'front',
    renderOrder: 11,
    wireframe: false,
    surface: 'inset',
  },
  measurement: {
    /*
     * The interaction accent, and the only brand-family colour in this map.
     * It matches `--color-accent-strong` (--brand-700) so the volume in the
     * room and the label over it are one colour. `requirement` below keeps
     * its own blue on purpose: that one is validation grammar, paired with
     * the shortage red, and is not the brand.
     */
    color: '#3c5de2',
    opacity: 1,
    depthWrite: false,
    depthTest: true,
    faces: 'front',
    renderOrder: 14,
    wireframe: false,
    surface: 'inset',
  },
  success: {
    color: '#12855a',
    opacity: 0.14,
    depthWrite: false,
    depthTest: true,
    faces: 'back',
    renderOrder: 9,
    wireframe: false,
    surface: 'inset',
  },
  debug: {
    color: '#171b20',
    opacity: 1,
    depthWrite: false,
    depthTest: true,
    faces: 'front',
    renderOrder: 20,
    wireframe: true,
    surface: 'inset',
  },
};

/**
 * Pulls a volume back from every face so it cannot be coplanar with whatever
 * bounded it - a wall, the ceiling, the product, the floor.
 *
 * An axis is only inset when it has room to spare; a thin slab keeps its
 * thickness so a 30 mm shortfall stays a 30 mm shortfall on screen.
 */
export function insetOverlayBox(box: BoxMm, insetMm = OVERLAY_SURFACE_INSET_MM): BoxMm {
  const shrink = (sizeMm: number): number => {
    if (!Number.isFinite(sizeMm) || sizeMm <= 0) return sizeMm;

    // Take the full inset when there is room for it.
    const full = sizeMm - 2 * insetMm;
    if (full >= OVERLAY_MIN_THICKNESS_MM) return full;

    // Otherwise take as much as the minimum thickness allows...
    const partial = sizeMm - 2 * Math.max(0, (sizeMm - OVERLAY_MIN_THICKNESS_MM) / 2);
    if (partial < sizeMm) return partial;

    // ...and for a volume already at or below the minimum, still shrink, just
    // proportionally. Returning the size unchanged would leave the face exactly
    // where the wall is, which is the artefact this whole function exists to
    // prevent.
    return sizeMm * 0.6;
  };

  return {
    center: { ...box.center },
    size: { x: shrink(box.size.x), y: shrink(box.size.y), z: shrink(box.size.z) },
  };
}

/**
 * Pushes a volume OUT past every face, for a volume that is about a solid it
 * contains.
 *
 * The mirror of `insetOverlayBox` and the same constant, so there is one number
 * in this file and no per-product epsilon anywhere else: a volume either steps
 * back from the surfaces that bound it, or steps out past the surfaces it
 * wraps. Growing is unconditional - unlike the inset there is no thin-volume
 * case, because adding room can never collapse a box.
 */
export function outsetOverlayBox(box: BoxMm, outsetMm = OVERLAY_SURFACE_INSET_MM): BoxMm {
  const grow = (sizeMm: number): number =>
    Number.isFinite(sizeMm) && sizeMm > 0 ? sizeMm + 2 * outsetMm : sizeMm;
  return {
    center: { ...box.center },
    size: { x: grow(box.size.x), y: grow(box.size.y), z: grow(box.size.z) },
  };
}

/** How a kind's nominal bounds become its drawn bounds. */
export function drawnOverlayBox(kind: OverlayKind, box: BoxMm): BoxMm {
  return OVERLAY_POLICY[kind].surface === 'outset' ? outsetOverlayBox(box) : insetOverlayBox(box);
}

/**
 * Which meaning a missing volume is drawn with.
 *
 * One fact decides it - whether the appliance stands inside the volume - and it
 * is decided here rather than in the scene so the renderer and the checks read
 * the same rule instead of two copies that can drift.
 */
export function shortageOverlayKind(wrapsProduct: boolean): OverlayKind {
  return wrapsProduct ? 'overflow' : 'shortage';
}

/** True when two boxes share a face plane while overlapping on the other axes. */
export function sharesFacePlane(a: BoxMm, b: BoxMm, toleranceMm = 0.5): boolean {
  const axes = ['x', 'y', 'z'] as const;
  const bounds = (box: BoxMm, axis: (typeof axes)[number]) => {
    const half = box.size[axis] / 2;
    return [box.center[axis] - half, box.center[axis] + half] as const;
  };

  for (const axis of axes) {
    const others = axes.filter((other) => other !== axis);
    const overlapsOthers = others.every((other) => {
      const [aMin, aMax] = bounds(a, other);
      const [bMin, bMax] = bounds(b, other);
      return Math.min(aMax, bMax) - Math.max(aMin, bMin) > toleranceMm;
    });
    if (!overlapsOthers) continue;

    const [aMin, aMax] = bounds(a, axis);
    const [bMin, bMax] = bounds(b, axis);
    if (Math.min(aMax, bMax) - Math.max(aMin, bMin) <= toleranceMm) continue;
    if (Math.abs(aMin - bMin) < toleranceMm || Math.abs(aMax - bMax) < toleranceMm) return true;
  }
  return false;
}

/** True when a box is safe to hand to Three.js. */
export function isRenderableBox(box: BoxMm): boolean {
  const values = [
    box.center.x, box.center.y, box.center.z,
    box.size.x, box.size.y, box.size.z,
  ];
  if (!values.every(Number.isFinite)) return false;
  return box.size.x > 0 && box.size.y > 0 && box.size.z > 0;
}
