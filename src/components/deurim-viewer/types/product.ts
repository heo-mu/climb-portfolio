/**
 * Product data model (v3 - real manufacturer data + visual templates).
 *
 * All linear values are in MILLIMETRES (mm) and every length field name ends
 * with `Mm`, so millimetre data can never be confused with Three.js scene units.
 * Conversion happens only in `utils/units.ts`.
 *
 * Three ideas drive this shape:
 *
 * 1. A real specification is often INCOMPLETE. Every measurable value is a
 *    `SpecValue` whose `value` may be `null`. A missing value must produce an
 *    UNKNOWN check result, never a FAIL and never a guessed number.
 * 2. A real specification often MIXES sources. Each `SpecValue` carries its own
 *    `status` and its own `source`, so an officially published width and an
 *    estimated door clearance can live in the same record without being
 *    confused for one another.
 * 3. LOOKING like the product and BEING checkable are different jobs. Anything
 *    that only exists to make the 3D model resemble the real appliance lives in
 *    `visual` as a `VisualValue`, a type that is deliberately NOT assignable to
 *    `SpecValue` - the compiler itself stops a cosmetic number from reaching the
 *    installation calculation. See PROJECT_SPEC.md section 17.
 */

/**
 * Physical door configuration.
 *
 * `fourDoor` describes the appearance of a 4-door appliance. For VALIDATION it
 * behaves exactly like `french`: two hinge columns, one on each vertical edge.
 * The four visible panels are a visual-model concern only.
 */
export type DoorType = 'single' | 'french' | 'sideBySide' | 'fourDoor' | 'topBottom' | 'topBottomHinged' | 'frenchBottomDrawer';

/** Identifier of a single door leaf inside one product. */
export type DoorId = 'single' | 'left' | 'right' | 'upper' | 'lower';

/** Which vertical edge of the door leaf carries the hinge. */
export type HingeSide = 'left' | 'right';

/**
 * ONE DOOR LEAF, as the manufacturer describes it.
 *
 * WHY THIS EXISTS. Until v0.11 a product had a single `door.maxAngleDeg` and
 * every leaf inherited it. That held for as long as every catalogue entry
 * opened symmetrically, and Samsung RS84B508115 is the entry that ends it: the
 * official installation guide publishes `도어 오픈 최대 각도 좌측 165도, 우측 170도`
 * - two different mechanical maxima on one appliance. A single number cannot
 * express that without either overstating one hinge or understating the other,
 * and a door control that stops the right leaf 5 degrees early is telling a
 * shopper the appliance is more constrained than it is.
 *
 * So a leaf is now a THING with its own identity rather than a side-effect of
 * the door type. Products that open symmetrically simply omit `leaves` and are
 * built exactly as before - this is an addition, not a migration.
 *
 * What is deliberately NOT here: leaf width. No manufacturer in this catalogue
 * publishes where the vertical split falls, so the layout keeps deriving equal
 * halves rather than storing an invented asymmetry (rule 91).
 */
export interface DoorLeafSpec {
  id: DoorId;
  /** null records a known leaf with an unpublished/reversible hinge side. */
  hingeSide: HingeSide | null;
  /** Maximum mechanical opening angle of THIS leaf, with its own provenance. */
  maxAngleDeg: SpecValue;
  /** Explicit manufacturer installation opening when the mechanical stop is unknown.
   * Bounds simulation only; never claims the hinge cannot open farther. */
  supportedOpeningAngleDeg?: SpecValue;
}

/** Separates invented test data from real catalogue entries in the UI. */
export type ProductCategory = 'mock' | 'real';

/**
 * How much a single value can be trusted.
 *
 * - `mock`      test data invented for this PoC. Never a real specification.
 * - `official`  stated directly in a manufacturer document or product page.
 * - `derived`   calculated from official manufacturer values.
 * - `estimated` approximated because no official value exists.
 *
 * Rule: an `estimated` value must not be used as the deciding input of a
 * definitive installability verdict. See PROJECT_SPEC.md section 5.
 *
 * Note that `visualApproximation` is NOT in this union on purpose - cosmetic
 * numbers are a different type entirely (see `VisualValue`).
 */
/**
 * Where a value came from.
 *
 * `unknown` is a first-class member, not an absence: an operator who leaves a
 * field blank has told us something real - that nobody has sourced this figure
 * - and that is different from a value that was estimated or derived. Pairing
 * it with `value: null` means every check that depends on it reports UNKNOWN,
 * which is a truthful answer and never a FAIL.
 */
export type DataStatus = 'mock' | 'official' | 'derived' | 'estimated' | 'unknown';

/** Where one specification value was read from. */
export interface SpecSource {
  /** Name of the page or document, e.g. "Samsung official product page". */
  documentName: string;
  /** Public URL, when the source is online. */
  sourceUrl?: string;
}

/** One measurable specification value plus its own provenance. */
export interface SpecValue {
  /** The measurement, or `null` when no trustworthy value is available. */
  value: number | null;
  /** Where this particular number came from. */
  status: DataStatus;
  /** Optional free text: how it was obtained, or why it is missing. */
  note?: string;
  /** Per-value source. Falls back to `Product.source` when absent. */
  source?: SpecSource;
}

/**
 * A number that exists ONLY to shape the 3D visual model.
 *
 * It is a separate type from `SpecValue` so that TypeScript rejects any attempt
 * to feed it into fit, clearance or collision calculation. Door gaps, panel
 * thickness, corner radius and colours all live here.
 */
export interface VisualValue {
  value: number;
  status: 'visualApproximation';
  note?: string;
}

/** A colour that only exists to shape the 3D visual model. */
export interface VisualColor {
  hex: string;
  status: 'visualApproximation';
  note?: string;
}

/** Which procedural visual model builds this product. */
export type VisualTemplateId = 'closed-four-door' | 'box' | 'samsung-bespoke-4door' | 'side-by-side-2door' | 'top-bottom-2door' | 'stacked-hinged-2door' | 'french-door-bottom-drawer' | 'single-door-tall' | 'single-door-glazed';

/**
 * Visual model parameters.
 *
 * Everything here is a `visualApproximation`: it makes the 3D model resemble
 * the real appliance and nothing more. None of it is a manufacturer figure and
 * none of it can reach the installation calculation.
 */
export interface ProductVisual {
  template: VisualTemplateId;
  /** Source-observed features; dimensions/finish remain cosmetic approximations. */
  handleStyle?: 'bar';
  windowDoor?: 'right';
  dispenserDoor?: 'left';
  /** Cosmetic interior arrangement; never collision or storage-capacity data. */
  interiorShelfCount?: VisualValue;
  interiorDrawerCount?: VisualValue;
  /**
   * Upper panel height divided by the total panel height, i.e. by
   * (product height - base zone - handle band). Measured 0.558 for
   * RF85DB90B2AP; see VISUAL_REFERENCE.md section 3.
   */
  upperDoorHeightRatio?: VisualValue;
  /** Vertical seam between the left and right panel columns. */
  centreGapMm?: VisualValue;
  /** Height of the dark recessed handle band between the two panel rows. */
  handleBandHeightMm?: VisualValue;
  /** Height of the dark base / feet zone below the doors. */
  baseHeightMm?: VisualValue;
  /** Total depth of a door assembly: front panel plus door body. */
  doorAssemblyDepthMm?: VisualValue;
  /** Thickness of the visible front panel on its own. */
  frontPanelThicknessMm?: VisualValue;
  /** How far the cabinet sides sit behind the door panels, per side. */
  bodyInsetMm?: VisualValue;
  /** Corner rounding radius. Kept small - an appliance, not a toy. */
  cornerRadiusMm?: VisualValue;
  /**
   * SIDE-BY-SIDE ONLY. Width of the recessed vertical handle channel along the
   * inner edge of each door. A RECESS, not a bar: the channel is real empty
   * space in front of a set-back strip of the panel, never a dark plane laid
   * on top of one.
   */
  handleChannelWidthMm?: VisualValue;
  /** SIDE-BY-SIDE ONLY. How far that channel is set back from the door face. */
  handleChannelDepthMm?: VisualValue;
  /**
   * SIDE-BY-SIDE ONLY. Shadow gap between the top of the doors and the cabinet
   * top. It is what makes a full-height door read as a door rather than as the
   * front of the box.
   */
  topRevealMm?: VisualValue;
  panelColor?: VisualColor;
  /** Cabinet sides and top. */
  cabinetColor?: VisualColor;
  /** Cabinet face behind the door seams; this is what a seam reads as. */
  cabinetFrontColor?: VisualColor;
  /** The glossy dark bar inside the handle band. */
  handleBarColor?: VisualColor;
  /** Base plinth and feet. */
  baseColor?: VisualColor;
  interiorColor?: VisualColor;
}

/** Who makes the product and what it is called. */
export interface ProductIdentity {
  /** Manufacturer brand, e.g. "Samsung"; the mock catalogue uses "Mock". */
  brand: string;
  /** Marketing name of the model. */
  modelName: string;
  /** Manufacturer model code, `null` when unknown. */
  modelCode: string | null;
  /** Free text such as "4 Door / Freestanding". */
  productType: string | null;
}

/**
 * Outer cabinet dimensions.
 *
 * DEPTH IS NOT ONE MEASUREMENT. Manufacturers print several numbers under the
 * word 깊이 and they mean different things:
 *
 *   RF85DB90B2AP   930 handle included · 906 handle excluded ·
 *                  809 front section excluding door -> rear
 *   RS84B508115    915 후면 핸들 포함 길이 ·
 *                  810 제품 정면(도어 제외) 단면 -> 후면 끝
 *
 * Two figures 105 mm apart are not a discrepancy, they are two measurement
 * references. So the reference is named in the FIELD rather than left to a
 * note, because a note does not stop the wrong one being read:
 *
 *   depthMm               the FULL outer depth, closed door face to the rear
 *                         extremity. What the cabinet occupies, and what the
 *                         layout, the projection note and the 3D all use.
 *   depthExcludingDoorMm  the same rear extremity measured to the CABINET's
 *                         front face, door left out. Subtracting it from
 *                         `depthMm` gives the door assembly depth - the one
 *                         door dimension a maker's diagram implies without
 *                         ever publishing it directly.
 *
 * No check reads `depthExcludingDoorMm`. It exists so the two depths can never
 * be mistaken for each other, and so a visual model can take its door
 * thickness from arithmetic on official figures instead of from a guess.
 */
export interface ProductBody {
  /** Outer cabinet width, along the scene X axis. */
  widthMm: SpecValue;
  /** Outer cabinet height, along the scene Y axis. */
  heightMm: SpecValue;
  /** FULL outer depth: closed door face to the rear extremity. */
  depthMm: SpecValue;
  /**
   * Depth to the cabinet's front face with the door excluded, measured to the
   * SAME rear extremity as `depthMm`. `null` when the maker does not publish
   * it - never estimated, because the difference IS the door thickness.
   */
  depthExcludingDoorMm: SpecValue;
  /** Published closed depth excluding projecting handles, when separately stated. */
  depthExcludingHandlesMm?: SpecValue;
}

/** Free space and conditions the manufacturer requires around the cabinet. */
export interface ProductInstallation {
  /** Optional integrated-appliance aperture minima; never rear or side gaps. */
  requiredInstallationWidthMm?: SpecValue;
  requiredInstallationDepthMm?: SpecValue;
  /** Free space required BEHIND the cabinet (ventilation). */
  rearClearanceMm: SpecValue;
  /** Free space required to the LEFT of the cabinet body. */
  leftClearanceMm: SpecValue;
  /** Free space required to the RIGHT of the cabinet body. */
  rightClearanceMm: SpecValue;
  /**
   * Height the manufacturer requires the installation space to have. This is
   * normally LARGER than `body.heightMm` (levelling feet, lifting, air gap), so
   * it is checked separately and takes priority - see PROJECT_SPEC.md s.9.2.
   * `null` means the manufacturer states no such requirement, in which case
   * only the physical height is checked.
   */
  requiredInstallationHeightMm: SpecValue;
}

/** Door configuration and door-related space requirements. */
export interface ProductDoor {
  /**
   * Number / arrangement of door leaves. `null` means the door layout is not
   * known, in which case no door geometry is generated and every door check
   * reports UNKNOWN.
   */
  type: DoorType | null;
  /** Manufacturer fact; it never supplies a default hinge or swing geometry. */
  reversible?: boolean;
  /** Compartment order, not an inferred dimension or volume ratio. */
  freezerPosition?: 'top' | 'bottom';
  /**
   * Maximum mechanical opening angle, as ONE figure for the whole appliance.
   *
   * When `leaves` states a per-leaf maximum this must be the TIGHTEST of them,
   * so anything that reads only this field is conservative rather than wrong.
   */
  maxAngleDeg: SpecValue;
  /**
   * The leaves, when the maker distinguishes them. Omitted when they are
   * interchangeable, in which case the layout derives them from `type` exactly
   * as it always has. See `DoorLeafSpec`.
   */
  leaves?: DoorLeafSpec[];
  /** Documented installation opening, distinct from an unknown mechanical maximum.
   * Must carry manufacturer provenance; never derived from a picture or room geometry. */
  supportedOpeningAngleDeg?: SpecValue;
  /**
   * Total depth occupied from the back wall when a door stands at 90 degrees.
   * Stored, but no check consumes it: the space model has no "room in front of
   * the alcove" measurement yet (PROJECT_SPEC.md sections 6.1 and 14).
   */
  depthAt90Mm: SpecValue;
  /**
   * Side space the manufacturer says is needed on each side for the door to
   * open properly. This is the AUTHORITATIVE door-usability figure when it is
   * `official`; the procedural 3D collision is then only advisory.
   */
  requiredSideClearanceMm: SpecValue;
  /**
   * Overall width the product occupies with its doors fully open. Used by the
   * Official Installation Envelope visualisation (F-018), not by a check.
   */
  maxOpenOverallWidthMm: SpecValue;
}

/** A published figure that no calculation consumes yet, kept for reference. */
export interface AdditionalSpecification {
  id: string;
  label: string;
  spec: SpecValue;
}

/** Provenance of the record as a whole. */
export interface ProductSource {
  /** Organisation that published the data, `null` for mock records. */
  manufacturer: string | null;
  /** Public URL the data was taken from. */
  sourceUrl: string | null;
  /** Name of the document, e.g. an installation guide page. */
  documentName: string | null;
  /** ISO date (YYYY-MM-DD) the data was last checked against the source. */
  verifiedAt: string | null;
  /**
   * Overall status of the record. Individual `SpecValue.status` fields are
   * authoritative for their own value and may differ from this one.
   */
  dataStatus: DataStatus;
}

export interface Product {
  /** Stable key used by the store and the product <select>. */
  id: string;
  /** Mock test data or a real catalogue entry. */
  category: ProductCategory;
  identity: ProductIdentity;
  body: ProductBody;
  installation: ProductInstallation;
  door: ProductDoor;
  source: ProductSource;
  /** Sourced figures kept for reference; no check reads them. */
  additionalSpecifications: AdditionalSpecification[];
  /** Cosmetic parameters for the 3D model. Never used in any calculation. */
  visual: ProductVisual;
}
