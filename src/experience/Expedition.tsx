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

export function Expedition({ active = true }: { active?: boolean }) {
  const location = useLocation()
  const navigationType = useNavigationType()
  const [controller] = useState(() => new ScrollController())
  const [fallback, setFallback] = useState(false)
  const root = useRef<HTMLElement>(null)
  const focusProjectsOnArrival = useRef(false)
  const visited = useRef(false)
  const [initialProgress] = useState(() => {
    if (location.hash) return checkpoints.find(camp => `#${camp.id}` === location.hash)?.progress ?? 0
    return 0
  })
  const lastProgress = useRef<number>(initialProgress)

  const onFallback = useCallback(() => setFallback(true), [])

  useLayoutEffect(() => {
    if (!active) return
    const returning = Math.abs(initialProgress - checkpoints[4].progress) < experienceConfig.content.readableRange
    const restored = projects.findIndex(project => project.slug === (location.state as { project?: string } | null)?.project)
    if (!visited.current) projectSelection.reset(returning ? (restored >= 0 ? restored : projectSelection.get()) : 0)
    // A POP restores the live selection, not the stale state stored by an older
    // Back-to-Projects link on that history entry.
    else if (navigationType !== 'POP' && restored >= 0) projectSelection.reset(restored)
    visited.current = true
    // A selection still decoding when the visitor opens the current detail
    // may populate the cache, but must not change their saved project later.
    return () => projectSelection.reset(projectSelection.get())
  }, [active, initialProgress, location.state, navigationType])

  useLayoutEffect(() => {
    if (!active) return
    document.title = 'Heo Chang Mu - Portfolio'
    const destination = navigationType !== 'POP' && location.hash ? checkpoints.find(camp => `#${camp.id}` === location.hash)?.progress : undefined
    const resumeProgress = destination ?? lastProgress.current
    const sections = Array.from(root.current!.querySelectorAll<HTMLElement>('[data-checkpoint]'))
    const projectsHeading = root.current!.querySelector<HTMLElement>('#title-high-camp')
    if (fallback) {
      sections.forEach(section => { section.removeAttribute('style'); section.inert = false; section.removeAttribute('aria-hidden') })
      const target = checkpoints.reduce((best, item) => Math.abs(item.progress - resumeProgress) < Math.abs(best.progress - resumeProgress) ? item : best)
      // Home is the top of the reading route, above it sits the note explaining the fallback.
      if (target.progress) document.getElementById(target.id)?.scrollIntoView({ behavior: 'instant' })
      else window.scrollTo({ top: 0, behavior: 'instant' })
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.checkpoint)
            lastProgress.current = checkpoints[index].progress
          }
        })
      }, { rootMargin: '-15% 0px -45% 0px' })
      sections.forEach(section => observer.observe(section))
      return () => observer.disconnect()
    }
    let previousActive = -1
    let previousSections: ExpeditionFrame['sections'] | null = null
    controller.start(resumeProgress)
    const unsubscribe = controller.subscribe(frame => {
      lastProgress.current = frame.journeyProgress
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
        const focused = document.activeElement
        if (focused instanceof HTMLElement && sections.some(section => section.contains(focused))) focused.blur()
        previousActive = frame.active
      }
      if (focusProjectsOnArrival.current) {
        if (frame.sections[4].interactive) {
          focusProjectsOnArrival.current = false
          // The scene applies visibility later in this same controller dispatch.
          queueMicrotask(() => { if (!sections[4].inert) projectsHeading?.focus({ preventScroll: true }) })
        } else if (frame.destination !== 4) focusProjectsOnArrival.current = false
      }
    })
    return () => { unsubscribe(); controller.stop() }
  }, [active, controller, fallback, initialProgress, location.hash, location.key, navigationType])

  useEffect(() => {
    if (!active) return
    const hashChange = (event: HashChangeEvent) => {
      // Cross-route POP already restored the exact camera position. Its native
      // hashchange must not start another trip to the checkpoint afterwards.
      if (new URL(event.oldURL).pathname !== '/') return
      const checkpoint = checkpoints.find(camp => `#${camp.id}` === window.location.hash)
      if (checkpoint && !fallback) controller.goTo(checkpoint.progress)
    }
    window.addEventListener('hashchange', hashChange)
    return () => window.removeEventListener('hashchange', hashChange)
  }, [active, controller, fallback])

  return <main ref={root} className={`expedition ${fallback ? 'reading-mode' : ''}`} style={fallback ? undefined : { height: `${experienceConfig.route.scrollScreens * 100}svh` }}>
    <a className="skip-link" href="#high-camp" onClick={event => { if (!fallback) { event.preventDefault(); controller.goTo(checkpoints.find(camp => camp.id === 'high-camp')!.progress, true); focusProjectsOnArrival.current = true } }}>프로젝트로 바로 가요</a>
    {fallback ? <div className="static-landscape" aria-hidden="true" /> : <Scene controller={controller} onFallback={onFallback} active={active} />}
    <HUD controller={controller} fallback={fallback} enabled={active} />
    <CheckpointSections onExplore={() => { if (fallback) document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); else controller.goTo(checkpoints[1].progress) }} />
    {fallback && <p className="fallback-note">3D 화면을 사용할 수 없어 콘텐츠를 바로 보여드려요.</p>}
  </main>
}
