import { useEffect, useRef, useState } from 'react'
import { checkpoints, profile } from '../data/expedition'
import type { ScrollController } from '../experience/progress'
import { Mark } from './Mark'

export function HUD({ controller, fallback, onReadingMode }: { controller: ScrollController; fallback: boolean; onReadingMode: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const altitude = useRef<HTMLSpanElement>(null)
  const [active, setActive] = useState(0)
  const [traveling, setTraveling] = useState(false)
  useEffect(() => {
    if (fallback) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => { if (entry.isIntersecting) { const index = Number((entry.target as HTMLElement).dataset.checkpoint); setActive(index); if (altitude.current) altitude.current.textContent = String(checkpoints[index].altitude) } })
      }, { rootMargin: '-15% 0px -45% 0px' })
      document.querySelectorAll('[data-checkpoint]').forEach(section => observer.observe(section))
      return () => observer.disconnect()
    }
    let previousActive = -1
    let previousTraveling: boolean | undefined
    return controller.subscribe(frame => {
      if (altitude.current) altitude.current.textContent = String(frame.altitude).padStart(4, '0')
      root.current?.style.setProperty('--progress', String(frame.progress))
      if (previousActive !== frame.active) { previousActive = frame.active; setActive(frame.active) }
      const onTrail = Math.abs(frame.progress - checkpoints[frame.active].progress) > 0.085
      if (previousTraveling !== onTrail) { previousTraveling = onTrail; setTraveling(onTrail) }
    })
  }, [controller, fallback])

  const navigate = (index: number) => {
    if (fallback) document.getElementById(checkpoints[index].id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    else controller.goTo(checkpoints[index].progress)
  }
  return <div className="hud" ref={root}>
    <header className="site-header"><a href="#base-camp" className="identity" onClick={event => { event.preventDefault(); navigate(0) }} aria-label="허창무 포트폴리오 베이스캠프"><Mark /><span>{profile.name}<small>{profile.role}</small></span></a><div className="header-center mono">PORTFOLIO — VOL. 01 / 2026</div><button className="header-contact mono" onClick={() => navigate(4)}>LET’S TALK <span aria-hidden="true">↗</span></button></header>
    <nav className="checkpoint-nav" aria-label="등반 체크포인트">{checkpoints.map((camp, index) => <button key={camp.id} onClick={() => navigate(index)} aria-current={active === index ? 'step' : undefined} aria-label={`${camp.index} ${camp.name} — ${camp.topic}`}><span className="nav-label mono">{camp.topic}</span><span className="nav-number mono">{camp.index}</span><i /></button>)}<div className="nav-track"><span /></div></nav>
    <div className="altitude-hud"><span className="altitude-number" ref={altitude}>1240</span><span className="mono altitude-unit">METRES ABOVE SEA LEVEL <span>↑</span></span><div className="altitude-scale" aria-hidden="true">{Array.from({ length: 21 }, (_, index) => <i key={index} />)}</div></div>
    <div className="current-location mono" aria-live="polite" aria-atomic="true"><span>{traveling ? 'ON THE TRAIL' : 'CURRENT LOCATION'}</span><strong>{checkpoints[active].name} <i>/</i> {checkpoints[active].topic}</strong></div>
    <footer className="experience-footer mono"><span>© 2026 CHANGMU HEO</span><button onClick={onReadingMode}>{fallback ? '3D 모드로 돌아가요' : '텍스트로 둘러봐요'} <span aria-hidden="true">↗</span></button><span>{profile.location}</span></footer>
  </div>
}
