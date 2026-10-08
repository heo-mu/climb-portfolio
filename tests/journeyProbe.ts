/** Browser-only instrumentation. No production globals or saved profiling artifacts. */
export type JourneyProbe = {
  contexts: number; shaders: number; uploads: number; buffers: number; textures: number
  deletedBuffers: number; deletedTextures: number; draws: number; decodes: number
}
declare global { interface Window { journeyProbe: JourneyProbe } }

export function installJourneyProbe() {
  const counts = window.journeyProbe = { contexts: 0, shaders: 0, uploads: 0, buffers: 0, textures: 0, deletedBuffers: 0, deletedTextures: 0, draws: 0, decodes: 0 }
  const contexts = new WeakSet<object>()
  const original = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
    const context = Reflect.apply(original, this, [type, ...args])
    if (context && /webgl/i.test(type) && !contexts.has(context)) { contexts.add(context); counts.contexts++ }
    return context
  } as typeof original
  for (const prototype of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
    const methods = prototype as unknown as Record<string, (...args: unknown[]) => unknown>
    const watched: [string, keyof JourneyProbe][] = [
      ['compileShader', 'shaders'], ['texImage2D', 'uploads'], ['texSubImage2D', 'uploads'],
      ['createBuffer', 'buffers'], ['createTexture', 'textures'], ['deleteBuffer', 'deletedBuffers'], ['deleteTexture', 'deletedTextures'],
      ['drawElements', 'draws'], ['drawArrays', 'draws'],
    ]
    for (const [name, key] of watched) {
      const method = methods[name]
      methods[name] = function (...args) { counts[key]++; return Reflect.apply(method, this, args) }
    }
  }
  const post = Worker.prototype.postMessage
  Worker.prototype.postMessage = function (this: Worker, ...args: Parameters<typeof post>) {
    if (args[0]?.url) counts.decodes++
    return Reflect.apply(post, this, args)
  } as typeof post
}
