import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { Scene } from './Scene'
import { ScrollController, smoothstep } from './progress'
import { checkpoints } from '../data/expedition'
import { CheckpointSections } from '../components/Sections'
import { HUD } from '../components/HUD'
import { experienceConfig } from '../config/experience'

const routePositions = new Map<string, number>()

export function Expedition() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const [controller] = useState(() => new ScrollController())
  const [fallback, setFallback] = useState(false)
  const root = useRef<HTMLElement>(null)
  const lastProgress = useRef(0)
  const [initialProgress] = useState(() => {
    if (location.hash) return checkpoints.find(camp => `#${camp.id}` === location.hash)?.progress ?? 0
    if (navigationType === 'POP') {
      return routePositions.get(location.key) ?? 0
    }
    return 0
  })

  const onFallback = useCallback(() => setFallback(true), [])

  useLayoutEffect(() => {
    document.title = 'Heo Chang Mu - Portfolio'
    const sections = Array.from(root.current!.querySelectorAll<HTMLElement>('[data-checkpoint]'))
    if (fallback) {
      sections.forEach(section => { section.removeAttribute('style'); section.inert = false; section.removeAttribute('aria-hidden') })
      const camp = checkpoints.reduce((best, item) => Math.abs(item.progress - lastProgress.current) < Math.abs(best.progress - lastProgress.current) ? item : best)
      const initialCamp = checkpoints.find(item => item.progress === initialProgress)
      const raf = requestAnimationFrame(() => document.getElementById(lastProgress.current ? camp.id : initialCamp?.id ?? camp.id)?.scrollIntoView())
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) lastProgress.current = checkpoints[Number((entry.target as HTMLElement).dataset.checkpoint)].progress
        })
      }, { rootMargin: '-15% 0px -45% 0px' })
      sections.forEach(section => observer.observe(section))
      return () => { cancelAnimationFrame(raf); observer.disconnect() }
    }
    let previousActive = -1
    const start = lastProgress.current || initialProgress
    controller.start(start)
    const unsubscribe = controller.subscribe(frame => {
      lastProgress.current = frame.progress
      root.current?.style.setProperty('--journey-progress', String(frame.progress))
      sections.forEach((section, index) => {
        // Panels and navigation consume the same arrival state as the camera controller.
        const reveal = frame.reveals[index]
        section.style.setProperty('--panel-surface', String(smoothstep(reveal / 0.65)))
        section.style.setProperty('--panel-title', String(smoothstep((reveal - 0.08) / 0.78)))
        section.style.setProperty('--panel-body', String(smoothstep((reveal - 0.22) / 0.78)))
        if (index === 0) section.style.setProperty('--home-exit', String(1 - reveal))
        const state = frame.sections[index]
        section.style.visibility = index === 0 ? reveal === 0 ? 'hidden' : 'visible' : state.phase === 'hidden' ? 'hidden' : 'visible'
        section.dataset.phase = state.phase
        const interactive = state.interactive
        section.inert = !interactive
        section.setAttribute('aria-hidden', String(!interactive))
      })
      if (previousActive !== frame.active) {
        const focused = document.activeElement
        if (focused instanceof HTMLElement && sections.some(section => section.contains(focused))) focused.blur()
        previousActive = frame.active
      }
    })
    return () => { unsubscribe(); controller.stop() }
  }, [controller, fallback, initialProgress])

  useEffect(() => {
    return () => {
      routePositions.set(location.key, lastProgress.current)
    }
  }, [location.key])

  useEffect(() => {
    const hashChange = () => {
      const checkpoint = checkpoints.find(camp => `#${camp.id}` === window.location.hash)
      if (checkpoint && !fallback) controller.goTo(checkpoint.progress)
    }
    window.addEventListener('hashchange', hashChange)
    return () => window.removeEventListener('hashchange', hashChange)
  }, [controller, fallback])

  return <main ref={root} className={`expedition ${fallback ? 'reading-mode' : ''}`} style={fallback ? undefined : { height: `${experienceConfig.route.scrollScreens * 100}svh` }}>
    <a className="skip-link" href="#high-camp" onClick={event => { if (!fallback) { event.preventDefault(); controller.goTo(checkpoints.find(camp => camp.id === 'high-camp')!.progress, true); requestAnimationFrame(() => document.getElementById('title-high-camp')?.focus({ preventScroll: true })) } }}>프로젝트로 바로 가요</a>
    {fallback ? <div className="static-landscape" aria-hidden="true"><div /><div /><div /></div> : <Scene controller={controller} onFallback={onFallback} />}
    <HUD controller={controller} fallback={fallback} />
    <CheckpointSections onExplore={() => { if (fallback) document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); else controller.goTo(checkpoints[1].progress) }} />
    {fallback && <p className="fallback-note">3D 화면을 사용할 수 없어 콘텐츠를 바로 보여드려요.</p>}
  </main>
}
