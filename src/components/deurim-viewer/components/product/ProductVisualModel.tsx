/**
 * VISUAL MODEL entry point (F-017).
 *
 * Picks the procedural model for a product from `product.visual.template` and
 * feeds it the validation layout plus the product's cosmetic parameters.
 *
 * This is the ONLY place that decides what the appliance looks like. It reads
 * geometry from `ProductLayout` and never produces a position of its own, so
 * changing the appearance can never change a verdict - see PROJECT_SPEC.md
 * section 17 for the Visual / Validation / Official separation.
 */
import { useMemo } from 'react';
import type { ProductLayout } from '../../types/geometry';
import type { Product } from '../../types/product';
import type { DoorCollisionCheck } from '../../types/result';
import { SamsungBespoke4Door } from './SamsungBespoke4Door';
import { resolveVisualParams } from './visualParams';
import { ContactFootprint } from './ContactFootprint';
import { ApplianceEnvironment } from './ApplianceEnvironment';

interface ProductVisualModelProps {
  product: Product;
  layout: ProductLayout;
  doorAnglesDeg: Record<string, number>;
  doorChecks: DoorCollisionCheck[];
}

export function ProductVisualModel({
  product,
  layout,
  doorAnglesDeg,
  doorChecks,
}: ProductVisualModelProps) {
  const params = useMemo(() => resolveVisualParams(product), [product]);
  const collidedDoorIds = new Set(
    doorChecks.filter((check) => check.status === 'fail').map((check) => check.doorId as string),
  );

  const model = <SamsungBespoke4Door layout={layout} params={params} doorAnglesDeg={doorAnglesDeg} collidedDoorIds={collidedDoorIds} />;
  return (
    <ApplianceEnvironment>
      <ContactFootprint body={layout.body} />
      {model}
    </ApplianceEnvironment>
  );
}
