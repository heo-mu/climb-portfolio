// The selected project, shared by the Projects list (React) and the 3D showcase (scene), without three.js here.
type Listener = (index: number) => void

let current = 0
const listeners = new Set<Listener>()

export const projectSelection = {
  get: () => current,
  set(index: number) {
    if (index === current) return
    current = index
    listeners.forEach(listener => listener(index))
  },
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  },
}
