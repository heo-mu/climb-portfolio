import * as THREE from 'three'

/** Project a planar display into an exact clipped native-link hit area. Shared by both camp displays. */
export function projectDisplayLink(link: HTMLAnchorElement, screen: THREE.Object3D, camera: THREE.Camera,
  viewport: { width: number; height: number }, face: { width: number; height: number }, previous: string, point: THREE.Vector3) {
  screen.updateWorldMatrix(true, false)
  const projected = [[-1, 1], [1, 1], [1, -1], [-1, -1]].map(([x, y]) => {
    point.set(x * face.width / 2, y * face.height / 2, 0).applyMatrix4(screen.matrixWorld).project(camera)
    return [(point.x + 1) / 2 * viewport.width, (1 - point.y) / 2 * viewport.height]
  })
  const left = Math.min(...projected.map(p => p[0])), top = Math.min(...projected.map(p => p[1]))
  const x = Math.round(left), y = Math.round(top)
  const w = Math.round(Math.max(...projected.map(p => p[0])) - left)
  const h = Math.round(Math.max(...projected.map(p => p[1])) - top)
  const polygon = projected.map(p => `${(p[0] - x).toFixed(2)}px ${(p[1] - y).toFixed(2)}px`).join(', ')
  const state = `${x},${y},${w},${h}|${polygon}`
  if (state !== previous) {
    link.style.visibility = 'visible'
    link.style.transform = `translate(${x}px, ${y}px)`
    link.style.width = w + 'px'; link.style.height = h + 'px'
    link.style.clipPath = `polygon(${polygon})`
  }
  return state
}
