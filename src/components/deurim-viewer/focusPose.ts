// Extracted unchanged from Deurim Scene.tsx; explicit issue focus only.
import * as THREE from 'three';
import { shortageBounds, type IssueHighlight } from './utils/issueGeometry';
import { focusPoseFor, type CameraSubject } from './utils/cameraPolicy';
import { mmToSceneUnit } from './utils/units';
export function focusPose(highlight: IssueHighlight, subject: CameraSubject, viewport: { width: number; height: number }) {
  // Everything this issue draws, as one box: a width overflow hangs over both
  // walls, and framing one of the two would put the other off screen.
  const box = shortageBounds(highlight) ?? highlight.requiredBox;
  if (!box) return null;

  /**
   * A HEIGHT PROBLEM HAS TO BE SEEN FROM THE SIDE.
   *
   * The top region used to be approached from `y: 0.75` - 35 degrees up -
   * aimed at the shortage slab's own centre. The slab is thin and wide (912 x
   * 113 x 916), so the framing distance came from its 916 mm span and the
   * camera ended up close and high: a near plan view of the cabinet's lid,
   * with the shortage a rim along two edges. Vertical extent is the one thing
   * a view from above cannot show, so activating "113mm 더 필요, 냉장고가 설치
   * 공간보다 높아요" produced the least useful picture of it available.
   *
   * Two changes, both derived from the issue's own geometry rather than from
   * any product:
   *
   *   ELEVATION   drops to roughly the same angle the side regions use, so the
   *               view is a three-quarter elevation and up IS up on screen.
   *   EXTENT      the framed volume is stretched down to the floor of the
   *               subject, so what is framed is the RELATIONSHIP - the
   *               appliance standing in the space and the part that does not
   *               fit above it - instead of the slab alone. The bigger span
   *               also pulls the camera back to the distance the side issues
   *               get, which is what makes both objects fit in the frame.
   *
   * Nothing here branches on a product or a check id, and the side and door
   * regions are untouched.
   */
  const verticalIssue = highlight.region === 'top';
  /*
   * A DEPTH PROBLEM CANNOT BE READ FROM THE FRONT.
   *
   * `front` and `rear` are the two regions whose whole content is a distance
   * along Z - the appliance standing proud of the opening, or the gap the maker
   * asks for behind it. From the near-frontal three-quarter the other regions
   * use, that distance projects to almost nothing: the shortage slab is edge-on
   * and a shopper sees a coloured line. They are approached from much further
   * round instead, so Z has a real extent on screen, and from a little lower,
   * because a depth gap is read against the floor it sits on.
   *
   * It is the REGION that decides this, not the check id and not the label.
   */
  const depthIssue = highlight.region === 'front' || highlight.region === 'rear';

  const approach =
    highlight.region === 'left'
      ? { x: -0.8, y: 0.45, z: 1 }
      : highlight.region === 'right'
        ? { x: 0.8, y: 0.45, z: 1 }
        : verticalIssue
          ? { x: 0.5, y: 0.26, z: 1 }
          : depthIssue
            ? { x: 1.5, y: 0.3, z: 0.9 }
            : { x: 0.45, y: 0.4, z: 1 };

  let framedCenter = box.center;
  let framedSize = box.size;
  if (verticalIssue) {
    const shortageTopMm = box.center.y + box.size.y / 2;
    const floorMm = subject.centerMm.y - subject.sizeMm.y / 2;
    const spanMm = Math.max(box.size.y, shortageTopMm - floorMm);
    framedCenter = { ...box.center, y: shortageTopMm - spanMm / 2 };
    framedSize = { ...box.size, y: spanMm };
  }

  const pose = focusPoseFor(subject, framedCenter, framedSize, approach);
  const target = new THREE.Vector3(
    mmToSceneUnit(pose.targetMm.x),
    mmToSceneUnit(pose.targetMm.y),
    mmToSceneUnit(pose.targetMm.z),
  );
  const position = new THREE.Vector3(
    mmToSceneUnit(pose.positionMm.x),
    mmToSceneUnit(pose.positionMm.y),
    mmToSceneUnit(pose.positionMm.z),
  );
  /*
   * THE SAME NARROW-VIEWPORT CORRECTION THE DEFAULT POSE TAKES.
   *
   * Distance comes from the vertical field of view, so on a canvas that is
   * taller than it is wide the horizontal extent is what actually binds - and
   * a side clearance is a HORIZONTAL fact. Without this, focusing the left gap
   * on a phone framed it correctly in height and cropped it at the edges. The
   * canvas is already inset to the visible area at every width (the deck's
   * measured height at 1199 and below, the full window on the desktop, where
   * the panels float over the outer fifths), so this is measured against what
   * a shopper can actually see rather than against the window.
   */
  position.sub(target).multiplyScalar(aspectCorrection(viewport)).add(target);
  return { target, position };
}

/**
 * How much further back a narrow canvas has to sit.
 *
 * 1 on anything wider than it is tall, and the height/width ratio below that -
 * the identical rule the default framing uses, kept in one place so the two
 * cannot drift into two different ideas of "fits".
 */
function aspectCorrection(viewport: { width: number; height: number }): number {
  return Math.max(1, viewport.height / Math.max(1, viewport.width));
}

