import { useEffect, useRef, useState } from 'react'
import { checkpoints } from '../data/expedition'
import { experienceConfig } from '../config/experience'
import type { ScrollController } from '../experience/progress'

const formatAltitude = (n: number) => n.toLocaleString('en-US').replace(',', '\u2009')

export function HUD({ controller, fallback }: { controller: ScrollController; fallback: boolean }) {
  const altitude = useRef<HTMLSpanElement>(null)
  const [active, setActive] = useState(0)
  const [homeVisible, setHomeVisible] = useState(false)
  useEffect(() => {
    if (fallback) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.checkpoint)
            setActive(index)
            setHomeVisible(index !== 0)
          }
        })
      }, { rootMargin: '-15% 0px -45% 0px' })
      document.querySelectorAll('[data-checkpoint]').forEach(section => observer.observe(section))
      return () => observer.disconnect()
    }
    let previousActive = -1
    return controller.subscribe(frame => {
      if (altitude.current) altitude.current.textContent = formatAltitude(frame.altitude)
      if (previousActive !== frame.active) { previousActive = frame.active; setActive(frame.active) }
      setHomeVisible(frame.progress > experienceConfig.home.exitRange)
    })
  }, [controller, fallback])

  const navigate = (index: number) => {
    if (fallback) document.getElementById(checkpoints[index].id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    else controller.goTo(checkpoints[index].progress)
  }
  const returnHome = () => {
    document.querySelector<HTMLElement>('.checkpoint:not([inert]) .panel-content')?.scrollTo(0, 0)
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    navigate(0)
  }
  return <>
    <div className="hud" data-home={active === 0} inert={active === 0} aria-hidden={active === 0}>
    <div className="altitude-hud" aria-label="현재 고도"><span className="altitude-number" ref={altitude}>{formatAltitude(checkpoints[0].altitude)}</span><span className="altitude-unit">m</span></div>
    <div className="current-location" aria-live="polite" aria-atomic="true"><span>{checkpoints[active].index}</span><span className="current-rule" /><strong>{checkpoints[active].navigation}</strong></div>
    <nav className="checkpoint-nav" aria-label="포트폴리오 섹션">
      {checkpoints.map((camp, index) => <button key={camp.id} onClick={() => navigate(index)} aria-current={active === index ? 'step' : undefined} aria-label={`${camp.index} ${camp.navigation}`}><span className="nav-label">{camp.navigation}</span><span className="nav-dot" aria-hidden="true" /></button>)}
    </nav>
    </div>
    <button type="button" className="journey-home" data-visible={homeVisible} inert={!homeVisible} tabIndex={homeVisible ? 0 : -1} onClick={returnHome} aria-label="여정의 출발점인 Home으로 돌아가요">
      <span>HOME</span><span className="journey-home-arrow" aria-hidden="true">↑</span>
    </button>
  </>
}
