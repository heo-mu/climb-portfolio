import { useMemo } from 'react';
import type { BoxMm } from '../../types/geometry';
import type { StaticPart, PartMaterial } from './bespoke4DoorParts';
import { buildApplianceSurfaces, doorLinerBoxes } from './applianceConstruction';
import { MmMeshBatch } from './ApplianceMesh';
import type { ResolvedVisualParams } from './visualParams';
import { useApplianceEnvironment } from './ApplianceEnvironment';

/** Shared satin finish; family differences remain in the cosmetic data. */
export function ApplianceMaterial({material, params, collided = false}: {
  material: PartMaterial; params: ResolvedVisualParams; collided?: boolean; doorId?: string;
}) {
  const highlighted = false; // Door hover belongs to the service; result hover is local to this demo.
  const envMap = useApplianceEnvironment();
  const finish = {
    panel: [params.panelColor, 0.42, 0.1],
    cabinet: [params.cabinetColor, 0.57, 0.1],
    cabinetFront: [params.cabinetFrontColor, 0.7, 0.02],
    handleBar: [params.handleBarColor, 0.4, 0.12],
    base: [params.baseColor, 0.8, 0.02],
    interior: [params.interiorColor, 0.85, 0],
    doorTub: [params.interiorColor, 0.65, 0.02],
  } as const;
  const [color, roughness, metalness] = finish[material];
  return <meshStandardMaterial color={collided ? '#e02424' : color}
    roughness={highlighted ? roughness * 0.75 : roughness} metalness={metalness}
    envMap={envMap} envMapIntensity={material === 'panel' || material === 'handleBar' ? 0.055 : 0.02}
    emissive={collided ? '#e02424' : highlighted ? '#ffffff' : '#000000'} emissiveIntensity={collided ? 0.4 : highlighted ? 0.18 : 0} />;
}

export function ApplianceStaticSurfaces({parts,params}: {parts: StaticPart[];params: ResolvedVisualParams}) {
  const groups = useMemo(()=> {
    const batches = new Map<PartMaterial, Array<{box:BoxMm;radiusMm?:number}>>();
    for (const part of buildApplianceSurfaces(parts,params.cornerRadiusMm)) {
      const batch = batches.get(part.material) ?? [];
      batch.push(part); batches.set(part.material,batch);
    }
    return [...batches];
  },[parts,params.cornerRadiusMm]);
  return <group>{groups.map(([material,boxes])=><MmMeshBatch key={material} boxes={boxes}>
    <ApplianceMaterial material={material} params={params}/>
  </MmMeshBatch>)}</group>;
}

export function DoorLiner({tub,params}: {tub:BoxMm;params:ResolvedVisualParams}) {
  const boxes = useMemo(()=>doorLinerBoxes(tub).map((box,index)=>({box,radiusMm:index < 4 ? 1.5 : 0})),[tub]);
  return <MmMeshBatch boxes={boxes}><ApplianceMaterial material="doorTub" params={params}/></MmMeshBatch>;
}
