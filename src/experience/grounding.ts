import * as THREE from 'three'
import { routePoint, seeded, TerrainSurface } from './terrain'

const up = new THREE.Vector3(0, 1, 0)
export const ROPE_RADIUS = .012
export const ROPE_CLEARANCE = .24

export function groundPole(surface: TerrainSurface, x: number, z: number, height: number, lean = .16) {
  const axis = up.clone().lerp(surface.normalAt(x, z), lean).normalize()
  const foot = new THREE.Vector3(x, surface.heightAt(x, z), z)
  const buried = .18
  return {
    foot, axis, height,
    center: foot.clone().addScaledVector(axis, (height - buried) / 2),
    length: height + buried,
    rotation: new THREE.Quaternion().setFromUnitVectors(up, axis),
    anchor: foot.clone().addScaledVector(axis, height - .065),
  }
}

export class HangingRope extends THREE.Curve<THREE.Vector3> {
  constructor(readonly start: THREE.Vector3, readonly end: THREE.Vector3, readonly sag: number) { super() }
  getPoint(t: number, target = new THREE.Vector3()) {
    target.copy(this.start).lerp(this.end, t)
    target.y -= 4 * t * (1 - t) * this.sag
    return target
  }
}

export function guideRoute(surface: TerrainSurface) {
  const at = (t: number) => {
    const p = routePoint(t)
    return { t, ...groundPole(surface, p.x + 3.15 + Math.sin(t * 47) * .16, p.z, 1.02 + seeded(Math.round(t * 10000) + 64) * .1) }
  }
  const poles = Array.from({ length: 151 }, (_, i) => at(i / 150))
  // Insert supports at convex shoulders instead of lifting a rope off its attachment.
  for (let i = 0; i < poles.length - 1; i++) {
    const a = poles[i], b = poles[i + 1]
    const blocked = Array.from({ length: 31 }, (_, n) => a.anchor.clone().lerp(b.anchor, (n + 1) / 32))
      .some(p => p.y - surface.heightAt(p.x, p.z) < ROPE_CLEARANCE + .06)
    if (blocked && a.foot.distanceTo(b.foot) > 1.4) { poles.splice(i + 1, 0, at((a.t + b.t) / 2)); i-- }
  }
  const ropes = poles.slice(0, -1).map((a, i) => {
    const b = poles[i + 1]
    let sag = Math.min(.26, a.anchor.distanceTo(b.anchor) * .027)
    for (let n = 1; n < 64; n++) {
      const t = n / 64, p = a.anchor.clone().lerp(b.anchor, t)
      sag = Math.min(sag, (p.y - surface.heightAt(p.x, p.z) - ROPE_CLEARANCE) / (4 * t * (1 - t)))
    }
    return new HangingRope(a.anchor, b.anchor, Math.max(0, sag * .9))
  })
  return { poles, ropes }
}

/** Seat the actual lower hull, accounting for yaw, scale, slope and local curvature. */
export function seatOnGround(object: THREE.Object3D, geometry: THREE.BufferGeometry, surface: TerrainSurface, embed: number) {
  geometry.computeBoundingBox()
  const bounds = geometry.boundingBox!, threshold = bounds.min.y + (bounds.max.y - bounds.min.y) * .09
  const p = geometry.getAttribute('position'), point = new THREE.Vector3()
  let height = Infinity
  for (let i = 0; i < p.count; i++) {
    if (p.getY(i) > threshold) continue
    point.fromBufferAttribute(p, i).multiply(object.scale).applyQuaternion(object.quaternion)
    height = Math.min(height, surface.heightAt(object.position.x + point.x, object.position.z + point.z) - point.y)
  }
  object.position.y = height - embed
  object.updateMatrix()
}

/** A subdivided contact patch follows the surface; flat decals floated on slopes. */
export function contactPatch(surface: TerrainSurface, x: number, z: number, width: number, length: number, yaw = 0) {
  const geometry = new THREE.PlaneGeometry(width, length, 6, 6)
  geometry.rotateX(-Math.PI / 2); geometry.rotateY(yaw)
  const p = geometry.getAttribute('position')
  for (let i = 0; i < p.count; i++) {
    const px = p.getX(i) + x, pz = p.getZ(i) + z
    p.setXYZ(i, px, surface.heightAt(px, pz) + .012, pz)
  }
  geometry.computeVertexNormals()
  return geometry
}
