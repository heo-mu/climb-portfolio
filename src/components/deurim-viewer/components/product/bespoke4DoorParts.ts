/**
 * Pure geometry for the `samsung-bespoke-4door` VISUAL MODEL.
 *
 * Kept out of the .tsx so `npm run verify` can assert the two properties that
 * actually matter about a visual model: every part stays inside the product's
 * published envelope, and no two opaque faces sit on the same plane.
 *
 * Proportions come from the measured front elevation in VISUAL_REFERENCE.md.
 * The vertical stack, from the floor up, is:
 *
 *     product top  ─┐
 *                   │  upper panel row      996 mm
 *   handle band top ┤
 *                   │  dark handle band      44 mm   <- the signature feature
 *  handle band base ┤
 *                   │  lower panel row      789 mm
 *      base top     ┤
 *                   │  base / feet zone      24 mm
 *     floor        ─┘                     = 1853 mm
 *
 * ── Z-FIGHTING POLICY ──────────────────────────────────────────────────────
 * Two opaque surfaces on the same plane flicker as the camera moves, because
 * the depth buffer cannot tell them apart. This builder avoids that by
 * construction, not by nudging things with an epsilon:
 *
 *   1. Solids that meet either OVERLAP by `OVERLAP_MM` (so the buried face is
 *      inside another solid and never rasterised) or are separated by a real,
 *      physical gap.
 *   2. The cabinet front is a FRAME of nine members that tile without
 *      overlapping. Adjacent coplanar faces are fine; overlapping ones are not.
 *   3. The door assembly stops `DOOR_AIR_GAP_MM` short of the cabinet frame -
 *      the gasket gap a real door has - so the door back never lands on the
 *      frame plane.
 *   4. Panel seams are REAL EMPTY SPACE between panels, never a dark plane laid
 *      on top of a panel.
 *
 * Everything here is appearance only. Coordinates: static parts are in world
 * millimetres; moving door panels are in the LOCAL frame of their hinge group,
 * whose origin is the hinge axis that `utils/layout.ts` computed.
 *
 * IMPORTANT: only the UPPER panels move. No official reference shows how the
 * lower doors of this model open, so they are drawn as fixed panels rather than
 * being animated on a guess (VISUAL_REFERENCE.md section 5).
 */
import type { BoxMm, DoorLayout, ProductLayout } from '../../types/geometry';
import type { ResolvedVisualParams } from './visualParams';

/** Solids that meet interpenetrate by this much, so no face is ever coplanar. */
const OVERLAP_MM = 3;
/** Gasket gap between the back of a closed door and the cabinet frame. */
const DOOR_AIR_GAP_MM = 6;
/** Depth of the cabinet's front frame members. */
const FRAME_DEPTH_MM = 14;
/** Width of the frame members around the cabinet opening. */
const FRAME_MEMBER_MM = 42;
/** Half width of the dark centre mullion behind the panel seam. */
const MULLION_MARGIN_MM = 3;
/** The glossy bar sits inside the handle band, inset top and bottom. */
const HANDLE_BAR_INSET_MM = 6;
/** How far the glossy bar stands forward of the cabinet frame. */
const HANDLE_BAR_PROJECTION_MM = 18;
/** How far the bar is buried in the frame, so its back face never shows. */
const HANDLE_BAR_EMBED_MM = 4;
/** How far the bar stops short of the product's outer edge. */
const HANDLE_BAR_SIDE_MARGIN_MM = 6;
/** Door tub: the light inner body behind the visible front panel. */
const DOOR_TUB_INSET_MM = 16;
/** Base zone: three small feet, as seen in the reference. */
const FOOT_WIDTH_MM = 90;
const FOOT_DEPTH_MM = 60;

/** Which material a part is drawn with. */
export type PartMaterial =
  | 'panel'
  | 'cabinet'
  | 'cabinetFront'
  | 'handleBar'
  | 'base'
  | 'interior'
  | 'doorTub';

export interface StaticPart {
  id: string;
  box: BoxMm;
  material: PartMaterial;
  /** Only the large visible slabs get rounded corners. */
  rounded: boolean;
}

/** One visible door panel, expressed inside its hinge group. */
export interface DoorPanelPart {
  id: string;
  row: 'upper';
  /** The visible Bespoke front panel. */
  frontPanel: BoxMm;
  /** Light inner body behind the panel; gives the leaf real thickness. */
  doorTub: BoxMm;
  radiusMm: number;
}

export interface DoorColumnParts {
  door: DoorLayout;
  panels: DoorPanelPart[];
}

export interface Bespoke4DoorParts {
  /** Cabinet, interior, base, handle band and the fixed lower panels. */
  staticParts: StaticPart[];
  /** Only the upper panels, which follow their hinge group. */
  doorColumns: DoorColumnParts[];
  /** World Y of the top of the base zone. */
  baseTopYMm: number;
  /** World Y of the bottom and top of the dark handle band. */
  handleBandBottomYMm: number;
  handleBandTopYMm: number;
}

function boxFromBounds(
  x0: number, x1: number,
  y0: number, y1: number,
  z0: number, z1: number,
): BoxMm {
  return {
    center: { x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: (z0 + z1) / 2 },
    size: { x: Math.abs(x1 - x0), y: Math.abs(y1 - y0), z: Math.abs(z1 - z0) },
  };
}

/** A panel column spans from the product's outer edge to the centre seam. */
function panelSpan(door: DoorLayout, centreGapMm: number) {
  const widthMm = Math.max(door.widthMm - centreGapMm / 2, 1);
  // The hinge axis sits on the product's outer edge, so the panel runs from
  // there inwards and stops half a seam short of the centre line.
  const localCenterXMm = door.hingeSide === 'left' ? widthMm / 2 : -widthMm / 2;
  return { widthMm, localCenterXMm };
}

export function buildBespoke4DoorParts(
  layout: ProductLayout,
  params: ResolvedVisualParams,
): Bespoke4DoorParts {
  const { body } = layout;
  const centerXMm = body.center.x;
  const widthMm = body.size.x;
  const heightMm = body.size.y;
  const depthMm = body.size.z;
  const backZMm = body.center.z - depthMm / 2;
  const frontZMm = body.center.z + depthMm / 2;

  // Clamp every cosmetic value so an odd product can never break the envelope.
  const doorDepthMm = Math.min(params.doorAssemblyDepthMm, depthMm * 0.3);
  const frontPanelMm = Math.min(params.frontPanelThicknessMm, doorDepthMm - 8);
  const tubDepthMm = Math.max(doorDepthMm - frontPanelMm, 4);
  const bodyInsetMm = Math.min(params.bodyInsetMm, widthMm * 0.04);
  const baseHeightMm = Math.min(params.baseHeightMm, heightMm * 0.1);
  const bandHeightMm = Math.min(params.handleBandHeightMm, heightMm * 0.1);
  const centreGapMm = Math.min(params.centreGapMm, widthMm * 0.05);

  // Vertical stack.
  const baseTopYMm = baseHeightMm;
  const panelRunMm = Math.max(heightMm - baseHeightMm - bandHeightMm, 2);
  const upperPanelHeightMm = Math.max(panelRunMm * params.upperDoorHeightRatio, 1);
  const lowerPanelHeightMm = Math.max(panelRunMm - upperPanelHeightMm, 1);
  const handleBandBottomYMm = baseTopYMm + lowerPanelHeightMm;
  const handleBandTopYMm = handleBandBottomYMm + bandHeightMm;

  // Depth stack, front to back:
  //   frontZ .. frontZ-panel      visible Bespoke panel
  //   .. minus tub                door tub (light inner body)
  //   .. minus air gap            gasket gap - keeps the door off the frame
  //   frameFrontZ .. -frameDepth  cabinet front frame
  //   .. back                     cabinet shell
  const frameFrontZMm = frontZMm - doorDepthMm - DOOR_AIR_GAP_MM;
  const frameBackZMm = frameFrontZMm - FRAME_DEPTH_MM;

  const halfWidthMm = widthMm / 2;
  const leftEdgeXMm = centerXMm - halfWidthMm;
  const rightEdgeXMm = centerXMm + halfWidthMm;
  const cavLeftXMm = leftEdgeXMm + FRAME_MEMBER_MM;
  const cavRightXMm = rightEdgeXMm - FRAME_MEMBER_MM;
  const cavBottomYMm = baseTopYMm + FRAME_MEMBER_MM;
  const cavTopYMm = heightMm - FRAME_MEMBER_MM;
  const mullionHalfMm = centreGapMm / 2 + MULLION_MARGIN_MM;
  const mullionLeftXMm = centerXMm - mullionHalfMm;
  const mullionRightXMm = centerXMm + mullionHalfMm;

  const staticParts: StaticPart[] = [];
  const push = (id: string, material: PartMaterial, box: BoxMm, rounded = false) =>
    staticParts.push({ id, material, box, rounded });

  // --- cabinet shell -------------------------------------------------------
  // Ends exactly where the frame begins. Two solids that touch face to face
  // present opposite normals, so only one of the pair is ever front-facing -
  // unlike two solids that overlap, which would fight for the same pixel.
  push(
    'cabinet',
    'cabinet',
    boxFromBounds(
      leftEdgeXMm + bodyInsetMm,
      rightEdgeXMm - bodyInsetMm,
      baseTopYMm - OVERLAP_MM,
      heightMm,
      backZMm,
      frameBackZMm,
    ),
    true,
  );

  // --- interior, seen once a door opens ------------------------------------
  // Sits 2 mm behind the frame plane and is embedded into the frame members on
  // every side, so none of its faces can ever be coplanar with the frame.
  push(
    'interior',
    'interior',
    boxFromBounds(
      cavLeftXMm - OVERLAP_MM,
      cavRightXMm + OVERLAP_MM,
      cavBottomYMm - OVERLAP_MM,
      cavTopYMm + OVERLAP_MM,
      backZMm + FRAME_MEMBER_MM,
      frameFrontZMm - 2,
    ),
  );

  // --- cabinet front frame -------------------------------------------------
  // Nine members that TILE without overlapping. Adjacent coplanar faces are
  // harmless; overlapping ones would flicker.
  const frameMember = (id: string, x0: number, x1: number, y0: number, y1: number) =>
    push(id, 'cabinetFront', boxFromBounds(x0, x1, y0, y1, frameBackZMm, frameFrontZMm));

  frameMember('frameLeft', leftEdgeXMm, cavLeftXMm, baseTopYMm, heightMm);
  frameMember('frameRight', cavRightXMm, rightEdgeXMm, baseTopYMm, heightMm);
  // The centre mullion is what the vertical panel seam actually shows.
  frameMember('frameMullion', mullionLeftXMm, mullionRightXMm, baseTopYMm, heightMm);
  frameMember('frameTopLeft', cavLeftXMm, mullionLeftXMm, cavTopYMm, heightMm);
  frameMember('frameTopRight', mullionRightXMm, cavRightXMm, cavTopYMm, heightMm);
  frameMember('frameBottomLeft', cavLeftXMm, mullionLeftXMm, baseTopYMm, cavBottomYMm);
  frameMember('frameBottomRight', mullionRightXMm, cavRightXMm, baseTopYMm, cavBottomYMm);
  // The mid rail is what the 44 mm handle band actually shows.
  frameMember('frameMidRailLeft', cavLeftXMm, mullionLeftXMm, handleBandBottomYMm, handleBandTopYMm);
  frameMember('frameMidRailRight', mullionRightXMm, cavRightXMm, handleBandBottomYMm, handleBandTopYMm);

  // --- handle bars ---------------------------------------------------------
  // Glossy dark bars standing forward inside the band, split at the centre seam
  // exactly as the reference shows. Buried into the frame so their back faces
  // are never rasterised.
  const barBottomYMm = handleBandBottomYMm + HANDLE_BAR_INSET_MM;
  const barTopYMm = handleBandTopYMm - HANDLE_BAR_INSET_MM;
  // The bars stop on the PANEL seam, not on the mullion edge, so the gap
  // between them lines up with the vertical seam above and below. Ending them
  // on the mullion's own face would put two coplanar faces in the middle of the
  // product - which is exactly where flicker is most visible.
  const barInnerLeftXMm = centerXMm - centreGapMm / 2;
  const barInnerRightXMm = centerXMm + centreGapMm / 2;
  push(
    'handleBarLeft',
    'handleBar',
    boxFromBounds(
      leftEdgeXMm + HANDLE_BAR_SIDE_MARGIN_MM,
      barInnerLeftXMm,
      barBottomYMm,
      barTopYMm,
      frameFrontZMm - HANDLE_BAR_EMBED_MM,
      frameFrontZMm + HANDLE_BAR_PROJECTION_MM,
    ),
  );
  push(
    'handleBarRight',
    'handleBar',
    boxFromBounds(
      barInnerRightXMm,
      rightEdgeXMm - HANDLE_BAR_SIDE_MARGIN_MM,
      barBottomYMm,
      barTopYMm,
      frameFrontZMm - HANDLE_BAR_EMBED_MM,
      frameFrontZMm + HANDLE_BAR_PROJECTION_MM,
    ),
  );

  // --- base zone -----------------------------------------------------------
  // The doors run nearly to the floor; only a shallow dark recess with three
  // small feet is visible underneath.
  push(
    'basePlinth',
    'base',
    boxFromBounds(
      leftEdgeXMm + bodyInsetMm * 2,
      rightEdgeXMm - bodyInsetMm * 2,
      0,
      baseTopYMm + OVERLAP_MM,
      backZMm + 40,
      frameFrontZMm - 30,
    ),
  );

  const footWidthMm = Math.min(FOOT_WIDTH_MM, widthMm / 6);
  const footOffsetMm = halfWidthMm - bodyInsetMm - footWidthMm / 2 - 30;
  const footFrontZMm = frameFrontZMm + 40;
  ([
    ['footLeft', -footOffsetMm],
    ['footCentre', 0],
    ['footRight', footOffsetMm],
  ] as const).forEach(([id, offset]) => {
    push(
      id,
      'base',
      boxFromBounds(
        centerXMm + offset - footWidthMm / 2,
        centerXMm + offset + footWidthMm / 2,
        0,
        baseTopYMm * 0.8,
        footFrontZMm - FOOT_DEPTH_MM,
        footFrontZMm,
      ),
    );
  });

  // --- fixed lower panels --------------------------------------------------
  // Drawn in world space: they never rotate, because no official reference
  // shows how the lower doors of this model open.
  for (const door of layout.doors) {
    const { widthMm: panelWidthMm, localCenterXMm } = panelSpan(door, centreGapMm);
    const panelCenterXMm = door.hingeXMm + localCenterXMm;
    const halfPanel = panelWidthMm / 2;

    push(
      `lowerPanel-${door.id}`,
      'panel',
      boxFromBounds(
        panelCenterXMm - halfPanel,
        panelCenterXMm + halfPanel,
        baseTopYMm,
        handleBandBottomYMm,
        frontZMm - frontPanelMm,
        frontZMm,
      ),
      true,
    );
    push(
      `lowerTub-${door.id}`,
      'doorTub',
      boxFromBounds(
        panelCenterXMm - halfPanel + DOOR_TUB_INSET_MM,
        panelCenterXMm + halfPanel - DOOR_TUB_INSET_MM,
        baseTopYMm + DOOR_TUB_INSET_MM,
        handleBandBottomYMm - DOOR_TUB_INSET_MM,
        frontZMm - frontPanelMm - tubDepthMm,
        // Buried into the panel, so the tub's front face never shows.
        frontZMm - frontPanelMm + OVERLAP_MM,
      ),
    );
  }

  // --- moving upper panels -------------------------------------------------
  const doorColumns: DoorColumnParts[] = layout.doors.map((door) => {
    const { widthMm: panelWidthMm, localCenterXMm } = panelSpan(door, centreGapMm);
    const halfPanel = panelWidthMm / 2;
    // Local Z: the hinge group's origin is the hinge axis, so world Z minus it.
    const localFrontZMm = frontZMm - door.hingeZMm;

    const panel: DoorPanelPart = {
      id: `upperPanel-${door.id}`,
      row: 'upper',
      radiusMm: Math.min(params.cornerRadiusMm, panelWidthMm / 4, frontPanelMm / 4),
      frontPanel: boxFromBounds(
        localCenterXMm - halfPanel,
        localCenterXMm + halfPanel,
        handleBandTopYMm,
        heightMm,
        localFrontZMm - frontPanelMm,
        localFrontZMm,
      ),
      doorTub: boxFromBounds(
        localCenterXMm - halfPanel + DOOR_TUB_INSET_MM,
        localCenterXMm + halfPanel - DOOR_TUB_INSET_MM,
        handleBandTopYMm + DOOR_TUB_INSET_MM,
        heightMm - DOOR_TUB_INSET_MM,
        localFrontZMm - frontPanelMm - tubDepthMm,
        localFrontZMm - frontPanelMm + OVERLAP_MM,
      ),
    };

    return { door, panels: [panel] };
  });

  return { staticParts, doorColumns, baseTopYMm, handleBandBottomYMm, handleBandTopYMm };
}
