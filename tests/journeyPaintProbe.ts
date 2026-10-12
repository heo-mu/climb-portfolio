/** Samples the actual default framebuffer before composition; no screenshots or files. */
type JourneyPaint = { visible: boolean; colors: number; opaque: number; at: number }
declare global { interface Window { journeyPaint: { frames: JourneyPaint[] } } }

export function installJourneyPaintProbe() {
  const probe = window.journeyPaint = { frames: [] as JourneyPaint[] }
  const pending = new WeakSet<object>()
  for (const prototype of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
    for (const name of ['drawArrays', 'drawElements'] as const) {
      const original = prototype[name]
      prototype[name] = function (this: WebGLRenderingContext, ...args: number[]) {
        Reflect.apply(original, this, args)
        const canvas = this.canvas as HTMLCanvasElement
        if (!canvas.closest('.scene') || pending.has(this)) return
        pending.add(this)
        // All mesh draws finish in this task; sample before the browser discards
        // a non-preserved drawing buffer after presenting it.
        queueMicrotask(() => {
          pending.delete(this)
          if (this.isContextLost() || this.getParameter(this.FRAMEBUFFER_BINDING)) return
          const colors = new Set<string>(), pixel = new Uint8Array(4)
          let opaque = 0
          for (const x of [.1, .35, .65, .9]) for (const y of [.15, .45, .75]) {
            this.readPixels(Math.floor(this.drawingBufferWidth * x), Math.floor(this.drawingBufferHeight * y), 1, 1, this.RGBA, this.UNSIGNED_BYTE, pixel)
            colors.add(Array.from(pixel).join(','))
            if (pixel[3] === 255 && pixel[0] + pixel[1] + pixel[2] > 0) opaque++
          }
          const layer = canvas.closest<HTMLElement>('.journey-layer')!
          const style = getComputedStyle(canvas), parent = getComputedStyle(layer)
          probe.frames.push({ visible: layer.dataset.active === 'true' && style.visibility === 'visible' && parent.visibility === 'visible' && Number(style.opacity) === 1 && Number(parent.opacity) === 1, colors: colors.size, opaque, at: performance.now() })
          if (probe.frames.length > 180) probe.frames.shift()
        })
      }
    }
  }
}
