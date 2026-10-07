import { projects } from '../data/projects'
import { loadProjectCapture } from './projectCaptures'

type Selection = Readonly<{ index: number; pending: number | null; failed: boolean }>

/** One committed selection for copy, links, navigation and both display renderers. */
export function createProjectSelection(load: (index: number) => Promise<unknown>) {
  let snapshot: Selection = { index: 0, pending: null, failed: false }
  let revision = 0
  const listeners = new Set<() => void>()
  const preparers = new Set<(index: number) => Promise<unknown>>()
  const publish = (next: Selection) => { snapshot = next; listeners.forEach(listener => listener()) }
  return {
    get: () => snapshot.index,
    snapshot: () => snapshot,
    reset(index = 0) {
      revision++
      const next = projects[index] ? index : 0
      if (snapshot.index !== next || snapshot.pending !== null || snapshot.failed) publish({ index: next, pending: null, failed: false })
    },
    async request(index: number) {
      if (!projects[index]) return
      const request = ++revision
      if (index === snapshot.index) { publish({ ...snapshot, pending: null, failed: false }); return }
      publish({ ...snapshot, pending: index, failed: false })
      try {
        await Promise.all([load(index), ...Array.from(preparers, prepare => prepare(index))])
        if (request === revision) publish({ index, pending: null, failed: false })
      } catch {
        if (request === revision) publish({ ...snapshot, pending: null, failed: true })
      }
    },
    prepareWith(prepare: (index: number) => Promise<unknown>) {
      preparers.add(prepare)
      return () => { preparers.delete(prepare) }
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
  }
}

export const projectSelection = createProjectSelection(loadProjectCapture)
