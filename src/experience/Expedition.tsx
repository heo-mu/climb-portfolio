import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { Scene } from './Scene'
import { ScrollController, visibilityAt } from './progress'
import { checkpoints } from '../data/expedition'
import { CheckpointSections } from '../components/Sections'
import { HUD } from '../components/HUD'
import { experienceConfig } from '../config/experience'

const routePositions = new Map<string, number>()

export function Expedition() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const [controller] = useState(() => new ScrollController())
  const [fallback, setFallback] = useState(() => new URLSearchParams(location.search).get('view') === 'text')
  const root = useRef<HTMLElement>(null)
  const hasFailure = useRef(false)
  const lastProgress = useRef(0)
  const [initialProgress] = useState(() => {
    if (location.hash) return checkpoints.find(camp => `#${camp.id}` === location.hash)?.progress ?? 0
    if (navigationType === 'POP') {
      const saved = routePositions.get(location.key)
      if (saved !== undefined) return saved
      try { return Number(sessionStorage.getItem(`ascent:${location.key}`)) || 0 } catch { return 0 }
    }
    return 0
  })

  const onFallback = useCallback(() => { hasFailure.current = true; setFallback(true) }, [])

  useLayoutEffect(() => {
    document.title = 'ASCENT — CHANGMU HEO'
    history.scrollRestoration = 'manual'
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
    const unsubscribe = controller.subscribe(frame => {
      lastProgress.current = frame.progress
      root.current?.style.setProperty('--journey-progress', String(frame.progress))
      sections.forEach((section, index) => {
        const visibility = visibilityAt(frame.progress, index)
        const offset = frame.progress - checkpoints[index].progress
        section.style.opacity = String(visibility)
        section.style.visibility = visibility < 0.01 ? 'hidden' : 'visible'
        section.style.transform = frame.reducedMotion ? 'none' : `translate3d(0, ${offset * -120}px, 0)`
        const interactive = frame.active === index && visibility > 0.1
        section.inert = !interactive
        section.setAttribute('aria-hidden', String(!interactive))
      })
      if (previousActive !== frame.active) {
        const focused = document.activeElement
        if (focused instanceof HTMLElement && sections.some(section => section.contains(focused))) focused.blur()
        previousActive = frame.active
      }
    })
    controller.start(lastProgress.current || initialProgress)
    return () => { unsubscribe(); controller.stop() }
  }, [controller, fallback, initialProgress])

  useEffect(() => {
    const save = () => {
      routePositions.set(location.key, lastProgress.current)
      try { sessionStorage.setItem(`ascent:${location.key}`, String(lastProgress.current)) } catch { /* Storage is optional. */ }
    }
    window.addEventListener('pagehide', save)
    return () => { save(); window.removeEventListener('pagehide', save) }
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
    <a className="skip-link" href="#high-camp" onClick={event => { if (!fallback) { event.preventDefault(); controller.goTo(checkpoints[3].progress, true); requestAnimationFrame(() => document.getElementById('title-high-camp')?.focus({ preventScroll: true })) } }}>프로젝트로 바로 가요</a>
    {fallback ? <div className="static-landscape" aria-hidden="true"><div /><div /><div /></div> : <Scene controller={controller} onFallback={onFallback} />}
    <HUD controller={controller} fallback={fallback} onReadingMode={() => setFallback(value => !value)} />
    <CheckpointSections controller={controller} fallback={fallback} />
    {!fallback && <div className="scroll-cue mono"><span>SCROLL TO CLIMB<small>스크롤하며 올라가요</small></span><span className="scroll-line" /></div>}
    {fallback && <p className="fallback-note mono">{hasFailure.current ? '3D 화면을 사용할 수 없어 텍스트 경로를 열었어요.' : 'READING ROUTE / 모든 체크포인트를 순서대로 살펴봐요.'}</p>}
  </main>
}
