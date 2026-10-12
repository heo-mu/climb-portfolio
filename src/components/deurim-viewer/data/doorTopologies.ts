import type { DoorId, DoorType, HingeSide } from '../types/product';

interface DoorTopology {
  leaves: Array<{ id: DoorId; hingeSide: HingeSide | null }>;
  /** Structural identification only. No travel or executable drawer motion. */
  drawers?: Array<{ id: string; location: 'bottom'; motion: null }>;
  /** A topology with only closed visual panels has no executable swing model. */
  simulation: 'hinge-columns' | 'stacked-hinges' | 'upper-hinges' | null;
}
const paired: DoorTopology = {
  leaves: [{ id: 'left', hingeSide: 'left' }, { id: 'right', hingeSide: 'right' }],
  simulation: 'hinge-columns',
};
export const DOOR_TOPOLOGIES: Record<DoorType, DoorTopology> = {
  topBottomHinged: {
    leaves: [{ id: 'upper', hingeSide: null }, { id: 'lower', hingeSide: null }],
    simulation: 'stacked-hinges',
  },
  frenchBottomDrawer: {
    leaves: [{ id: 'left', hingeSide: 'left' }, { id: 'right', hingeSide: 'right' }],
    drawers: [{ id: 'freezer', location: 'bottom', motion: null }],
    // Upper refrigerator doors only. Drawer travel remains unsupported.
    simulation: 'upper-hinges',
  },
  single: { leaves: [{ id: 'single', hingeSide: 'left' }], simulation: 'hinge-columns' },
  french: paired,
  sideBySide: paired,
  fourDoor: paired,
  topBottom: {
    leaves: [{ id: 'upper', hingeSide: null }, { id: 'lower', hingeSide: null }],
    simulation: null,
  },
};

/** Describes implemented geometry, never infers swing from a visual template
 * or from reversibility. New executable topologies require a sourced geometry
 * contract and builder; known door count alone cannot enable controls. */
export function supportsDoorSimulationTopology(type: DoorType | null): boolean {
  return type !== null && DOOR_TOPOLOGIES[type].simulation !== null;
}
