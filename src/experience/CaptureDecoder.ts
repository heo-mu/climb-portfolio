import { projects } from '../data/projects'
import { loadProjectCapture } from './projectCaptures'

/** Owned by one WebGL scene; pending work cannot outlive its context. */
export class CaptureDecoder {
  private worker: Worker | null = null
  private serial = 0
  private pending = new Map<number, { resolve: (bitmap: ImageBitmap) => void; reject: (error: Error) => void }>()

  async decode(index: number, limit: number): Promise<ImageBitmap | HTMLImageElement> {
    const { desktop, width, height } = projects[index].screen
    const ratio = Math.min(1, limit / Math.max(width, height))
    if (typeof Worker === 'undefined') {
      const image = await loadProjectCapture(index)
      return typeof createImageBitmap === 'function' ? createImageBitmap(image, {
        resizeWidth: Math.round(width * ratio), resizeHeight: Math.round(height * ratio), resizeQuality: 'high',
        imageOrientation: 'flipY', premultiplyAlpha: 'none', colorSpaceConversion: 'none',
      }) : image
    }
    if (!this.worker) {
      this.worker = new Worker(new URL('./capture.worker.ts', import.meta.url), { type: 'module' })
      this.worker.onmessage = ({ data }: MessageEvent<{ id: number; bitmap?: ImageBitmap; error?: string }>) => {
        const pending = this.pending.get(data.id)
        this.pending.delete(data.id)
        if (!pending) { data.bitmap?.close(); return }
        if (data.bitmap) pending.resolve(data.bitmap)
        else pending.reject(new Error(data.error ?? 'Capture decode failed'))
      }
      this.worker.onerror = () => this.dispose()
    }
    const id = ++this.serial
    return new Promise<ImageBitmap>((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.worker!.postMessage({ id, url: new URL(desktop, location.href).href, width: Math.round(width * ratio), height: Math.round(height * ratio) })
    })
  }

  dispose() {
    this.worker?.terminate()
    this.worker = null
    this.pending.forEach(({ reject }) => reject(new Error('Capture decoder stopped')))
    this.pending.clear()
  }
}
