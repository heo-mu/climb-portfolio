import { useLayoutEffect, useRef, type CSSProperties } from 'react'
import './CaseAIBorder.css'

// Nested, centered strokes approximate a smooth fade along path distance.
// The middle 34px stays at full intensity; the complete streak stays 112px.
const slices = Array.from({ length: 20 }, (_, index) => {
  const t = (index + 1) / 20
  const previousT = index / 20
  const intensity = t * t * (3 - 2 * t)
  const previous = previousT * previousT * (3 - 2 * previousT)
  const length = 112 - index * 78 / 19
  return { length, offset: -(112 - length) / 2, opacity: (intensity - previous) / (1 - previous) }
})

/** Core and haze reuse exactly the same fixed spatial opacity profile. */
export function CaseAIBorder() {
  const root = useRef<SVGSVGElement>(null)
  useLayoutEffect(() => {
    const svg = root.current
    const card = svg?.parentElement
    const path = svg?.querySelector<SVGRectElement>('.case-ai-border-base')
    if (!svg || !card || !path) return
    const siblings = [...(card.closest('.case-study')?.querySelectorAll('.case-ai-insight') ?? [])]
    svg.style.setProperty('--ai-border-phase', `${Math.max(0, siblings.indexOf(card)) * -1.1}s`)
    const resize = new ResizeObserver(() => {
      const perimeter = path.getTotalLength()
      if (perimeter <= 112) return
      svg.style.setProperty('--ai-border-perimeter', `${perimeter}px`)
      svg.style.setProperty('--ai-border-end', `${-perimeter}px`)
      svg.dataset.ready = 'true'
    })
    resize.observe(svg)
    const visibility = new IntersectionObserver(([entry]) => {
      svg.dataset.visible = String(entry.isIntersecting)
    })
    visibility.observe(card)
    return () => { resize.disconnect(); visibility.disconnect() }
  }, [])
  return <svg ref={root} className="case-ai-border" aria-hidden="true" focusable="false">
    <rect className="case-ai-border-base" />
    <g className="case-ai-border-trace">
      {['haze', 'core'].map(layer => <g key={layer} className={`case-ai-border-${layer}`}>
        {slices.map((slice, index) => <rect key={index} className="case-ai-border-slice" strokeOpacity={slice.opacity} style={{ '--ai-slice-length': `${slice.length}px`, '--ai-slice-offset': `${slice.offset}px` } as CSSProperties} />)}
      </g>)}
    </g>
  </svg>
}
