// Decode and resize the original off the UI thread. Transfer the GPU-sized copy;
// no files are generated and the source used by the reading view is untouched.
self.onmessage = async ({ data }: MessageEvent<{ id: number; url: string; width: number; height: number }>) => {
  try {
    const response = await fetch(data.url)
    if (!response.ok) throw new Error(`Capture HTTP ${response.status}`)
    const bitmap = await createImageBitmap(await response.blob(), {
      resizeWidth: data.width, resizeHeight: data.height, resizeQuality: 'high',
      imageOrientation: 'flipY', premultiplyAlpha: 'none', colorSpaceConversion: 'none',
    })
    self.postMessage({ id: data.id, bitmap }, { transfer: [bitmap] })
  } catch (error) {
    self.postMessage({ id: data.id, error: String(error) })
  }
}

export {}
