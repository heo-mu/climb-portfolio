/**
 * F-020: shows WHERE the space falls short, and by how much.
 *
 * This is why the 3D exists in the shopper flow. Without it the view is a
 * product viewer; with it, someone who has never heard "도어 여유 공간" can see
 * that their wall sits inside the room the door needs, with "195mm 부족"
 * written across the gap.
 *
 * Every volume goes through `OverlayVolume`, so the material, depth behaviour
 * and the inset that keeps overlays off real surfaces are decided once in
 * `overlayPolicy.ts` rather than here (F-023).
 */
import type { IssueHighlight } from '../utils/issueGeometry';
import { OverlayVolume } from './overlay/OverlayVolume';
import { shortageOverlayKind } from './overlay/overlayPolicy';

interface IssueHighlights3DProps {
  highlights: IssueHighlight[];
  /** When set, only this issue is drawn; the others step out of the way. */
  selectedIssueId: string | null;
  /**
   * The issue the pointer is over, from the panel or from the scene.
   *
   * Unlike a selection this hides nothing. The others merely go quieter, so
   * the shopper keeps the context of how many problems there are while seeing
   * plainly which one they are pointing at.
   */
  hoveredIssueId?: string | null;
}

/**
 * The translucent volumes, and only those.
 *
 * The LABELS that go with them are built by `utils/issueAnnotations.ts` and
 * placed by `AnnotationLayer`, which is the only thing that can see every
 * label at once and therefore the only thing that can stop two of them
 * landing on the same pixels.
 */
export function IssueHighlights3D({
  highlights,
  selectedIssueId,
  hoveredIssueId = null,
}: IssueHighlights3DProps) {
  if (highlights.length === 0) return null;

  /**
   * WHICH VOLUMES ARE DRAWN.
   *
   * Selected: that one, alone - "이건 어디예요?" has exactly one answer.
   * Otherwise: one per region, the most consequential. Every problem still has
   * a LABEL; what is rationed is translucent geometry, because two slabs in the
   * same place read as one confusing shape rather than as two problems.
   */
  const visible = selectedIssueId
    ? highlights.filter((highlight) => highlight.checkId === selectedIssueId)
    : highlights.filter((highlight) => highlight.primaryInRegion);

  return (
    <group>
      {visible.map((highlight) => {
        // Nothing is hovered: every problem reads at full strength.
        const muted = hoveredIssueId !== null && highlight.checkId !== hoveredIssueId;
        return (
          <group key={highlight.checkId}>
            {highlight.requiredBox && (
              <OverlayVolume kind="requirement" box={highlight.requiredBox} muted={muted} />
            )}
            {/*
              WHICH MEANING, not which material. A volume the appliance stands
              inside is an `overflow` - the part of the cabinet past the
              boundary - and the policy draws it around that part instead of
              inside it. Everything else is missing room in open space.
            */}
            {highlight.shortageVolumes.map((volume, index) => (
              <OverlayVolume
                key={index}
                kind={shortageOverlayKind(volume.wrapsProduct)}
                box={volume.box}
                muted={muted}
              />
            ))}
          </group>
        );
      })}
    </group>
  );
}
