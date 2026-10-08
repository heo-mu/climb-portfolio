import { afterAll, describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { ProjectShowcase } from '../src/experience/ProjectShowcase'
import { SCREEN_HEIGHT, captureFit } from '../src/experience/showcaseDevices'
import { guideRoute } from '../src/experience/grounding'
import { cameraFieldOfView, cameraPose, exhibitionFocus, groundHeight, routePoint, showcaseShelfBlend, showcaseSite, terrainGeometry, TerrainSurface } from '../src/experience/terrain'
import { projects } from '../src/data/projects'
import * as captures from '../src/experience/projectCaptures'
import { campZones, type ExpeditionFrame } from '../src/experience/progress'

const terrain = terrainGeometry(), surface = new TerrainSurface(terrain)
const world = new THREE.Group(), showcase = new ProjectShowcase()
showcase.build(world, surface, () => new THREE.MeshBasicMaterial({ transparent: true }))
afterAll(() => {
  showcase.dispose()
  terrain.dispose()
  world.traverse(object => {
    if (object instanceof THREE.Mesh) { object.geometry.dispose(); (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => material.dispose()) }
  })
})

/** The camp's own view, where every route to Projects arrives. */
function campCamera(width: number, height: number) {
  const camera = new THREE.PerspectiveCamera(cameraFieldOfView(showcaseSite.progress, width / height, width), width / height, .08, 2400), target = new THREE.Vector3()
  cameraPose(showcaseSite.progress, camera.position, target); camera.lookAt(target); camera.updateMatrixWorld(true)
  showcase.layout(camera, width, height)
  world.updateMatrixWorld(true)
  return camera
}
const lateral = (p: THREE.Vector3) => (p.x - showcaseSite.origin.x) * showcaseSite.right.x + (p.z - showcaseSite.origin.z) * showcaseSite.right.z
const forward = (p: THREE.Vector3) => (p.x - showcaseSite.origin.x) * showcaseSite.forward.x + (p.z - showcaseSite.origin.z) * showcaseSite.forward.z
const screenCorners = (screen: THREE.Object3D) => [[-.5, -1], [.5, -1], [-.5, 1], [.5, 1]].map(([x, y]) => new THREE.Vector3(x, y * SCREEN_HEIGHT / 2, 0).applyMatrix4(screen.matrixWorld))

describe('Projects exhibit', () => {
  it('holds the loaded capture, crossfades only the screen and settles rapid changes on the final selection', async () => {
    const pending = new Map<string, () => void>()
    vi.stubGlobal('Image', class {
      src = ''
      decode() { return new Promise<void>(resolve => pending.set(this.src, resolve)) }
    })
    vi.stubGlobal('window', { requestIdleCallback: (callback: () => void) => callback() })
    const exhibit = new ProjectShowcase(), scene = new THREE.Group()
    const camera = campCamera(1440, 900)
    exhibit.build(scene, surface, () => new THREE.MeshBasicMaterial({ transparent: true }))
    expect(exhibit.ready, 'building alone must not briefly activate an unplaced display').toBe(false)
    exhibit.layout(camera, 1440, 900)
    const { group, screen } = exhibit.structures.items[0], pose = group.matrixWorld.toArray()
    const uniforms = screen.material.uniforms
    let time = 0
    const tick = (reducedMotion = false) => {
      time += .04
      exhibit.update({ time, journeyProgress: .8, curveParameter: 0, destination: 4, reducedMotion, returningHome: false, sections: [] } as unknown as ExpeditionFrame, camera)
      scene.updateMatrixWorld(true)
      expect(group.matrixWorld.toArray()).toEqual(pose)
      expect(group.visible).toBe(exhibit.ready)
    }
    const decode = async (index: number) => {
      await vi.waitFor(() => expect(pending.has(projects[index].screen.desktop)).toBe(true))
      pending.get(projects[index].screen.desktop)!()
      // decode, idle and upload each continue on the microtask queue.
      for (let i = 0; i < 6; i++) await Promise.resolve()
    }
    try {
      tick()
      await decode(0)
      for (let i = 0; i < 9; i++) tick()
      const original = uniforms.toMap.value
      expect(original.image.src).toBe(projects[0].screen.desktop)
      expect(original.colorSpace).toBe(THREE.SRGBColorSpace)
      exhibit.select(1)
      for (let i = 0; i < 12; i++) tick()
      expect(uniforms.toMap.value).toBe(original)
      expect(uniforms.mixAmount.value).toBe(1)
      await decode(1)
      tick()
      expect(uniforms.fromMap.value).toBe(original)
      expect(uniforms.mixAmount.value).toBeGreaterThan(0)
      expect(uniforms.mixAmount.value).toBeLessThan(1)
      exhibit.select(2); exhibit.select(4)
      await decode(2); await decode(3); await decode(4)
      for (let i = 0; i < 18; i++) tick()
      expect(uniforms.toMap.value.image.src).toBe(projects[4].screen.desktop)
      expect(uniforms.mixAmount.value).toBe(1)
      exhibit.select(0)
      tick(true)
      expect(uniforms.toMap.value).toBe(original)
      expect(uniforms.mixAmount.value).toBe(1)
      // A warm return settles an interrupted crossfade; later choices still animate.
      exhibit.select(1)
      tick()
      expect(uniforms.mixAmount.value).toBeLessThan(1)
      exhibit.select(1, true)
      tick()
      expect(uniforms.mixAmount.value).toBe(1)
      exhibit.select(0, true)
      tick()
      expect(uniforms.toMap.value).toBe(original)
      expect(uniforms.mixAmount.value).toBe(1)
      exhibit.select(1)
      tick()
      expect(uniforms.mixAmount.value).toBeLessThan(1)
    } finally {
      exhibit.dispose()
      scene.traverse(object => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => material.dispose()) } })
      vi.unstubAllGlobals()
    }
  })

  it('prepares one bounded GPU copy per original and closes its bitmap on disposal', async () => {
    const original = { naturalWidth: 7680, naturalHeight: 4320 } as HTMLImageElement
    const bitmap = { width: 4096, height: 2304, close: vi.fn() }
    const decode = vi.spyOn(captures, 'loadProjectCapture').mockResolvedValue(original)
    const resize = vi.fn().mockResolvedValue(bitmap)
    vi.stubGlobal('createImageBitmap', resize)
    vi.stubGlobal('window', { requestIdleCallback: (callback: () => void) => callback() })
    const exhibit = new ProjectShowcase()
    try {
      const first = exhibit.prepare(0)
      expect(exhibit.prepare(0)).toBe(first)
      await first
      await exhibit.prepare(0)
      expect(decode).toHaveBeenCalledTimes(1)
      expect(resize).toHaveBeenCalledExactlyOnceWith(original, {
        resizeWidth: 4096, resizeHeight: 2304, resizeQuality: 'high',
        imageOrientation: 'flipY', premultiplyAlpha: 'none', colorSpaceConversion: 'none',
      })
      expect(original.naturalWidth).toBe(7680)
      expect(bitmap.close).not.toHaveBeenCalled()
    } finally {
      exhibit.dispose()
      decode.mockRestore()
      vi.unstubAllGlobals()
    }
    expect(bitmap.close).toHaveBeenCalledTimes(1)
  })

  it('keeps one frame and its pose across every project selection', () => {
    campCamera(1920, 1080)
    expect(showcase.structures.items).toHaveLength(1)
    const { group, screen } = showcase.structures.items[0]
    const pose = group.matrixWorld.toArray()
    for (let i = 0; i < projects.length; i++) {
      showcase.select(i)
      world.updateMatrixWorld(true)
      expect(showcase.structures.items[0].group).toBe(group)
      expect(group.matrixWorld.toArray()).toEqual(pose)
      expect(screen.material.toneMapped).toBe(false)
      expect(screen.material.fog).toBe(false)
      expect(screen.renderOrder).toBeGreaterThan(0)
    }
  })

  it('contains the full source at its native aspect ratio', () => {
    for (const { screen } of projects) {
      const fit = captureFit(screen.width, screen.height)
      expect(fit.x / (fit.y * SCREEN_HEIGHT)).toBeCloseTo(screen.width / screen.height, 8)
      expect(Math.max(fit.x, fit.y)).toBe(1)
    }
    expect(captureFit(1000, 1000).toArray()).toEqual([9 / 16, 1])
    expect(captureFit(2000, 500).toArray()).toEqual([1, 4 / 9])
  })

  it('shows every capture as an exact, unstretched 16:9 plane', () => {
    campCamera(1440, 900)
    for (const { screen } of showcase.structures.items) {
      const [a, b, c] = screenCorners(screen)
      expect(a.distanceTo(b) / a.distanceTo(c), 'display').toBeCloseTo(16 / 9, 6)
      const uv = screen.geometry.getAttribute('uv')
      expect([Math.min(...uv.array), Math.max(...uv.array)], `display: whole capture`).toEqual([0, 1])
    }
  })

  it('seats each footing on the rendered terrain, outside the guide rope, clear of the face and of the walker', () => {
    for (const [width, height] of [[1920, 1080], [1440, 900], [1366, 768]]) {
      campCamera(width, height)
      const { items } = showcase.structures
      const rope = guideRoute(surface).poles.map(pole => pole.anchor).filter(anchor => forward(anchor) > 0 && forward(anchor) < 30)
      for (const { group, footing, bury, scale } of items) {
        const label = `display @${width}`, positions = footing.getAttribute('position'), point = new THREE.Vector3()
        footing.computeBoundingBox()
        const threshold = footing.boundingBox!.min.y + (footing.boundingBox!.max.y - footing.boundingBox!.min.y) * .09
        let lowest = Infinity, nearest = Infinity
        for (let i = 0; i < positions.count; i++) {
          point.fromBufferAttribute(positions, i).applyMatrix4(group.matrixWorld)
          nearest = Math.min(nearest, lateral(point))
          if (positions.getY(i) > threshold) continue
          // The lower hull is embedded, never floating: no gap under it, buried at most by its own depth.
          const depth = surface.heightAt(point.x, point.z) - point.y
          expect(depth, label).toBeGreaterThan(-.005)
          lowest = Math.min(lowest, depth)
        }
        expect(lowest, `${label}: seated, not sunk`).toBeLessThan(bury * scale + .05)
        expect(nearest, `${label}: footing beyond the rope`).toBeGreaterThan(Math.max(...rope.map(lateral)) + .2)
        group.traverse(object => {
          if (!(object instanceof THREE.Mesh) || object.geometry === footing) return
          const box = new THREE.Box3().setFromObject(object)
          if (box.min.y - showcaseSite.level < .1 * scale) return
          for (const corner of [box.min, box.max]) {
            // Above-ground parts clear the snow face; below head height they keep out of the walked line.
            expect(corner.y - surface.heightAt(corner.x, corner.z), `${label}: ${object.type} above the snow`).toBeGreaterThan(.1)
            if (corner.y - showcaseSite.level < 2.3) expect(lateral(corner), `${label}: ${object.type} beside the walker`).toBeGreaterThan(1)
          }
        })
      }
    }
  })

  it('frames each display large, between the panel text and the trail, in the camp view', () => {
    for (const [width, height] of [[1920, 1080], [1600, 900], [1440, 900], [1366, 768]]) {
      const camera = campCamera(width, height)
      expect(showcase.structures.enabled).toBe(true)
      for (const { screen } of showcase.structures.items) {
        const ndc = screenCorners(screen).map(corner => corner.project(camera))
        const label = `display @${width}x${height}`
        expect(ndc[0].x, `${label}: parallel vertical edges`).toBeCloseTo(ndc[2].x, 8)
        expect(ndc[1].x).toBeCloseTo(ndc[3].x, 8)
        expect(ndc[0].y, `${label}: level horizontal edges`).toBeCloseTo(ndc[1].y, 8)
        expect(ndc[2].y).toBeCloseTo(ndc[3].y, 8)
        expect((ndc[1].x - ndc[0].x) * width / ((ndc[2].y - ndc[0].y) * height)).toBeCloseTo(16 / 9, 8)
        for (const p of ndc) {
          expect(p.z, label).toBeLessThan(1)
          // The editorial panel occupies the left third; the entire display clears it.
          expect(p.x, label).toBeGreaterThan(-.321)
          expect(p.x, label).toBeLessThan(.725)
          expect(Math.abs(p.y), label).toBeLessThan(.86)
        }
        expect(Math.max(...ndc.map(p => p.x)) - Math.min(...ndc.map(p => p.x)), `${label}: a hero, not a thumbnail`).toBeGreaterThan(.7)
      }
    }
  })

  it('joins the tilted housing to the stand without putting support geometry over the capture', () => {
    for (const [width, height] of [[1920, 1080], [1600, 900], [1366, 768]]) {
      const camera = campCamera(width, height), target = new THREE.Vector3()
      const { group, screen } = showcase.structures.items[0]
      const neck = group.getObjectByName('display-neck') as THREE.Mesh
      const hinge = group.getObjectByName('display-hinge') as THREE.Mesh
      const hingeBox = new THREE.Box3().setFromObject(hinge)
      const footBox = new THREE.Box3().setFromObject(group.getObjectByName('display-foot')!)
      const points = neck.geometry.getAttribute('position')
      let contacts = 0, footContacts = 0
      for (let i = 0; i < points.count; i++) {
        const point = new THREE.Vector3().fromBufferAttribute(points, i).applyMatrix4(neck.matrixWorld)
        if (hingeBox.containsPoint(point)) contacts++
        if (footBox.containsPoint(point)) footContacts++
      }
      expect(contacts, 'neck physically overlaps its rear mounting joint').toBeGreaterThan(0)
      expect(footContacts, 'neck physically overlaps its weighted base').toBeGreaterThan(0)
      for (const fraction of [0, .5, 1]) {
        const route = THREE.MathUtils.lerp(...campZones[4].arrival, fraction)
        cameraPose(route, camera.position, target)
        for (let x = -.48; x <= .48; x += .08) for (let y = -.27; y <= .27; y += .03) {
          const point = new THREE.Vector3(x, y, 0).applyMatrix4(screen.matrixWorld)
          const distance = camera.position.distanceTo(point)
          const ray = new THREE.Raycaster(camera.position, point.clone().sub(camera.position).normalize(), 0, distance - .001)
          expect(ray.intersectObjects([neck, hinge]), 'support stays behind every part of the screen').toHaveLength(0)
        }
      }
    }
  })

  it('shows the flat capture instead on portrait screens', () => {
    campCamera(390, 844)
    expect(showcase.structures.enabled).toBe(false)
    expect(showcase.structures.items.every(item => !item.group.visible)).toBe(true)
    campCamera(1440, 900)
    expect(showcase.structures.enabled).toBe(true)
  })

  it('has the complete exhibit visible throughout shared arrival, and fades reversibly outside it', async () => {
    vi.stubGlobal('window', { requestIdleCallback: (callback: () => void) => callback() })
    vi.stubGlobal('Image', class { src = ''; decode() { return Promise.resolve() } })
    showcase.select(0); await showcase.prepare(0)
    vi.unstubAllGlobals()
    for (const [width, height] of [[1920, 1080], [1600, 900], [1440, 900], [1366, 768], [1280, 800]]) {
      const camera = campCamera(width, height), target = new THREE.Vector3()
      const { group, screen } = showcase.structures.items[0]
      const presence = (route: number) => {
        camera.fov = cameraFieldOfView(route, width / height, width); camera.updateProjectionMatrix()
        cameraPose(route, camera.position, target); camera.lookAt(target); camera.updateMatrixWorld(true)
        showcase.update({ journeyProgress: route, time: route, curveParameter: 0, destination: 0, sections: [] } as unknown as ExpeditionFrame, camera)
        return screen.material.uniforms.presence.value as number
      }
      for (const route of [.6, .69, .72]) { expect(presence(route)).toBe(0); expect(group.visible).toBe(false) }
      const [entry, exit] = campZones[4].arrival
      for (let i = 0; i <= 20; i++) expect(presence(entry + (exit - entry) * i / 20), `whole exhibit @${width}, sample ${i}`).toBe(1)
      // The camera travels the entire reading distance. Check real world-space
      // sightlines after the local mount transforms, not only its opacity flag.
      for (const fraction of [0, .25, .5, .75, 1]) {
        presence(entry + (exit - entry) * fraction)
        for (const corner of [...screenCorners(screen), ...Array.from({ length: 9 }, (_, i) => new THREE.Vector3(-.5 + i / 8, -SCREEN_HEIGHT / 2, 0).applyMatrix4(screen.matrixWorld))]) {
          const ray = new THREE.Vector3(), distance = camera.position.distanceTo(corner)
          for (let step = 1; step < distance; step += 2) {
            ray.lerpVectors(camera.position, corner, step / distance)
            expect(ray.y - surface.heightAt(ray.x, ray.z), `unoccluded reading screen @${width}, ${fraction}`).toBeGreaterThan(.05)
          }
        }
      }
      const values = Array.from({ length: 151 }, (_, i) => presence(.72 + i * .0004))
      expect(values.some(value => value > 0 && value < 1), `spatial fade @${width}`).toBe(true)
      for (let i = 150; i >= 0; i--) expect(presence(.72 + i * .0004)).toBeCloseTo(values[i], 8)
    }
  })

  it('keeps the exhibit and its shadows fixed in world space through approach, dwell and departure in both directions', () => {
    const camera = campCamera(1920, 1080), target = new THREE.Vector3()
    const objects = [showcase.group, ...showcase.group.children]
    const poses = objects.map(object => object.matrixWorld.toArray())
    const scales = objects.map(object => object.scale.toArray())
    for (const direction of [1, -1]) for (let i = 0; i <= 200; i++) {
      const route = direction > 0 ? .65 + i * .0015 : .95 - i * .0015
      cameraPose(route, camera.position, target)
      camera.fov = cameraFieldOfView(route, camera.aspect, 1920)
      camera.updateProjectionMatrix(); camera.lookAt(target); camera.updateMatrixWorld(true)
      showcase.update({ journeyProgress: route, time: route, destination: 0, sections: [] } as unknown as ExpeditionFrame, camera)
      world.updateMatrixWorld(true)
      objects.forEach((object, index) => {
        expect(object.matrixWorld.toArray()).toEqual(poses[index])
        expect(object.scale.toArray()).toEqual(scales[index])
      })
    }
  })

  it('levels its shelf without touching the walked line or the rope', () => {
    for (let t = .7; t <= .8; t += .002) {
      const p = routePoint(t)
      for (const offset of [-4, -2, 0, 2, 2.9]) expect(showcaseShelfBlend(p.x + offset * showcaseSite.right.x, p.z + offset * showcaseSite.right.z)).toBe(0)
    }
    const center = showcaseSite.toWorld(110, 90)
    expect(showcaseShelfBlend(center.x, center.z)).toBe(1)
  })

  it('confines the portrait lens and camera staging to Projects, with continuous approach and exit', () => {
    for (const route of [0, .1, .25, .5, .69, .91, 1]) {
      expect(exhibitionFocus(route)).toBe(0)
      expect(cameraFieldOfView(route, 16 / 9, 1920)).toBe(64)
    }
    expect(cameraFieldOfView(.8, 16 / 9, 1920)).toBe(42)
    expect(cameraFieldOfView(.75, 390 / 844, 390)).toBe(72)
    const a = new THREE.Vector3(), b = new THREE.Vector3(), target = new THREE.Vector3()
    for (let route = .7; route < .815; route += .0001) {
      cameraPose(route, a, target); cameraPose(route + .0001, b, target)
      expect(a.distanceTo(b)).toBeLessThan(.35)
      expect(a.y - groundHeight(a.x, a.z), `camera above ground at ${route}`).toBeGreaterThan(1)
    }
  })
})
