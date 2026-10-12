/**
 * Resolves a product's cosmetic `visual` block into concrete numbers for the
 * 3D model, in millimetres.
 *
 * EVERYTHING here is a visual approximation. It shapes appearance only. None of
 * it is a manufacturer specification and none of it can reach a fit, clearance
 * or collision rule - `VisualValue` is a distinct type from `SpecValue`, so the
 * compiler refuses the mix. See PROJECT_SPEC.md section 17.
 *
 * The defaults below are the values measured off the official RF85DB90B2AP
 * front elevation (VISUAL_REFERENCE.md section 3).
 */
import type { Product } from '../../types/product';
import { valueOf, visualColorOr, visualOr } from '../../utils/specValue';

/** Fallbacks used when a product omits a cosmetic parameter. */
const FALLBACK = {
  upperDoorHeightRatio: 0.558,
  centreGapMm: 12,
  handleBandHeightMm: 44,
  baseHeightMm: 24,
  doorAssemblyDepthMm: 70,
  frontPanelThicknessMm: 44,
  bodyInsetMm: 8,
  cornerRadiusMm: 6,
  handleChannelWidthMm: 46,
  handleChannelDepthMm: 14,
  topRevealMm: 10,
  panelColor: '#e8e8e6',
  cabinetColor: '#d5d5d1',
  cabinetFrontColor: '#939793',
  handleBarColor: '#666b69',
  baseColor: '#737875',
  interiorColor: '#eef0f1',
} as const;

export interface ResolvedVisualParams {
  handleStyle: 'bar' | null;
  handleProjectionMm: number;
  windowDoor: 'right' | null;
  dispenserDoor: 'left' | null;
  interiorShelfCount: number;
  interiorDrawerCount: number;
  upperDoorHeightRatio: number;
  centreGapMm: number;
  handleBandHeightMm: number;
  baseHeightMm: number;
  doorAssemblyDepthMm: number;
  frontPanelThicknessMm: number;
  bodyInsetMm: number;
  cornerRadiusMm: number;
  handleChannelWidthMm: number;
  handleChannelDepthMm: number;
  topRevealMm: number;
  panelColor: string;
  cabinetColor: string;
  cabinetFrontColor: string;
  handleBarColor: string;
  baseColor: string;
  interiorColor: string;
}

/**
 * DOOR THICKNESS, FROM ARITHMETIC RATHER THAN FROM A GUESS.
 *
 * A maker that publishes both depths has told us how thick the door is without
 * ever saying so: the full depth and the door-excluded depth share a rear
 * datum, so the difference is the door assembly. That is better evidence than
 * any constant, so it becomes the FALLBACK - ahead of the hard-coded 70 mm but
 * behind a record that states its own value, because a record that states one
 * has been looked at.
 *
 * DIRECTION MATTERS. This is an official figure shaping a VISUAL model, which
 * is the allowed direction. Nothing here can travel back: the result is a
 * plain number handed to a template, and no fit, clearance or collision rule
 * reads `ResolvedVisualParams`. The engine's own door thickness stays
 * `DOOR_THICKNESS_MM` in `utils/layout.ts` for every product alike.
 */
function publishedDoorAssemblyDepthMm(product: Product): number | null {
  const depthMm = valueOf(product.body.depthMm);
  const excludingDoorMm = valueOf(product.body.depthExcludingDoorMm);
  if (depthMm === null || excludingDoorMm === null) return null;
  const doorMm = depthMm - excludingDoorMm;
  return doorMm > 0 ? doorMm : null;
}

export function resolveVisualParams(product: Product): ResolvedVisualParams {
  const visual = product.visual;
  return {
    handleStyle: visual.handleStyle ?? null,
    handleProjectionMm: visual.handleStyle === 'bar' && product.body.depthExcludingHandlesMm
      ? Math.max(0, (valueOf(product.body.depthMm) ?? 0) - (valueOf(product.body.depthExcludingHandlesMm) ?? valueOf(product.body.depthMm) ?? 0)) : 0,
    windowDoor: visual.windowDoor ?? null,
    dispenserDoor: visual.dispenserDoor ?? null,
    interiorShelfCount: Math.max(0, Math.min(12, Math.round(visualOr(visual.interiorShelfCount, 0)))),
    interiorDrawerCount: Math.max(0, Math.min(6, Math.round(visualOr(visual.interiorDrawerCount, 0)))),
    upperDoorHeightRatio: visualOr(visual.upperDoorHeightRatio, FALLBACK.upperDoorHeightRatio),
    centreGapMm: visualOr(visual.centreGapMm, FALLBACK.centreGapMm),
    handleBandHeightMm: visualOr(visual.handleBandHeightMm, FALLBACK.handleBandHeightMm),
    baseHeightMm: visualOr(visual.baseHeightMm, FALLBACK.baseHeightMm),
    doorAssemblyDepthMm: visualOr(
      visual.doorAssemblyDepthMm,
      publishedDoorAssemblyDepthMm(product) ?? FALLBACK.doorAssemblyDepthMm,
    ),
    frontPanelThicknessMm: visualOr(visual.frontPanelThicknessMm, FALLBACK.frontPanelThicknessMm),
    bodyInsetMm: visualOr(visual.bodyInsetMm, FALLBACK.bodyInsetMm),
    cornerRadiusMm: visualOr(visual.cornerRadiusMm, FALLBACK.cornerRadiusMm),
    handleChannelWidthMm: visualOr(visual.handleChannelWidthMm, FALLBACK.handleChannelWidthMm),
    handleChannelDepthMm: visualOr(visual.handleChannelDepthMm, FALLBACK.handleChannelDepthMm),
    topRevealMm: visualOr(visual.topRevealMm, FALLBACK.topRevealMm),
    panelColor: visualColorOr(visual.panelColor, FALLBACK.panelColor),
    cabinetColor: visualColorOr(visual.cabinetColor, FALLBACK.cabinetColor),
    cabinetFrontColor: visualColorOr(visual.cabinetFrontColor, FALLBACK.cabinetFrontColor),
    handleBarColor: visualColorOr(visual.handleBarColor, FALLBACK.handleBarColor),
    baseColor: visualColorOr(visual.baseColor, FALLBACK.baseColor),
    interiorColor: visualColorOr(visual.interiorColor, FALLBACK.interiorColor),
  };
}
