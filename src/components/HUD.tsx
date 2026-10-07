import { useEffect, useRef, useState } from 'react'
import { checkpoints } from '../data/expedition'
import { experienceConfig } from '../config/experience'
import type { ScrollController } from '../experience/progress'
import { TrailNavigation } from './TrailNavigation'

const formatAltitude = (n: number) => String(Math.round(n))

export function HUD({ controller, fallback }: { controller: ScrollController; fallback: boolean }) {
  const altitude = useRef<HTMLSpanElement>(null)
  const [active, setActive] = useState(0)
  const [homeVisible, setHomeVisible] = useState(false)
  const [altitudeVisible, setAltitudeVisible] = useState(false)
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
    let previousAltitude = ''
    return controller.subscribe(frame => {
      const value = formatAltitude(frame.altitude)
      if (altitude.current && value !== previousAltitude) altitude.current.textContent = previousAltitude = value
      // The climb is shown from the moment the walker has left Home behind.
      setAltitudeVisible(!frame.sections[0].interactive)
      // A departed Projects camp is history, not an active exhibit.
      setActive(frame.active === 4 && !frame.sections[4].interactive ? -1 : frame.active)
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
    <div className="altitude-hud" data-visible={!fallback && altitudeVisible} aria-hidden="true"><span className="altitude-number" ref={altitude}>{formatAltitude(checkpoints[0].altitude)}</span><span className="altitude-unit">m</span></div>
    <div className="hud" data-home={!homeVisible} inert={!homeVisible} aria-hidden={!homeVisible}>
    <div className="current-location" style={{ visibility: active < 0 ? 'hidden' : undefined }} aria-live="polite" aria-atomic="true"><span>{checkpoints[Math.max(0, active)].index}</span><span className="current-rule" /><strong>{checkpoints[Math.max(0, active)].navigation}</strong></div>
    <TrailNavigation controller={controller} active={active} fallback={fallback} navigate={navigate} />
    </div>
    <button type="button" className="journey-home" data-visible={homeVisible} inert={!homeVisible} tabIndex={homeVisible ? 0 : -1} onClick={returnHome} aria-label="여정의 출발점인 Home으로 돌아가요">
      <svg className="journey-home-icon" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="m3 7.5 6-5 6 5v7H11v-5H7v5H3z" /></svg><span>Home</span>
    </button>
  </>
}
