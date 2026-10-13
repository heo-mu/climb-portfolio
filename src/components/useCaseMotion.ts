import { useLayoutEffect, type RefObject } from 'react'

// Observe reading units, never an ancestor of a gallery, image or interactive demo.
const readingUnits = [
  '.case-section > .case-label',
  '.case-content > h2', '.case-content > h2 + p',
  '.case-problems', '.case-rows', '.case-comparison', '.case-decisions--compact',
  '.case-prompt', '.case-conclusion',
  '.case-spatial-principles',
].join(',')
const steps = [
  '.case-spatial-path > li', '.case-graph-workflow-steps > li',
  '.case-production-workflow > li', '.case-image-workflow-steps > li',
  '.case-ai-pair', '.case-flows ol > li',
].join(',')

export function useCaseMotion(root: RefObject<HTMLDivElement | null>, projectSlug: string) {
  useLayoutEffect(() => {
    const container = root.current
    if (!container || !('IntersectionObserver' in window)) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const candidates = Array.from(container.querySelectorAll<HTMLElement>(`${readingUnits},${steps}`))
    // A unit is animated once, without nested fades or translations.
    const targets = candidates.filter(el => !candidates.some(parent => parent !== el && parent.contains(el)))
    const reveal = (el: HTMLElement) => {
      el.dataset.caseReveal = 'visible'
      observer.unobserve(el)
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const el = entry.target as HTMLElement
        if (entry.isIntersecting && el.dataset.caseReveal === 'pending') reveal(el)
      })
    }, { threshold: 0 })
    targets.forEach(el => {
      if (reduced.matches) return
      if (el.matches(steps)) {
        const index = Array.from(el.parentElement!.children).indexOf(el)
        el.style.setProperty('--case-motion-delay', `${Math.min(index, 4) * 50}ms`)
      }
      el.dataset.caseReveal = 'pending'
      observer.observe(el)
    })
    const revealAll = () => {
      if (reduced.matches) targets.forEach(el => { el.dataset.caseImmediate = 'true'; reveal(el) })
    }
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof Element) {
        const unit = event.target.closest<HTMLElement>('[data-case-reveal]')
        if (unit) { unit.dataset.caseImmediate = 'true'; reveal(unit) }
      }
    }
    reduced.addEventListener('change', revealAll)
    container.addEventListener('focusin', onFocus)
    return () => {
      observer.disconnect()
      reduced.removeEventListener('change', revealAll)
      container.removeEventListener('focusin', onFocus)
      targets.forEach(el => {
        delete el.dataset.caseReveal
        delete el.dataset.caseImmediate
        el.style.removeProperty('--case-motion-delay')
      })
    }
  }, [root, projectSlug])
}
