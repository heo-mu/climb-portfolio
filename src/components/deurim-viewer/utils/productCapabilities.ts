import { geometryFamilyById } from '../data/geometryFamilies';
import { DOOR_TOPOLOGIES, supportsDoorSimulationTopology } from '../data/doorTopologies';
import type { Product, SpecValue } from '../types/product';
import { doorOpeningSpec, isManufacturerBacked } from './specValue';

export type CapabilityAvailability = 'available' | 'partial' | 'unavailable';
export type CapabilityAuthority = 'verdict' | 'advisory' | 'none';

export interface ProductCapability {
  id: 'physicalFit' | 'installationClearance' | 'doorSimulation' | 'doorCollision' | 'visualFidelity';
  availability: CapabilityAvailability;
  authority: CapabilityAuthority;
  reason: string;
}

const allBacked = (...values: SpecValue[]) =>
  values.every(isManufacturerBacked);

/** Door interaction needs a sourced angle and every implied leaf's hinge/angle. */
export function hasManufacturerDoorOpening(product: Product): boolean {
  if (!product.door.type || !supportsDoorSimulationTopology(product.door.type)) return false;
  return isManufacturerBacked(doorOpeningSpec(product.door)) &&
    DOOR_TOPOLOGIES[product.door.type].leaves.every(({ id }) => {
      const leaf = product.door.leaves?.find(entry => entry.id === id);
      if (leaf) return leaf.hingeSide != null && isManufacturerBacked(doorOpeningSpec(leaf));
      return product.door.type !== 'single' &&
        DOOR_TOPOLOGIES[product.door.type!].simulation === 'hinge-columns';
    });
}

/** Product Contract capability derivation shared by catalogue ordering and QA. */
export function productCapabilities(product: Product): ProductCapability[] {
  const family = geometryFamilyById(product.visual.template);
  const physical = allBacked(product.body.widthMm, product.body.heightMm, product.body.depthMm);
  const installation = [
    product.installation.leftClearanceMm, product.installation.rightClearanceMm,
    product.installation.rearClearanceMm, product.installation.requiredInstallationHeightMm,
    ...[product.installation.requiredInstallationWidthMm, product.installation.requiredInstallationDepthMm]
      .filter((value): value is NonNullable<typeof value> => value !== undefined),
  ];
  const knownInstallation = installation.filter(isManufacturerBacked).length;
  const hasVerdictInstallationRequirement = [
    product.installation.leftClearanceMm, product.installation.rightClearanceMm,
    product.installation.requiredInstallationHeightMm,
  ].some(isManufacturerBacked);
  const hasAngle = hasManufacturerDoorOpening(product);
  const executableTopology = supportsDoorSimulationTopology(product.door.type)
    && (product.door.type !== 'frenchBottomDrawer' || hasAngle);
  return [
    { id: 'physicalFit', availability: physical ? 'available' : 'unavailable', authority: physical ? 'verdict' : 'none', reason: physical ? 'Authoritative body dimensions are available.' : 'Authoritative width, height, and depth are required.' },
    { id: 'installationClearance', availability: knownInstallation === installation.length ? 'available' : knownInstallation ? 'partial' : 'unavailable', authority: hasVerdictInstallationRequirement ? 'verdict' : 'none', reason: knownInstallation ? 'Available manufacturer installation requirements are evaluated.' : 'No authoritative installation requirements are available.' },
    { id: 'doorSimulation', availability: executableTopology && hasAngle ? 'available' : executableTopology ? 'partial' : 'unavailable', authority: 'none', reason: executableTopology && hasAngle ? 'Executable topology and official opening angles are available.' : 'Executable geometry or manufacturer door facts are incomplete.' },
    { id: 'doorCollision', availability: executableTopology && hasAngle ? 'available' : executableTopology ? 'partial' : 'unavailable', authority: executableTopology && hasAngle ? 'advisory' : 'none', reason: 'Procedural collision remains advisory unless manufacturer operating-space requirements decide the result.' },
    { id: 'visualFidelity', availability: family?.isProductLikeness ? 'available' : family ? 'partial' : 'unavailable', authority: 'none', reason: family?.isProductLikeness ? 'A registered Geometry Family represents the product shape.' : 'Only a fallback visual representation is available.' },
  ];
}
