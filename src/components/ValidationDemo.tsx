import { CaseInteractionHint } from './CaseInteractionHint'
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { SpatialIssueGlyph } from './deurim-result/SpatialIssueGlyph'
import originalStyles from './deurim-result/original.css?inline'
import './ValidationDemo.css'

type Side = 'left' | 'right'
const ValidationViewer = lazy(() => import('./deurim-viewer/ValidationViewer'))
const validationRowSurfaces = `
  .problem {
    --surface-issue-card: color-mix(in srgb, var(--gray-0) 35.5%, var(--gray-50));
    --surface-issue-card-hover: var(--gray-100);
    --surface-issue-card-selected: color-mix(in srgb, var(--gray-0) 100%, var(--gray-50));
    --edge-issue-card-hover: color-mix(in srgb, var(--gray-900) 32%, transparent);
    --edge-active: color-mix(in srgb, var(--gray-900) 42%, transparent);
    --motion-fast: 180ms;
    border-radius: var(--case-radius-default, 10px);
  }
  .problem {
    transition: background-color 180ms var(--motion-easing-standard),
      border-color 180ms var(--motion-easing-standard);
  }
`

/** ConsumerResult.ResultRow's problem branch; only its store bindings are local. */
function ResultRow({ side, selected, onSelect, onHover }: {
  side: Side; selected: boolean
  onSelect: () => void; onHover: (hovered: boolean) => void
}) {
  return <button type="button" className="problem"
    aria-pressed={selected} onClick={onSelect}
    onPointerEnter={() => onHover(true)} onPointerLeave={() => onHover(false)}
    onFocus={() => onHover(true)} onBlur={() => onHover(false)}>
    <span className="problem__body">
      <span className="problem__amount">0.1<span className="problem__amount-unit">cm 더 필요</span></span>
      <span className="problem__title">{side === 'left' ? '왼쪽' : '오른쪽'} 문을 열 공간이 모자라요</span>
      <span className="problem__numbers">현재 29.4cm · 필요 29.5cm</span>
    </span>
    <span className="problem__where"><SpatialIssueGlyph region={side} kind="doorClearance" /></span>
  </button>
}

export function ValidationDemo() {
  const host = useRef<HTMLDivElement>(null)
  const [root, setRoot] = useState<ShadowRoot | null>(null)
  const [selected, setSelected] = useState<Side>('left')
  const [hovered, setHovered] = useState<Side | null>(null)
  const [focusRequest, setFocusRequest] = useState(1)
  const viewer = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [pageVisible, setPageVisible] = useState(!document.hidden)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting)
      if (entry.isIntersecting) setLoaded(true)
    }, { rootMargin: '160px' })
    observer.observe(viewer.current!)
    const visibility = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', visibility)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility) }
  }, [])
  useLayoutEffect(() => {
    setRoot(host.current!.shadowRoot ?? host.current!.attachShadow({ mode: 'open' }))
  }, [])
  return <div className="validation-demo">
    <div className="validation-demo__stage">
    <div className="validation-demo__viewer" ref={viewer} role="img" aria-label={`${selected === 'left' ? '왼쪽' : '오른쪽'} 문과 벽 사이 공간을 보여주는 3D 냉장고`}>
      <div className="validation-demo__canvas">
      {loaded && <Suspense fallback={<span className="validation-demo__loading">3D 화면을 불러오고 있어요.</span>}>
        <ValidationViewer side={selected} hovered={hovered} focusRequest={focusRequest} active={visible && pageVisible} />
      </Suspense>}
      </div>
    </div>
    <div className="validation-demo__service" ref={host}>
      {root && createPortal(<>
        <style>{originalStyles + validationRowSurfaces}</style>
        <div className="problem-list" role="group" aria-label="좌우 문 공간 결과">
          {(['left', 'right'] as const).map(side => <ResultRow key={side} side={side}
            selected={selected === side}
            onSelect={() => { setSelected(side); setFocusRequest(value => value + 1) }} onHover={active => setHovered(active ? side : null)} />)}
        </div>
      </>, root)}
    </div>
    </div>
    <CaseInteractionHint direction="right" action="문제 항목을 눌러보세요." description="선택한 위치로 3D 시점이 이동해요." />
  </div>
}
