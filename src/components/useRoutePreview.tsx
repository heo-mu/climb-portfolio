import { useEffect, useRef, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import type { Project } from '../data/projects'

export function useRoutePreview(previous: Project, next: Project) {
  const element = useRef<HTMLDivElement>(null)
  const motion = useRef({ frame: 0, x: 0, y: 0, targetX: 0, targetY: 0, active: false, width: 320, height: 180, bounds: { top: 0, bottom: 0 }, reduced: false })
  const hide = () => {
    motion.current.active = false
    cancelAnimationFrame(motion.current.frame)
    motion.current.frame = 0
    if (element.current) element.current.dataset.visible = 'false'
  }
  useEffect(() => {
    const query = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 901px)')
    const current = motion.current
    const dismiss = () => {
      current.active = false
      cancelAnimationFrame(current.frame)
      current.frame = 0
      if (element.current) element.current.dataset.visible = 'false'
    }
    window.addEventListener('scroll', dismiss, true)
    window.addEventListener('resize', dismiss)
    window.addEventListener('blur', dismiss)
    query.addEventListener('change', dismiss)
    return () => {
      dismiss()
      window.removeEventListener('scroll', dismiss, true)
      window.removeEventListener('resize', dismiss)
      window.removeEventListener('blur', dismiss)
      query.removeEventListener('change', dismiss)
    }
  }, [previous.slug, next.slug])

  const paint = () => {
    const m = motion.current
    m.frame = 0
    if (!m.active || !element.current) return
    m.x += (m.targetX - m.x) * (m.reduced ? 1 : .2)
    m.y += (m.targetY - m.y) * (m.reduced ? 1 : .2)
    element.current.style.transform = `translate3d(${m.x}px, ${m.y}px, 0)`
    if (Math.abs(m.targetX - m.x) + Math.abs(m.targetY - m.y) > .2) m.frame = requestAnimationFrame(paint)
  }
  const target = (event: PointerEvent<HTMLAnchorElement>, snap = false) => {
    const m = motion.current
    if (!m.active) return
    const edge = 16
    let x = event.clientX + 28
    let y = event.clientY + 24
    if (x + m.width > innerWidth - edge) x = event.clientX - m.width - 28
    if (y + m.height > innerHeight - edge) y = event.clientY - m.height - 24
    // Keep the entire navigation readable, including the opposite destination.
    if (y < m.bounds.bottom && y + m.height > m.bounds.top) {
      y = m.bounds.top - m.height - edge >= edge ? m.bounds.top - m.height - edge : m.bounds.bottom + edge
    }
    m.targetX = Math.max(edge, Math.min(innerWidth - m.width - edge, x))
    m.targetY = Math.max(edge, Math.min(innerHeight - m.height - edge, y))
    if (snap || m.reduced) { m.x = m.targetX; m.y = m.targetY; paint() }
    else if (!m.frame) m.frame = requestAnimationFrame(paint)
  }
  const enter = (event: PointerEvent<HTMLAnchorElement>, direction: 'previous' | 'next') => {
    if (event.pointerType !== 'mouse' || !matchMedia('(hover: hover) and (pointer: fine) and (min-width: 901px)').matches || !element.current) return
    const screen = (direction === 'previous' ? previous : next).screen
    const m = motion.current
    m.width = Math.min(320, innerWidth - 32)
    m.height = m.width * screen.height / screen.width
    m.bounds = event.currentTarget.parentElement!.getBoundingClientRect()
    m.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    m.active = true
    element.current.dataset.direction = direction
    element.current.style.width = `${m.width}px`
    target(event, true)
    element.current.dataset.visible = 'true'
  }
  return {
    enter, move: target, hide,
    preview: createPortal(<div ref={element} className="route-floating-preview" data-visible="false" aria-hidden="true">
      <div className="route-floating-surface">{([{ direction: 'previous', project: previous }, { direction: 'next', project: next }] as const).map(({ direction, project }) =>
        <img key={direction} data-direction={direction} src={project.screen.desktop} width={project.screen.width} height={project.screen.height} alt="" decoding="async" />,
      )}</div>
    </div>, document.body),
  }
}
