import { useEffect, useMemo, type ReactNode } from 'react';
import { BoxGeometry, BufferGeometry } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { BoxMm } from '../../types/geometry';
import { mmToSceneUnit, mmToSceneVec3 } from '../../utils/units';

interface MmMeshProps {
  box: BoxMm;
  children: ReactNode;
  rounded?: boolean;
  radiusMm?: number;
}

function boundedRadius(width: number, height: number, depth: number, radiusMm: number) {
  return Number.isFinite(radiusMm)
    ? Math.max(0, Math.min(mmToSceneUnit(radiusMm), width / 2, height / 2, depth / 2))
    : 0;
}

function boxGeometry(width: number, height: number, depth: number, radius: number) {
  return radius > 0
    ? new RoundedBoxGeometry(width, height, depth, radius >= 0.003 ? 2 : 1, radius)
    : new BoxGeometry(width, height, depth);
}

/**
 * Visual surface only. The bevel stays inside the supplied millimetre box;
 * layout, door hinges and collision volumes continue to use that original box.
 */
export function MmMesh({ box, children, rounded = false, radiusMm = 0 }: MmMeshProps) {
  const [width, height, depth] = mmToSceneVec3(box.size.x, box.size.y, box.size.z);
  const radius = rounded ? boundedRadius(width, height, depth, radiusMm) : 0;
  const geometry = useMemo(
    () => boxGeometry(width, height, depth, radius),
    [width, height, depth, radius],
  );

  // Geometry is supplied as a prop, so this component owns its lifetime.
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh
      geometry={geometry}
      position={mmToSceneVec3(box.center.x, box.center.y, box.center.z)}
    >
      {children}
    </mesh>
  );
}

interface MmMeshBatchProps {
  boxes: Array<{ box: BoxMm; radiusMm?: number }>;
  children: ReactNode;
}

/** One draw call for opaque boxes that share a material and transform owner. */
export function MmMeshBatch({ boxes, children }: MmMeshBatchProps) {
  // Part builders may return fresh arrays while only door angles change. Key by
  // actual numeric geometry inputs so those renders reuse the same GPU buffer.
  const geometryKey = JSON.stringify(boxes.map(({ box, radiusMm = 0 }) => {
    const [width, height, depth] = mmToSceneVec3(box.size.x, box.size.y, box.size.z);
    return [
      width, height, depth, boundedRadius(width, height, depth, radiusMm),
      ...mmToSceneVec3(box.center.x, box.center.y, box.center.z),
    ];
  }));
  const geometry = useMemo(() => {
    const inputs = JSON.parse(geometryKey) as Array<
      [number, number, number, number, number, number, number]
    >;
    if (!inputs.length) return new BufferGeometry();

    const parts = inputs.map(([width, height, depth, radius, x, y, z]) => {
      const original = boxGeometry(width, height, depth, radius);
      // Rounded boxes already have independent vertices. Normalize sharp boxes
      // to the same attribute/index format before merging both kinds.
      const part = original.index ? original.toNonIndexed() : original;
      if (part !== original) original.dispose();
      return part.translate(x, y, z);
    });
    const merged = mergeGeometries(parts);
    for (const part of parts) part.dispose();
    if (!merged) throw new Error('Appliance box geometries must share compatible attributes.');
    return merged;
  }, [geometryKey]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return <mesh geometry={geometry}>{children}</mesh>;
}
