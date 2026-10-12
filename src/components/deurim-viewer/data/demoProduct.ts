import type { Product, SpecSource } from '../types/product';
import { officialSpec, visualValue, visualColor } from '../utils/specValue';
const SAMSUNG_PRODUCT_PAGE: SpecSource = {
  documentName: 'Samsung official product support page, RF85DB90B2AP',
  sourceUrl: 'https://www.samsung.com/sec/support/model/RF85DB90B2AP/',
};

const SAMSUNG_INSTALLATION_GUIDE: SpecSource = {
  documentName: 'Samsung official Bespoke refrigerator installation information',
  sourceUrl: 'https://www.samsung.com/sec/bespoke/buy/fam/',
};

/** Date the figures below were transcribed from the sources above. */
const SAMSUNG_VERIFIED_AT = '2026-09-07';

// ---------------------------------------------------------------------------
// LG M516MQQ012S - official sources
//
// The installation guide carries one table PER MODEL. The figures below are
// from the table headed 상냉장/하냉동 500L (25년형·M516) and from no other:
//
//     제품 가로 835 · 제품 높이 1,860 · 제품 깊이 675
//     상단 여유공간 15 · 좌우 여유공간 각 4 · 후면 여유공간 25
//     도어 110° 열림 시 측면 여유공간 122
//
// The neighbouring 600L tables (G646, M626) state 911 mm wide and 135 mm of
// door-side clearance. Those are DIFFERENT PRODUCTS and none of their numbers
// appear here. The tables were read twice, on separate passes, to be sure the
// right row was transcribed.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Samsung RS84B508115 - official sources
//
// TWO DOCUMENTS, CROSS-CHECKED AGAINST EACH OTHER.
//
// The support page carries the body: 912 x 1780 x 915, 846 L, 양문형 냉장고,
// 프리스탠딩, 클린 화이트(글래스). It carries NO installation figures at all -
// no clearance, no door angle, no door-open dimension.
//
// The installation guide carries those, in a block headed 양문형 냉장고 RS84*
// 모델. It is a MODEL-PREFIX block rather than a per-SKU table, so it is only
// usable here because its own body figures agree with this SKU's spec table
// exactly: 제품 가로 912, 제품 높이 1,780, 후면 핸들 포함 길이 915. Three
// independent matches is what attributes the block to this model; without them
// it would be a shared document telling us nothing about one product.
//
// Transcribed from the block's own text, read twice:
//
//     벽과의 거리 50mm
//     후면 핸들 포함 길이 915 mm
//     도어 오픈 최대 각도 좌측 165도, 우측 170도
//     최대 각도로 오픈 시 도어 열림 길이 518 mm
//     최대 도어 열림 길이 포함한 가로 길이 1,726 mm
//     제품 정면(도어 제외) 단면에서 후면 핸들을 포함한 제품 후면 끝까지의 길이 810 mm
//     도어 오픈 90도 시 도어길이를 포함한 측면 길이 1,364 mm
//     제품 높이 1,780 mm · 제품 가로 길이 912 mm · 양 옆 냉장고장과의 거리 50 mm
//
// The neighbouring RS80* and RS63* blocks state a SINGLE 170도 maximum and, for
// RS63*, a different depth pair (740 / 610) and 90-degree length (1,189). None
// of their numbers appear here.
// ---------------------------------------------------------------------------


export const DEMO_PRODUCT: Product = {
    /**
     * Samsung RF85DB90B2AP - the first real catalogue entry.
     *
     * Every measurable value below is transcribed from the Samsung sources
     * named in `SAMSUNG_PRODUCT_PAGE` / `SAMSUNG_INSTALLATION_GUIDE` and is
     * marked `official`. Nothing here was inferred from a blog, a retailer
     * listing or a search snippet.
     *
     * What is NOT here, on purpose: door leaf width, hinge offset, door
     * thickness, handle geometry, door gaps and the CAD position of the
     * rotation axis. Samsung does not publish those, so they are not stored as
     * specifications at all. The 3D model needs some of them to look right, and
     * those live in `visual` as `visualApproximation` values that the type
     * system keeps out of every calculation.
     */
    id: 'samsung-rf85db90b2ap',
    /**
     * The seed entry. Its figures were transcribed from the Samsung sources
     * above and checked against the shared 3D representation.
     */
    category: 'real',
    identity: {
      brand: 'Samsung',
      modelName: 'Bespoke AI Refrigerator 4-Door 875L',
      modelCode: 'RF85DB90B2AP',
      productType: '4 Door / Freestanding',
    },
    body: {
      widthMm: officialSpec(912, SAMSUNG_PRODUCT_PAGE),
      heightMm: officialSpec(1853, SAMSUNG_PRODUCT_PAGE),
      depthMm: officialSpec(916, SAMSUNG_PRODUCT_PAGE),
      /**
       * Promoted out of `additionalSpecifications` in v0.11.
       *
       * It was already here as a free-text reference row labelled "Depth from
       * front section excluding door to rear". Adding a second side-by-side
       * product made the word "depth" ambiguous enough to be dangerous - this
       * record alone prints three of them - so the measurement reference is
       * now named by the FIELD. Same figure, same source, nothing recomputed.
       */
      depthExcludingDoorMm: officialSpec(
        809,
        SAMSUNG_PRODUCT_PAGE,
        'Depth from the front section excluding the door to the rear. Same rear datum as depthMm, so 916 - 809 = 107 mm is the door assembly.',
      ),
    },
    installation: {
      rearClearanceMm: officialSpec(
        50,
        SAMSUNG_INSTALLATION_GUIDE,
        'Rear minimum clearance stated in the Samsung installation information.',
      ),
      leftClearanceMm: officialSpec(
        50,
        SAMSUNG_INSTALLATION_GUIDE,
        'Body-side minimum required distance. This is the cabinet fitting gap, NOT the space the door needs.',
      ),
      rightClearanceMm: officialSpec(
        50,
        SAMSUNG_INSTALLATION_GUIDE,
        'Body-side minimum required distance. This is the cabinet fitting gap, NOT the space the door needs.',
      ),
      requiredInstallationHeightMm: officialSpec(
        1900,
        SAMSUNG_INSTALLATION_GUIDE,
        'Required installation height. Larger than the 1853 mm appliance height, so it is checked separately and takes priority.',
      ),
    },
    door: {
      type: 'fourDoor',
      maxAngleDeg: officialSpec(125, SAMSUNG_INSTALLATION_GUIDE),
      depthAt90Mm: officialSpec(
        1292,
        SAMSUNG_INSTALLATION_GUIDE,
        'Depth at 90 degree door opening. Stored only - no check consumes it yet (PROJECT_SPEC.md s.14).',
      ),
      requiredSideClearanceMm: officialSpec(
        295,
        SAMSUNG_INSTALLATION_GUIDE,
        'Door-side minimum required distance. This is the authoritative door-usability figure.',
      ),
      maxOpenOverallWidthMm: officialSpec(
        1498,
        SAMSUNG_INSTALLATION_GUIDE,
        'Maximum overall width with the doors open. Used by the Official Installation Envelope, not by a check.',
      ),
    },
    source: {
      manufacturer: 'Samsung',
      sourceUrl: SAMSUNG_PRODUCT_PAGE.sourceUrl ?? null,
      documentName: SAMSUNG_PRODUCT_PAGE.documentName,
      verifiedAt: SAMSUNG_VERIFIED_AT,
      dataStatus: 'official',
    },
    additionalSpecifications: [
      {
        id: 'depthIncludingRearHandle',
        label: 'Depth including rear handle',
        spec: officialSpec(930, SAMSUNG_PRODUCT_PAGE),
      },
      {
        id: 'depthExcludingRearHandle',
        label: 'Depth excluding rear handle',
        spec: officialSpec(906, SAMSUNG_PRODUCT_PAGE),
      },
    ],
    /**
     * VISUAL APPROXIMATION ONLY.
     *
     * These numbers make the 3D model read as a Samsung Bespoke style 4-door
     * appliance. Samsung publishes none of them, so none of them is a
     * specification and none can reach a PASS/FAIL rule - `VisualValue` is not
     * assignable to `SpecValue`.
     */
    visual: {
      template: 'samsung-bespoke-4door',
      upperDoorHeightRatio: visualValue(
        0.558,
        'Measured from the official front elevation: 996 mm upper row of 1785 mm of panel.',
      ),
      centreGapMm: visualValue(12, 'Vertical seam measured at ~8 px on the official front image.'),
      handleBandHeightMm: visualValue(
        44,
        'Dark handle band between the rows, measured at 29 px on the official front image.',
      ),
      baseHeightMm: visualValue(24, 'Visible base / feet zone, measured at 16 px.'),
      doorAssemblyDepthMm: visualValue(70, 'Door depth. Not visible in a front view and not published.'),
      frontPanelThicknessMm: visualValue(44, 'Visible front panel thickness. Not published.'),
      bodyInsetMm: visualValue(8, 'How far the cabinet sides sit behind the door panels. Not published.'),
      cornerRadiusMm: visualValue(6, 'Corners read as nearly square in the reference.'),
      panelColor: visualColor('#e8e8e6', 'Sampled #e4e4e2-#efefed off the official image. Not a published colour code.'),
      cabinetColor: visualColor('#d5d5d1', 'Generic warm-neutral coated cabinet; cosmetic, not a manufacturer colour.'),
      cabinetFrontColor: visualColor('#939793', 'Muted gasket frame behind the genuine panel gaps. Cosmetic only.'),
      handleBarColor: visualColor('#666b69', 'Satin recessed handle band. Generic cosmetic finish.'),
      baseColor: visualColor('#737875', 'Recessed plinth and feet. Generic cosmetic finish.'),
      interiorColor: visualColor('#eef0f1', 'Interior liner; no door-open reference was available.'),
    },
  };
