/** Four-door visual family. Only the upper pair rotates, following the exact
 * validation hinge groups. Lower panels and the horizontal handle band stay fixed.
 * Surface subdivisions, finishes and interior detail are cosmetic only. */
import { useMemo } from 'react';
import type { ProductLayout } from '../../types/geometry';
import { doorRotationY } from '../../utils/layout';
import { mmToSceneVec3 } from '../../utils/units';
import { buildBespoke4DoorParts } from './bespoke4DoorParts';
import { MmMesh } from './ApplianceMesh';
import { ApplianceMaterial, ApplianceStaticSurfaces, DoorLiner } from './ApplianceSurfaces';
import type { ResolvedVisualParams } from './visualParams';

interface SamsungBespoke4DoorProps {
  layout: ProductLayout;
  params: ResolvedVisualParams;
  doorAnglesDeg: Record<string, number>;
  collidedDoorIds: Set<string>;
}

export function SamsungBespoke4Door({layout,params,doorAnglesDeg,collidedDoorIds}: SamsungBespoke4DoorProps) {
  const parts = useMemo(()=>buildBespoke4DoorParts(layout,params),[layout,params]);
  return <group>
    <ApplianceStaticSurfaces parts={parts.staticParts} params={params}/>
    {parts.doorColumns.map(({door,panels})=><group key={door.id}
      position={mmToSceneVec3(door.hingeXMm,0,door.hingeZMm)}
      rotation={[0,doorRotationY(door,doorAnglesDeg[door.id] ?? 0),0]}>
      {panels.map(panel=><group key={panel.id}>
        <MmMesh box={panel.frontPanel} rounded radiusMm={panel.radiusMm}>
        <ApplianceMaterial material="panel" params={params} doorId={door.id} collided={collidedDoorIds.has(door.id)}/>
        </MmMesh>
        <DoorLiner tub={panel.doorTub} params={params}/>
      </group>)}
    </group>)}
  </group>;
}
