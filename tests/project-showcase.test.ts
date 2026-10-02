import { afterAll, describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { ProjectShowcase } from '../src/experience/ProjectShowcase'
import { SCREEN_HEIGHT } from '../src/experience/showcaseDevices'
import { guideRoute } from '../src/experience/grounding'
import { cameraPose, routePoint, showcaseShelfBlend, showcaseSite, terrainGeometry, TerrainSurface } from '../src/experience/terrain'
import { projects } from '../src/data/projects'

const terrain = terrainGeometry(), surface = new TerrainSurface(terrain)
const world = new THREE.Group(), showcase = new ProjectShowcase()
showcase.build(world, surface, () => new THREE.MeshBasicMaterial({ transparent: true }))
afterAll(() => {
  terrain.dispose()
  world.traverse(object => {
    if (object instanceof THREE.Mesh) { object.geometry.dispose(); (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => material.dispose()) }
  })
})

/** The camp's own view, where every route to Projects arrives. */
function campCamera(width: number, height: number) {
  const camera = new THREE.PerspectiveCamera(width / height < .95 ? 72 : 64, width / height, .08, 2400), target = new THREE.Vector3()
  cameraPose(showcaseSite.route, camera.position, target); camera.lookAt(target); camera.updateMatrixWorld(true)
  showcase.layout(camera, width, height)
  world.updateMatrixWorld(true)
  return camera
}
const lateral = (p: THREE.Vector3) => (p.x - showcaseSite.origin.x) * showcaseSite.right.x + (p.z - showcaseSite.origin.z) * showcaseSite.right.z
const forward = (p: THREE.Vector3) => (p.x - showcaseSite.origin.x) * showcaseSite.forward.x + (p.z - showcaseSite.origin.z) * showcaseSite.forward.z
const screenCorners = (screen: THREE.Object3D) => [[-.5, -1], [.5, -1], [-.5, 1], [.5, 1]].map(([x, y]) => new THREE.Vector3(x, y * SCREEN_HEIGHT / 2, 0).applyMatrix4(screen.matrixWorld))

describe('Projects exhibit', () => {
  it('builds one structure per project, each with its own silhouette', () => {
    campCamera(1920, 1080)
    const { items, scale } = showcase.structures
    expect(items.map(item => item.slug)).toEqual(projects.map(project => project.slug))
    const shapes = items.map(({ group }) => {
      const box = new THREE.Box3()
      group.traverse(object => { if (object instanceof THREE.Mesh && object.name !== 'showcase-screen') box.expandByObject(object) })
      const size = box.getSize(new THREE.Vector3()).divideScalar(scale)
      return [size.x, size.y, Math.hypot(size.x, size.z) - size.x]
    })
    // Pairwise, every two structures differ clearly in width, height or depth (display widths).
    for (let i = 0; i < shapes.length; i++) for (let j = i + 1; j < shapes.length; j++) {
      expect(Math.max(...shapes[i].map((value, axis) => Math.abs(value - shapes[j][axis]))), `${items[i].slug} vs ${items[j].slug}`).toBeGreaterThan(.06)
    }
  })

  it('shows every capture as an exact, unstretched 16:9 plane', () => {
    campCamera(1440, 900)
    for (const { slug, screen } of showcase.structures.items) {
      const [a, b, c] = screenCorners(screen)
      expect(a.distanceTo(b) / a.distanceTo(c), slug).toBeCloseTo(16 / 9, 6)
      const uv = screen.geometry.getAttribute('uv')
      expect([Math.min(...uv.array), Math.max(...uv.array)], `${slug}: whole capture`).toEqual([0, 1])
    }
  })

  it('seats each footing on the rendered terrain, outside the guide rope, clear of the face and of the walker', () => {
    for (const [width, height] of [[1920, 1080], [1440, 900], [1366, 768]]) {
      campCamera(width, height)
      const { items, scale } = showcase.structures
      const rope = guideRoute(surface).poles.map(pole => pole.anchor).filter(anchor => forward(anchor) > 0 && forward(anchor) < 30)
      for (const { slug, group, footing, bury } of items) {
        const label = `${slug} @${width}`, positions = footing.getAttribute('position'), point = new THREE.Vector3()
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
      for (const { slug, screen } of showcase.structures.items) {
        const ndc = screenCorners(screen).map(corner => corner.project(camera))
        const label = `${slug} @${width}x${height}`
        for (const p of ndc) {
          expect(p.z, label).toBeLessThan(1)
          // Without a page, the free span defaults to the middle of the view up to the trail lane.
          expect(p.x, label).toBeGreaterThan(-.001)
          expect(p.x, label).toBeLessThan(.725)
          expect(Math.abs(p.y), label).toBeLessThan(.86)
        }
        expect(Math.max(...ndc.map(p => p.x)) - Math.min(...ndc.map(p => p.x)), `${label}: a hero, not a thumbnail`).toBeGreaterThan(.36)
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

  it('levels its shelf without touching the walked line or the rope', () => {
    for (let t = .7; t <= .8; t += .002) {
      const p = routePoint(t)
      for (const offset of [-4, -2, 0, 2, 2.9]) expect(showcaseShelfBlend(p.x + offset * showcaseSite.right.x, p.z + offset * showcaseSite.right.z)).toBe(0)
    }
    const center = showcaseSite.toWorld(15, 7)
    expect(showcaseShelfBlend(center.x, center.z)).toBe(1)
  })
})
