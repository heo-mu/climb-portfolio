import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ScrollController } from './progress'
import type { MountainScene } from './MountainScene'

export function Scene({ controller, onFallback, active }: { controller: ScrollController; onFallback: () => void; active: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)
  const instance = useRef<MountainScene | null>(null)
  const enabled = useRef(active)
  useLayoutEffect(() => {
    enabled.current = active
    instance.current?.setActive(active)
  }, [active])

  useEffect(() => {
    let cancelled = false
    let dispose: (() => void) | undefined
    let raf = 0
    const initialize = async () => {
      try {
        const { MountainScene } = await import('./MountainScene')
        if (cancelled || !canvas.current) return
        const scene = new MountainScene({ canvas: canvas.current, root: canvas.current.closest<HTMLElement>('.expedition')!, onLost: onFallback, onProjectsReady: controller.setProjectsReady })
        instance.current = scene
        scene.setActive(enabled.current)
        const unsubscribe = controller.subscribe(scene.update)
        dispose = () => { unsubscribe(); scene.dispose(); instance.current = null }
        setReady(true)
      } catch (error) {
        // Visitors get the reading route; development keeps the actual cause.
        if (import.meta.env.DEV) console.error('[Scene] WebGL initialization failed', error)
        if (!cancelled) onFallback()
      }
    }
    // Paint Home before the optional WebGL module begins initialization.
    raf = requestAnimationFrame(() => { raf = requestAnimationFrame(() => { void initialize() }) })
    return () => { cancelled = true; cancelAnimationFrame(raf); dispose?.() }
  }, [controller, onFallback])

  return <div className="scene" data-ready={ready} aria-hidden="true"><canvas ref={canvas} /><div className="scene-vignette" /></div>
}
