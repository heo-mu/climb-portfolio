import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { checkpoints } from '../data/expedition'
import type { ScrollController } from '../experience/progress'

const altitudeRange = checkpoints[4].altitude - checkpoints[0].altitude
const formatAltitude = (n: number) => n.toLocaleString('en-US').replace(',', '\u2009')

export function HUD({ controller, fallback }: { controller: ScrollController; fallback: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  const altitude = useRef<HTMLSpanElement>(null)
  const [active, setActive] = useState(0)
  useEffect(() => {
    if (fallback) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => { if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.checkpoint)) })
      }, { rootMargin: '-15% 0px -45% 0px' })
      document.querySelectorAll('[data-checkpoint]').forEach(section => observer.observe(section))
      return () => observer.disconnect()
    }
    let previousActive = -1
    return controller.subscribe(frame => {
      if (altitude.current) altitude.current.textContent = formatAltitude(frame.altitude)
      root.current?.style.setProperty('--progress', String((frame.altitude - checkpoints[0].altitude) / altitudeRange))
      if (previousActive !== frame.active) { previousActive = frame.active; setActive(frame.active) }
    })
  }, [controller, fallback])

  const navigate = (index: number) => {
    if (fallback) document.getElementById(checkpoints[index].id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    else controller.goTo(checkpoints[index].progress)
  }
  return <div className="hud" ref={root}>
    <div className="altitude-hud" aria-label="현재 고도"><span className="altitude-number" ref={altitude}>{formatAltitude(checkpoints[0].altitude)}</span><span className="altitude-unit">m</span></div>
    <div className="current-location" aria-live="polite" aria-atomic="true"><span>{checkpoints[active].index}</span><span className="current-rule" /><strong>{checkpoints[active].navigation}</strong></div>
    <nav className="checkpoint-nav" aria-label="포트폴리오 섹션">
      <div className="nav-track" aria-hidden="true"><span /></div>
      {checkpoints.map((camp, index) => <button key={camp.id} style={{ '--stop': `${100 * (checkpoints[4].altitude - camp.altitude) / altitudeRange}%` } as CSSProperties} onClick={() => navigate(index)} aria-current={active === index ? 'step' : undefined} aria-label={`${camp.index} ${camp.navigation}`}><span className="nav-number">{camp.index}</span><span className="nav-label">{camp.navigation}</span><i /></button>)}
      <span className="nav-position" aria-hidden="true" />
    </nav>
  </div>
}
