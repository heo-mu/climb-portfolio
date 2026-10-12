/**
 * A small, static grounding cue for the visual appliance, not a shadow map or
 * a clearance area. Its bounds follow the already placed product body.
 */
import { useEffect, useMemo } from 'react';
import { BufferGeometry, Color, Float32BufferAttribute } from 'three';
import type { BoxMm } from '../../types/geometry';
import { mmToSceneUnit, mmToSceneVec3 } from '../../utils/units';

const CORNER_SEGMENTS = 6;
const FLOOR_LIFT_MM = 0.8;
const CONTACT_COLOR = new Color('#66636a');
const RINGS = [
  { offsetMm: -22, alpha: 0.17 },
  { offsetMm: 3, alpha: 0.065 },
  { offsetMm: 32, alpha: 0 },
] as const;

function contactGeometry(widthMm: number, depthMm: number): BufferGeometry {
  const positions: number[] = [0, 0, 0];
  const colors: number[] = [CONTACT_COLOR.r, CONTACT_COLOR.g, CONTACT_COLOR.b, RINGS[0].alpha];
  const indices: number[] = [];
  const ringSize = (CORNER_SEGMENTS + 1) * 4;

  for (const { offsetMm, alpha } of RINGS) {
    const halfWidthMm = Math.max(widthMm / 2 + offsetMm, 1);
    const halfDepthMm = Math.max(depthMm / 2 + offsetMm, 1);
    const radiusMm = Math.min(46 + offsetMm, halfWidthMm * 0.4, halfDepthMm * 0.4);
    for (let corner = 0; corner < 4; corner += 1) {
      const centerXMm = (corner === 0 || corner === 3 ? 1 : -1) * (halfWidthMm - radiusMm);
      const centerZMm = (corner < 2 ? 1 : -1) * (halfDepthMm - radiusMm);
      for (let segment = 0; segment <= CORNER_SEGMENTS; segment += 1) {
        const angle = (corner + segment / CORNER_SEGMENTS) * Math.PI / 2;
        positions.push(
          mmToSceneUnit(centerXMm + Math.cos(angle) * radiusMm),
          0,
          mmToSceneUnit(centerZMm + Math.sin(angle) * radiusMm),
        );
        colors.push(CONTACT_COLOR.r, CONTACT_COLOR.g, CONTACT_COLOR.b, alpha);
      }
    }
  }

  // Upward-facing triangles: an opaque floor still hides the cue from below.
  for (let i = 0; i < ringSize; i += 1) {
    const next = (i + 1) % ringSize;
    indices.push(0, 1 + next, 1 + i);
    for (let ring = 0; ring < RINGS.length - 1; ring += 1) {
      const inner = 1 + ring * ringSize;
      const outer = inner + ringSize;
      indices.push(inner + i, inner + next, outer + next);
      indices.push(inner + i, outer + next, outer + i);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 4));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

export function ContactFootprint({ body }: { body: BoxMm }) {
  const geometry = useMemo(() => contactGeometry(body.size.x, body.size.z), [body.size.x, body.size.z]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh
      geometry={geometry}
      position={mmToSceneVec3(body.center.x, FLOOR_LIFT_MM, body.center.z)}
      raycast={() => null}
    >
      <meshBasicMaterial vertexColors transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
