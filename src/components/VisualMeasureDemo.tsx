import { CaseInteractionHint } from './CaseInteractionHint'
import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MeasurementNumberField } from './deurim-measure/MeasurementNumberField'
import { SPACE_WIDTH, setupMeasurementError } from './deurim-measure/demoContract'
import { formatCm, parseCmToMm } from './deurim-measure/consumerUnits'
import originalStyles from './deurim-measure/original.css?inline'
import './VisualMeasureDemo.css'

const reset = `
  :host { display:block; color-scheme:light; font-family:var(--font-sans); color:var(--color-text-primary);
    font-size:var(--type-body-md-size); line-height:var(--type-body-md-line);
    -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility; }
  *, *::before, *::after { box-sizing:border-box; }
  p { margin:0; padding:0; }
  .ds-measure__input { border-radius:var(--radius-sm); }
`

export function VisualMeasureDemo() {
  const host = useRef<HTMLDivElement>(null)
  const [root, setRoot] = useState<ShadowRoot | null>(null)
  const [value, setValue] = useState(1500)
  const [draft, setDraft] = useState('150')
  const draftRef = useRef(draft)
  const changeDraft = (next: string) => { draftRef.current = next; setDraft(next) }
  const slide = (next: number) => { setValue(next); changeDraft(formatCm(next)) }
  const commit = () => {
    if (!setupMeasurementError('widthMm', draftRef.current)) setValue(parseCmToMm(draftRef.current)!)
  }
  useLayoutEffect(() => {
    setRoot(host.current!.shadowRoot ?? host.current!.attachShadow({ mode: 'open' }))
  }, [])

  return <div className="visual-measure-demo">
    <div ref={host} className="visual-measure-demo__service">
      {root && createPortal(<>
        <style>{originalStyles + reset}</style>
        <div className="app"><div className="app__input">
          <MeasurementNumberField definition={SPACE_WIDTH} productDimension={{ value: 912 }}
            draft={draft} confirmed active valueMm={value}
            onDraftChange={changeDraft} onCommit={commit} onSlide={slide}
            onFocus={() => {}} onBlur={commit}
            onStep={direction => {
              const base = parseCmToMm(draftRef.current) ?? value
              slide(Math.max(300, Math.min(4000, base + direction * 10)))
            }} />
        </div></div>
      </>, root)}
    </div>
    <CaseInteractionHint action="눈금을 직접 움직여보세요." description="실제 들임 서비스의 측정 UI를 그대로 가져왔어요." />
  </div>
}
