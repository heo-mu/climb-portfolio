import { useEffect, useRef, useState } from 'react'
import type { ScrollController } from './progress'

export function Scene({ controller, onFallback }: { controller: ScrollController; onFallback: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
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
        })
        const unsubscribe = controller.subscribe(frame => {
          scene.update(frame)
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
    {loading && <div className="route-loader" role="status"><span className="mono">ASCENT / PREPARING ROUTE</span><span>등반 경로를 준비하고 있어요.</span><div /></div>}
  </>
}
