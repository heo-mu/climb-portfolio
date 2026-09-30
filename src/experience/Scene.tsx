import { useEffect, useRef, useState } from 'react'
import type { ScrollController } from './progress'
import { checkpoints } from '../data/expedition'

export function Scene({ controller, onFallback }: { controller: ScrollController; onFallback: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const beacon = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    let dispose: (() => void) | undefined
    const timer = window.setTimeout(() => { if (!cancelled) onFallback() }, 12000)
    import('./MountainScene').then(({ MountainScene }) => {
      if (cancelled || !canvas.current) return
      try {
        const scene = new MountainScene({
          canvas: canvas.current,
          onLost: onFallback,
          onBeacon: (x, y, visible) => {
            if (!beacon.current) return
            beacon.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
            beacon.current.style.visibility = visible ? 'visible' : 'hidden'
          },
        })
        const unsubscribe = controller.subscribe(frame => {
          scene.update(frame)
          const label = beacon.current
          if (label) {
            label.dataset.camp = String(frame.active)
            label.querySelector('[data-beacon-index]')!.textContent = checkpoints[frame.active].index
            label.querySelector('[data-beacon-altitude]')!.textContent = `${checkpoints[frame.active].altitude} M`
          }
        })
        dispose = () => { unsubscribe(); scene.dispose() }
        window.clearTimeout(timer)
        setLoading(false)
      } catch { window.clearTimeout(timer); onFallback() }
    }).catch(onFallback)
    return () => { cancelled = true; window.clearTimeout(timer); dispose?.() }
  }, [controller, onFallback])

  return <>
    <div className="scene" aria-hidden="true"><canvas ref={canvas} /><div className="scene-shade" /><div className="scene-vignette" /></div>
    <div className="world-beacon" ref={beacon} aria-hidden="true"><span data-beacon-index>00</span><span data-beacon-altitude>1240 M</span><i /></div>
    {loading && <div className="route-loader" role="status"><span className="mono">ASCENT / PREPARING ROUTE</span><span>등반 경로를 준비하고 있어요.</span><div /></div>}
  </>
}
