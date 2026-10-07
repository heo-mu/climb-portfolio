import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { Scene } from './Scene'
import { ScrollController } from './progress'
import type { ExpeditionFrame } from './progress'
import { checkpoints } from '../data/expedition'
import { CheckpointSections } from '../components/Sections'
import { HUD } from '../components/HUD'
import { experienceConfig } from '../config/experience'
import { projectSelection } from './projectSelection'
import { projects } from '../data/projects'

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
    const returning = Math.abs(initialProgress - checkpoints[4].progress) < experienceConfig.content.readableRange
    const restored = projects.findIndex(project => project.slug === (location.state as { project?: string } | null)?.project)
    projectSelection.reset(returning ? (restored >= 0 ? restored : projectSelection.get()) : 0)
    return () => projectSelection.reset(projectSelection.get())
  }, [initialProgress, location.state])

  useLayoutEffect(() => {
    document.title = 'Heo Chang Mu - Portfolio'
    const sections = Array.from(root.current!.querySelectorAll<HTMLElement>('[data-checkpoint]'))
    if (fallback) {
      sections.forEach(section => { section.removeAttribute('style'); section.inert = false; section.removeAttribute('aria-hidden') })
      const camp = checkpoints.reduce((best, item) => Math.abs(item.progress - lastProgress.current) < Math.abs(best.progress - lastProgress.current) ? item : best)
      const target = (lastProgress.current ? camp : checkpoints.find(item => item.progress === initialProgress)) ?? camp
      // Home is the top of the reading route, above it sits the note explaining the fallback.
      const raf = requestAnimationFrame(() => target.progress ? document.getElementById(target.id)?.scrollIntoView() : window.scrollTo({ top: 0, behavior: 'instant' }))
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.checkpoint)
            lastProgress.current = checkpoints[index].progress
            if (index !== 4) projectSelection.reset()
          }
        })
      }, { rootMargin: '-15% 0px -45% 0px' })
      sections.forEach(section => observer.observe(section))
      return () => { cancelAnimationFrame(raf); observer.disconnect() }
    }
    let previousActive = -1
    let previousSections: ExpeditionFrame['sections'] | null = null
    controller.start(lastProgress.current || initialProgress)
    const unsubscribe = controller.subscribe(frame => {
      lastProgress.current = frame.progress
      // The rendered camera owns visual approach/departure. This shared arrival
      // state owns focus/input, matching the trail navigation. States are shared
      // references, so the DOM is only touched when arrival actually changes.
      if (frame.sections !== previousSections) {
        previousSections = frame.sections
        sections.forEach((section, index) => {
          const { phase, interactive } = frame.sections[index]
          section.dataset.phase = phase
          section.inert = !interactive
          section.setAttribute('aria-hidden', String(!interactive))
        })
      }
      if (previousActive !== frame.active) {
        // Other camps begin a fresh selection; a detail return directly to Projects preserves it.
        if (frame.active !== 4) projectSelection.reset()
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
    {fallback ? <div className="static-landscape" aria-hidden="true" /> : <Scene controller={controller} onFallback={onFallback} />}
    <HUD controller={controller} fallback={fallback} />
    <CheckpointSections onExplore={() => { if (fallback) document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); else controller.goTo(checkpoints[1].progress) }} />
    {fallback && <p className="fallback-note">3D 화면을 사용할 수 없어 콘텐츠를 바로 보여드려요.</p>}
  </main>
}
