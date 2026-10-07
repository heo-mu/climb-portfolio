import { describe, expect, it, vi } from 'vitest'
import { createProjectSelection } from '../src/experience/projectSelection'

const deferred = () => {
  let resolve!: () => void, reject!: () => void
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = () => no(new Error('Image unavailable')) })
  return { promise, resolve, reject }
}

describe('shared project selection', () => {
  it('starts with Deurim and waits for both decode and display preparation before committing', async () => {
    const image = deferred(), upload = deferred()
    const selection = createProjectSelection(() => image.promise)
    selection.prepareWith(() => upload.promise)
    expect(selection.snapshot()).toEqual({ index: 0, pending: null, failed: false })
    const change = selection.request(1)
    expect(selection.snapshot()).toEqual({ index: 0, pending: 1, failed: false })
    image.resolve(); await Promise.resolve()
    expect(selection.get()).toBe(0)
    upload.resolve(); await change
    expect(selection.snapshot()).toEqual({ index: 1, pending: null, failed: false })
  })

  it('ignores an older slow image after a later selection completes', async () => {
    const slow = deferred(), fast = deferred()
    const selection = createProjectSelection(index => index === 1 ? slow.promise : fast.promise)
    const first = selection.request(1), latest = selection.request(4)
    fast.resolve(); await latest
    expect(selection.get()).toBe(4)
    slow.resolve(); await first
    expect(selection.get()).toBe(4)
  })

  it('resets a fresh visit to Deurim and cancels in-flight selections', async () => {
    const image = deferred(), selection = createProjectSelection(() => image.promise)
    selection.reset(3)
    const pending = selection.request(2)
    selection.reset()
    image.resolve(); await pending
    expect(selection.snapshot()).toEqual({ index: 0, pending: null, failed: false })
    selection.reset(3)
    expect(selection.get()).toBe(3) // Explicit detail return remains supported.
  })

  it('retains the current project after a failed image and permits retry', async () => {
    const image = deferred(), load = vi.fn().mockReturnValueOnce(image.promise).mockResolvedValue(undefined)
    const selection = createProjectSelection(load)
    const first = selection.request(2)
    image.reject(); await first
    expect(selection.snapshot()).toEqual({ index: 0, pending: null, failed: true })
    await selection.request(2)
    expect(selection.snapshot()).toEqual({ index: 2, pending: null, failed: false })
  })

  it('cancels a pending request by selecting the current project and unregisters disposed renderers', async () => {
    const image = deferred(), selection = createProjectSelection(() => image.promise)
    const prepare = vi.fn().mockResolvedValue(undefined), unsubscribe = selection.prepareWith(prepare)
    unsubscribe()
    const change = selection.request(1)
    await selection.request(0)
    image.resolve(); await change
    expect(selection.get()).toBe(0)
    expect(prepare).not.toHaveBeenCalled()
    await selection.request(-1)
    expect(selection.get()).toBe(0)
  })
})
