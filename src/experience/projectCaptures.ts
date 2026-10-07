import { projects } from '../data/projects'

// Share decoded originals between the DOM preview and the WebGL texture upload.
const captures = new Map<number, Promise<HTMLImageElement>>()
export function loadProjectCapture(index: number) {
  if (!projects[index]) return Promise.reject(new Error('Unknown project'))
  let pending = captures.get(index)
  if (!pending) {
    const image = new Image()
    image.decoding = 'async'
    image.src = projects[index].screen.desktop
    pending = image.decode().then(() => image).catch(error => { captures.delete(index); throw error })
    captures.set(index, pending)
  }
  return pending
}
