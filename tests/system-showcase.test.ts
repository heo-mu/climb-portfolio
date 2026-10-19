import { afterAll, describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { ProjectShowcase } from '../src/experience/ProjectShowcase'
import { checkpointIndex, checkpointAt, checkpoints } from '../src/data/checkpoints'
import { cameraFieldOfView, cameraPose, systemShowcaseSite, terrainGeometry, TerrainSurface } from '../src/experience/terrain'
import { campZones, systemsPresentation, type ExpeditionFrame } from '../src/experience/progress'
import { SCREEN_HEIGHT, captureFit } from '../src/experience/showcaseDevices'

const terrain = terrainGeometry(), surface = new TerrainSurface(terrain), world = new THREE.Group()
const checkpoint = checkpointIndex('systems'), progress = checkpointAt('systems').progress
const showcase = new ProjectShowcase(null, null, {
  site: systemShowcaseSite, maxScale: 200, forward: [60, 80, 100, 120], checkpoint, linkSelector: '.system-showcase-link', contentSelector: '#systems .panel-content', dataset: 'systemShowcase',
  capture: { slug: 'design-system', screen: { desktop: new URL('../img/system/system.png', import.meta.url).href, width: 1671, height: 941 } },
})
showcase.build(world, surface, () => new THREE.MeshBasicMaterial({ transparent: true }))
afterAll(() => {
  showcase.dispose(); terrain.dispose()
  world.traverse(object => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => m.dispose()) } })
  vi.unstubAllGlobals(); vi.restoreAllMocks()
})

describe('Core Design System showcase', () => {
  it('loads one original texture, preserves its complete original image and keeps checkpoint spacing', async () => {
    const load = vi.spyOn(THREE.ImageLoader.prototype, 'loadAsync').mockResolvedValue({ width: 1671, height: 941 } as HTMLImageElement)
    vi.stubGlobal('window', { requestIdleCallback: (callback: () => void) => callback() })
    await Promise.all([showcase.prepare(0), showcase.prepare(0)])
    expect(load).toHaveBeenCalledTimes(1)
    expect(load).toHaveBeenCalledWith(new URL('../img/system/system.png', import.meta.url).href)
    const fit = captureFit(1671, 941)
    expect(fit.x / (fit.y * SCREEN_HEIGHT)).toBeCloseTo(1671 / 941, 10)
    expect(fit.x).toBeLessThanOrEqual(1); expect(fit.y).toBeLessThanOrEqual(1)
    expect(checkpoints.map(c => c.progress)).toEqual([0, 1/6, 2/6, 3/6, 4/6, 5/6, 1])
  })
  it.each([[1920,1080],[1440,900],[1280,800],[1200,800]])('keeps the shared display grounded, large and clear throughout arrival at %ipx', (width,height) => {
    const camera = new THREE.PerspectiveCamera(cameraFieldOfView(progress,width/height,width),width/height,.08,2400), target = new THREE.Vector3()
    cameraPose(progress,camera.position,target); camera.lookAt(target); camera.updateMatrixWorld(true)
    showcase.layout(camera,width,height)
    expect(showcase.structures.enabled).toBe(true)
    const {group,screen,footing} = showcase.structures.items[0]
    expect(group.getObjectByName('display-shell')).toBeDefined()
    expect(group.getObjectByName('display-foot')).toBeDefined()
    const rest = group.matrixWorld.toArray()
    const positions = footing.getAttribute('position')
    let contact = Infinity
    for(let i=0;i<positions.count;i++) { const p=new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(group.matrixWorld);contact=Math.min(contact,p.y-surface.heightAt(p.x,p.z)) }
    expect(contact).toBeLessThan(.01); expect(contact).toBeGreaterThan(-1)
    const [entry,exit]=campZones[checkpoint].arrival
    for(let i=0;i<=10;i++) {
      const route=THREE.MathUtils.lerp(entry,exit,i/10)
      cameraPose(route,camera.position,target);camera.fov=cameraFieldOfView(route,width/height,width);camera.updateProjectionMatrix();camera.lookAt(target);camera.updateMatrixWorld(true)
      showcase.update({time:i,journeyProgress:route,destination:checkpoint,reducedMotion:true,sections:checkpoints.map(()=>({interactive:true})),returningHome:false} as unknown as ExpeditionFrame,camera)
      world.updateMatrixWorld(true)
      expect(group.matrixWorld.toArray()).toEqual(rest)
      expect(group.visible).toBe(true)
      expect(screen.material.uniforms.presence.value).toBeCloseTo(1,5)
      const corners=[-.5,.5].flatMap(x=>[-SCREEN_HEIGHT/2,SCREEN_HEIGHT/2].map(y=>new THREE.Vector3(x,y,0).applyMatrix4(screen.matrixWorld).project(camera)))
      for(const p of corners) { expect(Math.abs(p.x)).toBeLessThan(1);expect(Math.abs(p.y)).toBeLessThan(1) }
      expect((Math.max(...corners.map(p=>p.x))-Math.min(...corners.map(p=>p.x)))/2).toBeGreaterThan(.25)
    }
    expect(systemsPresentation(checkpointAt('high-camp').progress).presence).toBe(0)
    expect(systemsPresentation(checkpointAt('camp-two').progress).focus).toBe(0)
    expect(systemsPresentation(checkpointAt('summit').progress).focus).toBe(0)
  })
})
