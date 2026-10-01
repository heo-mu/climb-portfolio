import { useLayoutEffect, useRef, useState } from 'react'
import { checkpoints } from '../data/expedition'
import type { ScrollController } from '../experience/progress'
import { createTrailMap } from '../experience/trailMap'

export function TrailNavigation({ controller, active, fallback, navigate }: {
  controller: ScrollController; active: number; fallback: boolean; navigate: (index: number) => void
}) {
  const root = useRef<HTMLElement>(null)
  const completed = useRef<SVGPathElement>(null), marker = useRef<SVGCircleElement>(null)
  const currentRoute = useRef(0)
  const [map, setMap] = useState(() => createTrailMap(160, 378))
  useLayoutEffect(() => {
    const element = root.current!
    const resize = () => {
      const width = Math.round(element.clientWidth), height = Math.round(element.clientHeight)
      if (width && height) setMap(createTrailMap(width, height, width > height))
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  useLayoutEffect(() => {
    const update = (route: number) => {
      currentRoute.current = route
      const point = map.at(route)
      completed.current?.setAttribute('stroke-dashoffset', String(map.length - point.length))
      marker.current?.setAttribute('cx', String(point.x))
      marker.current?.setAttribute('cy', String(point.y))
    }
    update(fallback ? checkpoints[active].route : currentRoute.current)
    if (!fallback) return controller.subscribe(frame => update(frame.route))
  }, [controller, map, fallback, active])
  return <nav ref={root} className="checkpoint-nav trail-nav" aria-label="포트폴리오 등반 경로">
    <svg className="trail-map" viewBox={`0 0 ${map.width} ${map.height}`} aria-hidden="true">
      <path className="trail-remaining" d={map.path} />
      <path ref={completed} className="trail-completed" d={map.path} strokeDasharray={map.length} strokeDashoffset={map.length} />
      <circle ref={marker} className="trail-current" cx={map.at(currentRoute.current).x} cy={map.at(currentRoute.current).y} r="2" />
    </svg>
    {checkpoints.map((camp, index) => {
      const point = map.at(camp.route)
      return <button className="trail-checkpoint" key={camp.id} onClick={() => navigate(index)}
        style={{ left: point.x, top: point.y }} aria-current={active === index ? 'step' : undefined} aria-label={`${camp.index} ${camp.navigation}`}>
        <span className="nav-label">{camp.navigation}</span><span className="trail-node" aria-hidden="true" />
      </button>
    })}
    <span className="trail-mobile-label" aria-hidden="true">{active >= 0 ? checkpoints[active].navigation : 'Home'}</span>
  </nav>
}
