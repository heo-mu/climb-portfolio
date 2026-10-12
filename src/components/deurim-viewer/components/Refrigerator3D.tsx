/**
 * The appliance in the scene: composes the three separate kinds of geometry
 * over one shared `ProductLayout` (PROJECT_SPEC.md section 17).
 *
 *   ProductVisualModel     F-017  what the appliance looks like (approximate)
 *   ValidationGeometry3D   F-010  what the engine computes against (debug)
 *
 * The Official Installation Envelope is rendered by `Scene` alongside these,
 * since it belongs to the space requirement rather than to the appliance.
 *
 * The horizontal placement offset is already baked into the layout, so nothing
 * here adjusts a position.
 */
import type { ProductLayout } from '../types/geometry';
import type { Product } from '../types/product';
import type { DoorCollisionCheck } from '../types/result';
import { ProductVisualModel } from './product/ProductVisualModel';
import { ValidationGeometry3D } from './ValidationGeometry3D';
import { useRef } from 'react';
import type { Group } from 'three';

interface Refrigerator3DProps {
  product: Product;
  layout: ProductLayout;
  doorAnglesDeg: Record<string, number>;
  doorChecks: DoorCollisionCheck[];
  showDebugGeometry: boolean;
}

export function Refrigerator3D({
  product,
  layout,
  doorAnglesDeg,
  doorChecks,
  showDebugGeometry,
}: Refrigerator3DProps) {
  const group = useRef<Group>(null);
  return (
    <group ref={group}>
      <ProductVisualModel
        product={product}
        layout={layout}
        doorAnglesDeg={doorAnglesDeg}
        doorChecks={doorChecks}
      />
      <ValidationGeometry3D
        layout={layout}
        doorAnglesDeg={doorAnglesDeg}
        visible={showDebugGeometry}
      />
    </group>
  );
}
