import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { checkpoints, profile } from '../data/expedition'
import type { ScrollController } from '../experience/progress'

const labels = ['BC', 'C I', 'C II', 'HC', 'SUM']
const altitudeRange = checkpoints[4].altitude - checkpoints[0].altitude
const formatAltitude = (n: number) => n.toLocaleString('en-US').replace(',', '\u2009')

export function HUD({ controller, fallback, onReadingMode }: { controller: ScrollController; fallback: boolean; onReadingMode: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const altitude = useRef<HTMLSpanElement>(null)
  const gain = useRef<HTMLSpanElement>(null)
  const [active, setActive] = useState(0)
  const [traveling, setTraveling] = useState(false)
  useEffect(() => {
    if (fallback) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => { if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.checkpoint)) })
      }, { rootMargin: '-15% 0px -45% 0px' })
      document.querySelectorAll('[data-checkpoint]').forEach(section => observer.observe(section))
      return () => observer.disconnect()
    }
    let previousActive = -1
    let previousTraveling: boolean | undefined
    return controller.subscribe(frame => {
      if (altitude.current) altitude.current.textContent = formatAltitude(frame.altitude)
      if (gain.current) gain.current.textContent = String(frame.altitude - checkpoints[0].altitude)
      root.current?.style.setProperty('--progress', String((frame.altitude - checkpoints[0].altitude) / altitudeRange))
      if (previousActive !== frame.active) { previousActive = frame.active; setActive(frame.active) }
      const onTrail = Math.abs(frame.progress - checkpoints[frame.active].progress) > 0.055
      if (previousTraveling !== onTrail) { previousTraveling = onTrail; setTraveling(onTrail) }
    })
  }, [controller, fallback])

  const navigate = (index: number) => {
    if (fallback) document.getElementById(checkpoints[index].id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    else controller.goTo(checkpoints[index].progress)
  }
  return <div className="hud" ref={root}>
    <header className="site-header"><a className="expedition-identity mono" href="#base-camp" onClick={event => { event.preventDefault(); navigate(0) }}>{profile.name}<span>DESIGN EXPEDITION / 2026</span></a></header>
    <div className="altitude-hud"><span className="altitude-number" ref={altitude}>{formatAltitude(checkpoints[0].altitude)}</span><span className="mono altitude-unit">METRES <span>↑<span ref={gain}>0</span></span></span></div>
    <div className="current-location mono" aria-live="polite" aria-atomic="true"><strong>{checkpoints[active].index} <i>—</i> {checkpoints[active].name}</strong><span>{traveling ? 'ON THE TRAIL' : checkpoints[active].topic}</span></div>
    <nav className="checkpoint-nav" aria-label="등반 체크포인트">
      <div className="nav-track" aria-hidden="true"><span /></div>
      {checkpoints.map((camp, index) => <button key={camp.id} style={{ '--stop': `${100 * (checkpoints[4].altitude - camp.altitude) / altitudeRange}%` } as CSSProperties} onClick={() => navigate(index)} aria-current={active === index ? 'step' : undefined} aria-label={`${camp.index} ${camp.name} — ${camp.topic}`}><span className="nav-label mono">{camp.name}</span><span className="nav-number mono">{labels[index]}</span><i /></button>)}
      <span className="nav-position" aria-hidden="true" />
    </nav>
    <footer className="experience-footer mono"><span>© 2026 CHANGMU HEO</span><button onClick={onReadingMode}>{fallback ? '3D 모드로 돌아가요' : '텍스트로 둘러봐요'} <span aria-hidden="true">↗</span></button><span>{profile.location}</span></footer>
  </div>
}
