import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

type NodePosition = { y: number; active: boolean }

/** One rail and one coordinate system, independent of text wrapping and reveal transforms. */
export function CareerTimeline({ children }: { children: ReactNode }) {
  const list = useRef<HTMLOListElement>(null)
  const maskId = useId()
  const [nodes, setNodes] = useState<NodePosition[]>([])

  useLayoutEffect(() => {
    const element = list.current!
    const items = Array.from(element.children) as HTMLElement[]
    const measure = () => {
      const next = items.map(item => ({ y: item.offsetTop + 9.5, active: item.getAttribute('aria-current') === 'step' }))
      setNodes(previous => previous.length === next.length && previous.every((node, i) => node.y === next[i].y && node.active === next[i].active) ? previous : next)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    items.forEach(item => observer.observe(item))
    measure()
    return () => observer.disconnect()
  }, [])

  return <div className="career-track">
    <svg className="career-rail" aria-hidden="true">
      <defs><mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="18" height="100%">
        <rect width="18" height="100%" fill="white" />
        {nodes.map((node, index) => <rect key={index} className="career-gap" y={node.y - 7.5} width="18" height="15" fill="black" />)}
      </mask></defs>
      {nodes.length > 1 && <rect className="career-line" y={nodes[0].y} width="1" height={nodes[nodes.length - 1].y - nodes[0].y} mask={`url(#${maskId})`} />}
      {nodes.map((node, index) => <g key={index} className="career-node" data-active={node.active} style={{ '--entry-start': [.18, .27, .36][index] ?? .36 } as CSSProperties}>
        {node.active && <circle className="career-halo" cy={node.y} r="8.5" />}
        <circle className="career-dot" cy={node.y} r="4" />
      </g>)}
    </svg>
    <ol ref={list} className="career-timeline" aria-label="경력 흐름" role="list">{children}</ol>
  </div>
}
