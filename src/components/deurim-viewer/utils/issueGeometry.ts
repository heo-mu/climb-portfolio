/**
 * Failure geometry (F-020): turns a failed check into the volume that shows
 * WHERE the space falls short, and where to hang the "195mm 부족" label.
 *
 * This is PRESENTATION geometry. It reads the numbers the engine already
 * produced (`requiredMm`, `availableMm`, `shortageMm`) and the placement that
 * `utils/layout.ts` already decided. It never re-derives a position, never
 * changes a verdict, and nothing in the engine reads it back.
 *
 * THE ONE CONTRACT, AND WHY IT IS STATED IN SPACE RATHER THAN PER CHECK.
 *
 * A shortage volume is always the difference between what has to be there and
 * what the room actually provides, and there are exactly two ways that reads:
 *
 *   physicalFit        the APPLIANCE is past the boundary. The volume is the
 *                      part of the cabinet that sticks out beyond the wall or
 *                      the ceiling, so it contains solid product geometry and
 *                      is drawn as an `overflow` - a volume that wraps what it
 *                      is talking about (see `overlayPolicy.ts`).
 *   everything else    the ROOM is missing free space the maker asks for. The
 *                      volume is the part of the required clearance the space
 *                      does not provide, which stands in empty air (or inside
 *                      the wall), and is drawn as a `shortage`.
 *
 * Both are measured from the same two boundaries - the installation space and
 * the product/clearance envelope - so the extent along the axis that failed is
 * always exactly `check.shortageMm`, whatever the product shape or door
 * topology. There is no per-SKU offset, scale or direction anywhere here: a
 * side is taken from the door's own hinge in `utils/layout.ts`, and an
 * overflow direction from the product's own bounds against the space's.
 *
 * Pure TypeScript, millimetres only, no React and no Three.js.
 */
import type { BoxMm, ProductLayout, Vec3Mm } from '../types/geometry';
import type { Check } from '../types/result';
import type { InstallationSpace } from '../types/space';
import {
  consumerCopyFor,
  ISSUE_KIND_RANK,
  type IssueKind,
  type IssueRegion,
} from '../locales/consumer';

/**
 * One missing volume.
 *
 * A width overflow on a centred cabinet is genuinely two volumes - it hangs
 * over both walls - so an issue carries a list rather than a box. Nothing is
 * merged into one enclosing box: a box spanning both sides would cover the
 * appliance that DOES fit between them, which is the thing this must never
 * claim.
 */
export interface ShortageVolume {
  box: BoxMm;
  /**
   * True when the appliance itself stands inside this volume.
   *
   * Decided by geometry, not by hand: a volume that contains product geometry
   * cannot be drawn like one in open air - it has to wrap the part it is about
   * rather than sit buried a few millimetres under its surfaces, which is what
   * made a height failure appear as a stripe down one side of the cabinet.
   */
  wrapsProduct: boolean;
}

/** What the 3D shows for one failing check. */
export interface IssueHighlight {
  checkId: string;
  region: IssueRegion;
  /** What sort of problem it is, which decides how the scene draws it. */
  kind: IssueKind;
  /** Two or three words naming the problem, for the label in the scene. */
  sceneLabel: string;
  /** The volume the manufacturer asks for, drawn as a quiet outline. */
  requiredBox: BoxMm | null;
  /**
   * The parts of that volume the space does not provide - drawn loudly.
   * Empty when the failure cannot be pointed at in space.
   */
  shortageVolumes: ShortageVolume[];
  /**
   * Where the "Xmm 부족" label sits - THE REGION'S anchor, not this check's.
   *
   * It used to be the centre of this issue's own shortage box, which made it
   * a function of the shortage figure and of whether the kind spans the
   * installation envelope. Two checks describing the SAME ceiling therefore
   * anchored 41px apart on screen, and the collision layout then had to
   * displace one of them - so moving the pointer between the two result rows
   * flipped which one was displaced and slid the pair 34px. See
   * `buildIssueHighlights`.
   */
  labelAnchorMm: Vec3Mm;
  shortageMm: number;
  /**
   * The most consequential problem in its part of the room.
   *
   * Only this one's VOLUME is drawn while nothing is selected. Two translucent
   * slabs stacked above the same cabinet do not communicate two problems - they
   * communicate one confusing shape - so the secondary issues keep their labels
   * and lend their volume to whichever the shopper actually asks about.
   */
  primaryInRegion: boolean;
}

function box(
  x0: number, x1: number,
  y0: number, y1: number,
  z0: number, z1: number,
): BoxMm {
  return {
    center: { x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: (z0 + z1) / 2 },
    size: { x: Math.abs(x1 - x0), y: Math.abs(y1 - y0), z: Math.abs(z1 - z0) },
  };
}

const lowEdge = (source: BoxMm, axis: keyof Vec3Mm) => source.center[axis] - source.size[axis] / 2;
const highEdge = (source: BoxMm, axis: keyof Vec3Mm) => source.center[axis] + source.size[axis] / 2;

/** True when two boxes occupy the same volume, to within a tenth of a mm. */
function sameBox(a: BoxMm, b: BoxMm): boolean {
  const near = (x: number, y: number) => Math.abs(x - y) < 0.1;
  return (
    near(a.center.x, b.center.x) &&
    near(a.center.y, b.center.y) &&
    near(a.center.z, b.center.z) &&
    near(a.size.x, b.size.x) &&
    near(a.size.y, b.size.y) &&
    near(a.size.z, b.size.z)
  );
}

/** How much of the appliance stands inside a volume, per axis. */
function overlapsSolid(volume: BoxMm, body: BoxMm, toleranceMm = 1): boolean {
  const axes = ['x', 'y', 'z'] as const;
  return axes.every(
    (axis) =>
      Math.min(highEdge(volume, axis), highEdge(body, axis)) -
        Math.max(lowEdge(volume, axis), lowEdge(body, axis)) >
      toleranceMm,
  );
}

/** A volume worth drawing at all. */
function isPositive(candidate: BoxMm): boolean {
  return (
    Number.isFinite(candidate.size.x) &&
    Number.isFinite(candidate.size.y) &&
    Number.isFinite(candidate.size.z) &&
    candidate.size.x > 0 &&
    candidate.size.y > 0 &&
    candidate.size.z > 0
  );
}

/**
 * The parts of a span that lie outside the space's side walls.
 *
 * Used for both physical width overflow (the span is the cabinet) and a
 * required opening width (the span is the maker's figure, centred on the
 * cabinet). Direction is never assumed: each side is measured, and a span that
 * hangs over both walls - which is what a centred cabinet in a narrow alcove
 * does - produces a volume on each side. Their extents sum to the engine's own
 * shortage figure, because both come from the same two boundaries.
 */
function spanOutsideWalls(
  spanLeftX: number,
  spanRightX: number,
  space: InstallationSpace,
): { leftX: [number, number] | null; rightX: [number, number] | null } {
  const wallX = space.widthMm / 2;
  return {
    leftX: spanLeftX < -wallX ? [spanLeftX, -wallX] : null,
    rightX: spanRightX > wallX ? [wallX, spanRightX] : null,
  };
}

/**
 * WHICH SIDE A DOOR PROBLEM IS ON - asked of the door, not of the label.
 *
 * `doorSideClearance:<leaf>` is decided against the gap on that leaf's own
 * hinge side (`utils/fitCalculator.ts`), so the drawing has to read the same
 * field or the two disagree. It used to take the side from the label's region,
 * which is `left` for a single leaf whichever way it actually hinges, and
 * `body` for a stacked pair - and a `body` region fell through to the width
 * branch, so a blocked upper door was drawn as a slab hanging off the right
 * wall. Same field as the check now, for every topology.
 */
function doorSideOf(checkId: string, layout: ProductLayout): 'left' | 'right' | null {
  const leafId = checkId.split(':')[1];
  const door = layout.doors.find((leaf) => leaf.id === leafId);
  return door ? door.hingeSide : null;
}

/**
 * Build the highlight for one failing check.
 * Returns `null` when the check is not a shortfall we can point at in space.
 */
export function buildIssueHighlight(
  check: Check,
  layout: ProductLayout,
  space: InstallationSpace,
): IssueHighlight | null {
  if (check.status !== 'fail' || check.shortageMm === null || check.shortageMm <= 0) return null;

  const { body } = layout;
  const leftX = lowEdge(body, 'x');
  const rightX = highEdge(body, 'x');
  const backZ = lowEdge(body, 'z');
  const frontZ = highEdge(body, 'z');
  const topY = body.size.y;

  const shortageMm = check.shortageMm;
  const requiredMm = check.requiredMm ?? 0;
  const copy = consumerCopyFor(check.id);
  const { region, kind, sceneLabel } = copy;

  /**
   * WHERE A CLEARANCE PROBLEM LIVES, AS OPPOSED TO A FIT PROBLEM.
   *
   * A physical-fit shortfall is about the APPLIANCE, so it is drawn across the
   * appliance's own footprint. A required-clearance shortfall is about the
   * space the maker asks for AROUND it, which is a wider volume - so it is
   * drawn across the installation envelope's footprint where the product
   * publishes one. Same colour, same treatment, different extent: a wide slab
   * is the maker's envelope, a slab the width of the cabinet is the cabinet.
   *
   * Falls back to the body footprint when the product publishes no envelope,
   * which is honest - with nothing published there is no wider volume to draw.
   */
  const envelope =
    kind === 'requiredClearance'
      ? (layout.officialEnvelope.find((volume) => volume.id === 'installationEnvelope') ?? null)
      : null;
  const spanLeftX = envelope ? lowEdge(envelope.box, 'x') : leftX;
  const spanRightX = envelope ? highEdge(envelope.box, 'x') : rightX;
  const spanBackZ = envelope ? lowEdge(envelope.box, 'z') : backZ;
  const spanFrontZ = envelope ? highEdge(envelope.box, 'z') : frontZ;

  const make = (requiredBox: BoxMm | null, boxes: (BoxMm | null)[]): IssueHighlight | null => {
    const volumes: ShortageVolume[] = boxes
      .filter((candidate): candidate is BoxMm => candidate !== null && isPositive(candidate))
      .map((candidate) => ({ box: candidate, wrapsProduct: overlapsSolid(candidate, body) }));
    if (volumes.length === 0) return null;
    const bounds = unionBox(volumes.map((volume) => volume.box)) as BoxMm;

    return {
      checkId: check.id,
      region,
      kind,
      sceneLabel,
      // Decided across the whole set, in `buildIssueHighlights`.
      primaryInRegion: true,
      /*
       * A PHYSICAL FIT HAS NO REQUIREMENT VOLUME.
       *
       * For `bodyHeight` the "required" box was the product's own height over
       * the product's own footprint - the cabinet, drawn a second time as a
       * translucent blue box 4 mm inside itself. What the maker requires here
       * is simply the appliance, and the appliance is already on screen.
       *
       * With no room at all, a clearance requirement and the missing volume
       * are the same box; drawing both would put two translucent surfaces in
       * identical positions, so only the shortage is drawn.
       */
      requiredBox:
        kind === 'physicalFit' || requiredBox === null || sameBox(requiredBox, bounds)
          ? null
          : requiredBox,
      shortageVolumes: volumes,
      labelAnchorMm: { ...bounds.center },
      shortageMm,
    };
  };

  // --- side shortfalls: body clearance and door clearance ------------------
  //
  // The missing part of a required side gap: it starts at the wall the shopper
  // actually has and runs outwards, because that is the room they would have
  // to gain. A door leaf is asked which side it hinges on; a body clearance
  // takes the side from its own region.
  const side =
    kind === 'doorClearance'
      ? (doorSideOf(check.id, layout) ?? (region === 'right' ? 'right' : 'left'))
      : region === 'left' || region === 'right'
        ? region
        : null;

  if (side !== null) {
    const sign = side === 'left' ? -1 : 1;
    const faceX = side === 'left' ? leftX : rightX;
    const wallX = space.widthMm / 2;
    // The required strip runs outwards from the cabinet face.
    const requiredOuterX = faceX + sign * requiredMm;
    // The missing part is everything beyond the wall the user actually has.
    const availableOuterX = sign * wallX;
    const shortageOuterX = availableOuterX + sign * shortageMm;

    return make(
      requiredMm > 0
        ? box(
            Math.min(faceX, requiredOuterX),
            Math.max(faceX, requiredOuterX),
            0,
            topY,
            backZ,
            frontZ,
          )
        : null,
      [
        box(
          Math.min(availableOuterX, shortageOuterX),
          Math.max(availableOuterX, shortageOuterX),
          0,
          topY,
          backZ,
          frontZ,
        ),
      ],
    );
  }

  // --- rear shortfall: the gap behind the appliance is too small ----------
  //
  // The missing volume is BEHIND the back wall, not in front of the space. Z
  // runs 0 = inner face of the back wall, +Z towards the viewer, so the strip
  // the shopper does not have sits at negative Z - the same way a ceiling
  // shortfall is drawn above the ceiling rather than somewhere inside the room.
  //
  // Until v0.6 this branch drew the front overflow box instead, which pointed
  // at the opposite end of the space from the label attached to it. Nothing
  // caught it because the shipped engine cannot mark a rear check `fail`; it
  // took the developer rendering fixture to put the volume on a screen.
  if (region === 'rear') {
    return make(
      requiredMm > 0 ? box(leftX, rightX, 0, topY, backZ - requiredMm, backZ) : null,
      [box(leftX, rightX, 0, topY, -shortageMm, 0)],
    );
  }

  // --- depth: what the opening does not give in front ----------------------
  //
  // The cabinet standing proud of the recess and an opening too shallow for the
  // maker's figure are the same missing slab: the part beyond the front edge of
  // the space. Where the appliance itself occupies it, it is an overflow and
  // wraps the protruding part rather than hiding inside it.
  if (region === 'front') {
    return make(null, [
      box(spanLeftX, spanRightX, 0, topY, space.depthMm, space.depthMm + shortageMm),
    ]);
  }

  // --- height ---------------------------------------------------------------
  //
  // physicalFit       the part of the CABINET standing above the ceiling. Not
  //                   a slab in mid-air over it: the appliance is what does not
  //                   fit, so the volume is the appliance's own top section,
  //                   from the ceiling line to the top of the product - which
  //                   is exactly `shortageMm` tall.
  // requiredClearance the headroom the maker asks for that the room does not
  //                   have, above the ceiling, across the maker's envelope.
  //                   The cabinet is left alone: it fits, the room is short.
  if (region === 'top') {
    if (kind === 'physicalFit') {
      return make(null, [box(leftX, rightX, space.heightMm, space.heightMm + shortageMm, backZ, frontZ)]);
    }
    return make(
      requiredMm > 0 ? box(spanLeftX, spanRightX, 0, requiredMm, spanBackZ, spanFrontZ) : null,
      [
        box(
          spanLeftX,
          spanRightX,
          space.heightMm,
          space.heightMm + shortageMm,
          spanBackZ,
          spanFrontZ,
        ),
      ],
    );
  }

  // --- width: the span is wider than the space -----------------------------
  //
  // Measured per side against the walls the shopper has, so the volume appears
  // where the span actually hangs over - both sides for a centred cabinet, one
  // side for a cabinet pushed against a wall. The span is the cabinet for a
  // physical fit and the maker's required opening for a clearance, so the same
  // arithmetic answers both without knowing which check it is looking at.
  const halfSpan = (kind === 'physicalFit' ? rightX - leftX : requiredMm) / 2;
  const spanCenterX = body.center.x;
  const outside = spanOutsideWalls(spanCenterX - halfSpan, spanCenterX + halfSpan, space);
  const spanTopY = envelope ? highEdge(envelope.box, 'y') : topY;
  return make(null, [
    outside.leftX ? box(outside.leftX[0], outside.leftX[1], 0, spanTopY, spanBackZ, spanFrontZ) : null,
    outside.rightX ? box(outside.rightX[0], outside.rightX[1], 0, spanTopY, spanBackZ, spanFrontZ) : null,
  ]);
}

/** The single box that contains every volume of an issue - camera framing only. */
export function unionBox(boxes: BoxMm[]): BoxMm | null {
  if (boxes.length === 0) return null;
  const axes = ['x', 'y', 'z'] as const;
  const lows = axes.map((axis) => Math.min(...boxes.map((entry) => lowEdge(entry, axis))));
  const highs = axes.map((axis) => Math.max(...boxes.map((entry) => highEdge(entry, axis))));
  return box(lows[0], highs[0], lows[1], highs[1], lows[2], highs[2]);
}

/** Everything one issue draws, as one box. Null when it draws nothing. */
export function shortageBounds(highlight: IssueHighlight): BoxMm | null {
  return unionBox(highlight.shortageVolumes.map((volume) => volume.box));
}

/** Every failing check that can be pointed at, in report order. */
export function buildIssueHighlights(
  checks: Check[],
  layout: ProductLayout,
  space: InstallationSpace,
): IssueHighlight[] {
  const built = checks
    .map((check) => buildIssueHighlight(check, layout, space))
    .filter((highlight): highlight is IssueHighlight => highlight !== null);

  /*
   * NOTHING IS DROPPED HERE ANY MORE.
   *
   * There was an identical-box filter at this point, so a check whose
   * shortage volume happened to coincide with another's vanished from the
   * scene entirely - it had no highlight, so nothing in the room answered
   * when its result row was hovered. It was guarding against two translucent
   * slabs stacking, and `primaryInRegion` below already guarantees one volume
   * per region, which is the stronger version of the same rule. Every failing
   * check keeps a highlight and stays addressable; what is rationed is
   * geometry, never a check's existence.
   */
  const kept = built;

  /**
   * ONE VOLUME PER PART OF THE ROOM.
   *
   * Deduplicating identical boxes was not enough. A ceiling too low for the
   * appliance AND below the maker's installation height produces two DIFFERENT
   * slabs in the same place - 113 mm and 160 mm - and drawing both gave a
   * shopper two red shapes and two bare numbers with nothing to tell them
   * apart.
   *
   * The most consequential problem in each region keeps its volume; the rest
   * keep their labels, which now say what they are. Ranking is by KIND, so it
   * generalises: if the appliance does not physically go in, that outranks the
   * clearance around it, whatever product or region it happens to be.
   */
  const primaryOf = new Map<IssueRegion, string>();
  for (const highlight of kept) {
    const best = primaryOf.get(highlight.region);
    const bestRank = best
      ? ISSUE_KIND_RANK[kept.find((entry) => entry.checkId === best)!.kind]
      : Infinity;
    if (ISSUE_KIND_RANK[highlight.kind] < bestRank) primaryOf.set(highlight.region, highlight.checkId);
  }

  /**
   * ONE ANCHOR PER PART OF THE ROOM.
   *
   * The volume was already one per region; the LABEL anchors were not. Each
   * sat at the centre of its own shortage box, so a ceiling that is too low
   * for the appliance (53 mm) and below the maker's installation height
   * (100 mm) produced two anchors at different heights over the same slab -
   * and the wider envelope span the clearance kind uses moved them apart in x
   * and z as well.
   *
   * Same spatial fact, two spatial representations. That is the defect; the
   * jitter was the symptom. Two labels over one slab necessarily collide, the
   * layout displaces the lower-priority one, hover raises priority - so
   * moving the pointer between the two result rows swapped which one was
   * displaced and slid both of them down the screen.
   *
   * The region's anchor is the anchor of the volume that is actually drawn
   * there, so every reason describing that part of the room speaks from the
   * place the shopper can see. Nothing is nudged and nothing is per-check:
   * the point comes from the same geometry that built the slab.
   */
  const anchorOf = new Map<IssueRegion, Vec3Mm>();
  for (const highlight of kept) {
    if (primaryOf.get(highlight.region) === highlight.checkId) {
      anchorOf.set(highlight.region, highlight.labelAnchorMm);
    }
  }
  return kept.map((highlight) => ({
    ...highlight,
    primaryInRegion: primaryOf.get(highlight.region) === highlight.checkId,
    labelAnchorMm: anchorOf.get(highlight.region) ?? highlight.labelAnchorMm,
  }));
}
