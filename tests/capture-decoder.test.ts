import { afterEach, expect, it, vi } from 'vitest'
import { CaptureDecoder } from '../src/experience/CaptureDecoder'

class WorkerStub {
  static instance: WorkerStub
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: (() => void) | null = null
  postMessage = vi.fn()
  terminate = vi.fn()
  constructor() { WorkerStub.instance = this }
  respond(data: unknown) { this.onmessage?.({ data } as MessageEvent) }
}
afterEach(() => vi.unstubAllGlobals())
const setup = () => {
  vi.stubGlobal('Worker', WorkerStub)
  vi.stubGlobal('location', { href: 'https://portfolio.example/' })
  return new CaptureDecoder()
}

it('transfers a bounded bitmap without decoding an HTML image on the UI thread', async () => {
  const decoder = setup(), image = vi.fn()
  vi.stubGlobal('Image', image)
  const first = decoder.decode(0, 4096), second = decoder.decode(1, 2048)
  const worker = WorkerStub.instance
  expect(worker.postMessage.mock.calls.map(([request]) => [request.id, request.width, request.height])).toEqual([[1, 4096, 2304], [2, 2048, 1152]])
  const a = { close: vi.fn() }, b = { close: vi.fn() }
  worker.respond({ id: 2, bitmap: b }); worker.respond({ id: 1, bitmap: a })
  expect(await first).toBe(a); expect(await second).toBe(b)
  expect(image).not.toHaveBeenCalled()
  decoder.dispose()
})

it('rejects failures and lets a subsequent decode retry', async () => {
  const decoder = setup(), first = decoder.decode(0, 4096)
  WorkerStub.instance.respond({ id: 1, error: 'Capture HTTP 404' })
  await expect(first).rejects.toThrow('404')
  const retry = decoder.decode(0, 4096), bitmap = { close: vi.fn() }
  WorkerStub.instance.respond({ id: 2, bitmap })
  expect(await retry).toBe(bitmap)
  decoder.dispose()
})

it('terminates pending work and closes late transfers on scene disposal', async () => {
  const decoder = setup(), pending = decoder.decode(0, 4096)
  const rejected = expect(pending).rejects.toThrow('stopped')
  decoder.dispose()
  await rejected
  expect(WorkerStub.instance.terminate).toHaveBeenCalledOnce()
  const late = { close: vi.fn() }
  WorkerStub.instance.respond({ id: 1, bitmap: late })
  expect(late.close).toHaveBeenCalledOnce()
})
