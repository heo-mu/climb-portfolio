import { Fragment, useRef, useState, type KeyboardEvent } from 'react'
import type { CaseBlock, CaseSection, ImageSlot } from '../data/caseStudy'
import { ArrowUpRight } from './ArrowUpRight'
import { VisualMeasureDemo } from './VisualMeasureDemo'
import { ValidationDemo } from './ValidationDemo'
import './CaseStudy.css'

export function CaseImageSlot({ slot, hero = false }: { slot: ImageSlot; hero?: boolean }) {
  const panels = slot.panels ?? [slot]
  if (slot.layout === 'decision-visual') return <figure className="case-decision-visual" aria-label="UX 판단을 적용한 실제 모바일 화면">
    <div className="case-decision-visual-stage">{panels.map(({ label, description, image }) => image && <div className="case-decision-visual-screen" key={label}>
      <img src={image.src} alt={image.alt} width={image.width} height={image.height} loading="lazy" decoding="async" />
      <div className="case-decision-visual-note"><h3>{label}</h3>{description && <p>{description}</p>}</div>
    </div>)}</div>
  </figure>
  return <figure className={`case-image-slot${hero ? ' detail-hero' : ''}${slot.layout ? ` case-image-slot--${slot.layout}` : ''}`} aria-hidden={panels.every(panel => !panel.image) || undefined}>
    <div className="case-image-stage">{panels.map(({ label, image }) => <div className="case-image-panel" key={label} style={image ? { aspectRatio: `${image.width} / ${image.height}` } : undefined}>
      {image ? <img src={image.src} alt={image.alt} width={image.width} height={image.height} loading={hero ? 'eager' : 'lazy'} decoding="async" />
        : <div className="case-image-placeholder" aria-hidden="true"><span>IMAGE — {label}</span></div>}
    </div>)}</div>
  </figure>
}

function CaseImageCarousel({ slot }: { slot: ImageSlot }) {
  const panels = slot.panels ?? [slot]
  const [activeIndex, setActiveIndex] = useState(0)
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const activePanel = panels[activeIndex]
  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    let nextIndex = activeIndex
    if (event.key === 'ArrowRight') nextIndex = (activeIndex + 1) % panels.length
    else if (event.key === 'ArrowLeft') nextIndex = (activeIndex - 1 + panels.length) % panels.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = panels.length - 1
    else return
    event.preventDefault()
    setActiveIndex(nextIndex)
    tabRefs.current[nextIndex]?.focus()
  }
  return <div className="case-image-carousel" aria-label="들임 대표 화면">
    <div className="case-image-tabs" role="tablist" aria-label="들임 대표 화면 선택">
      {panels.map((panel, index) => <button
        key={panel.label}
        ref={element => { tabRefs.current[index] = element }}
        className="case-image-tab"
        id={`deurim-screen-tab-${index}`}
        type="button"
        role="tab"
        aria-selected={activeIndex === index}
        aria-controls="deurim-screen-panel"
        tabIndex={activeIndex === index ? 0 : -1}
        onClick={() => setActiveIndex(index)}
        onKeyDown={onTabKeyDown}
      ><span className="case-image-tab-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span>{panel.label}</span></button>)}
    </div>
    <figure className="case-image-slot case-image-slot--wide case-image-carousel-frame" role="tabpanel" id="deurim-screen-panel" aria-labelledby={`deurim-screen-tab-${activeIndex}`}>
      <div className="case-image-stage"><div className="case-image-panel" style={activePanel.image ? { aspectRatio: `${activePanel.image.width} / ${activePanel.image.height}` } : undefined}>
        {activePanel.image ? <img src={activePanel.image.src} alt={activePanel.image.alt} width={activePanel.image.width} height={activePanel.image.height} loading="eager" decoding="async" />
          : <div className="case-image-placeholder" aria-hidden="true"><span>IMAGE — {activePanel.label}</span></div>}
      </div></div>
    </figure>
  </div>
}

/** Prose keeps semantic groups; headings release hard breaks on narrow screens. */
export function CaseText({ text, prose = false }: { text: string; prose?: boolean }) {
  if (prose) return <>{text.split('\n').map((line, index) => <Fragment key={index}>{index > 0 && ' '}<span className="case-copy-unit">{line}</span></Fragment>)}</>
  return <>{text.split('\n').map((line, index) => <Fragment key={index}>{index > 0 && <><br className="desktop-break" /><span className="mobile-break-space"> </span></>}<span className="case-text-unit">{line}</span></Fragment>)}</>
}

function PromptFields({ sections, applied = false }: { sections: Extract<CaseBlock, { kind: 'prompt-document' }>['sections']; applied?: boolean }) {
  return <div className="case-prompt-fields">{sections.map(section => <section className="case-prompt-section" key={section.title}>
    <h3>{section.title}</h3>
    <div>{applied ? <p>{section.application}</p> : <>{section.paragraphs?.map(text => <p key={text}>{text}</p>)}{section.items && <ul>{section.items.map(item => <li key={item}>{item}</li>)}</ul>}</>}</div>
  </section>)}</div>
}

function ContentBlock({ block, sentenceBreaks = false }: { block: CaseBlock; sentenceBreaks?: boolean }) {
  const copy = (text: string) => sentenceBreaks ? <CaseText text={text} prose /> : text
  switch (block.kind) {
    case 'execution-judgment': return <div className="case-ai-pairs">
      <div className="case-ai-pair-header"><span>AI가 맡은 일</span><span>내가 판단한 일</span></div>
      {block.items.map(item => <article className="case-ai-pair" key={item.title}>
        <div className="case-ai-pair-content">
          <div><span className="case-ai-pair-label">AI가 맡은 일</span><h3>{item.title}</h3><p>{item.execution}</p></div>
          <span className="case-ai-pair-arrow" aria-hidden="true" />
          <div><span className="case-ai-pair-label">내가 판단한 일</span><h3>{item.judgmentTitle}</h3><p>{item.judgment}</p></div>
        </div>
      </article>)}
      <aside className="case-ai-insight" aria-label="AI 활용에서 얻은 인사이트"><span className="case-ai-insight-label">이 과정에서 배운 점</span><p className="case-ai-takeaway"><strong><CaseText text={block.takeaway} /></strong></p></aside>
    </div>
    case 'problems': return <div className="case-problems">{block.items.map((item, index) => <article className="case-problem" key={item.title}>
      <span className="case-problem-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <h3>{item.title}</h3><p>{copy(item.body)}</p>
    </article>)}</div>
    case 'prompt-document': return <div className="case-prompt">
      <ol className="case-prompt-workflow" aria-label="AI와 작업하는 흐름">{block.workflow.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span><strong>{step}</strong></li>)}</ol>
      <div className="case-prompt-example">
        <p className="case-prompt-context">{block.intro}</p>
        <article className="case-prompt-document" aria-label="AI에게 전달하는 프롬프트 예시">
          <header className="case-prompt-masthead"><span>{block.request}</span></header>
          <div className="case-prompt-input">
          <PromptFields sections={block.sections} />
          </div>
        {block.cycle && <aside className="case-prompt-cycle" aria-label={block.cycle.title}>
          <p className="case-prompt-cycle-intro">{block.cycle.intro}</p>
          <h3>{block.cycle.title}</h3>
          <PromptFields sections={block.sections} applied />
        </aside>}
        </article>
      </div>
    </div>
    case 'quote': return <blockquote className="case-principle"><CaseText text={block.text} /></blockquote>
    case 'list': return <ul className="case-list">{block.items.map(item => <li key={item}>{item}</li>)}</ul>
    case 'comparison': return <div className="case-comparison">{block.columns.map(column => <div key={column.title}>
      <h3>{column.title}</h3><ul className="case-list">{column.items.map(item => <li key={item}>{item}</li>)}</ul>
    </div>)}</div>
    case 'rows': return <div className="case-rows">{block.items.map(item => <div className="case-row" key={item.title}>
      <h3>{item.title}</h3><p>{copy(item.body)}</p>
    </div>)}</div>
    case 'compact-decisions': return <div className="case-decisions case-decisions--compact">{block.items.map((item, index) => <article className="case-decision" key={item.title}>
      <span className="case-decision-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <h3>{item.title}</h3><p>{copy(item.body)}</p>
    </article>)}</div>
    case 'flows': return <div className="case-flows">{block.items.map(flow => <div key={flow.title}>
      <h3>{flow.title}</h3><ol>{flow.steps.map(step => <li key={step}>{step}</li>)}</ol>
    </div>)}</div>
    case 'decisions': return <div className="case-decisions">{block.items.map((decision, index) => <article className="case-decision" key={decision.title}>
      <span className="case-decision-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <h3>{decision.title}</h3>
      <dl>{[['Problem', decision.problem], ['Decision', decision.decision], ['Principle', decision.principle]].map(([label, text]) => <div key={label}><dt>{label}</dt><dd>{text}</dd></div>)}</dl>
    </article>)}</div>
  }
}

export function CaseStudy({ sections, heroSlot, sentenceBreaks = false }: { sections: readonly CaseSection[]; heroSlot?: ImageSlot; sentenceBreaks?: boolean }) {
  return <div className="case-study">{sections.map((section, index) => <section className={`case-section${section.blocks ? ' case-section-editorial' : ''}${section.layout ? ` case-section--${section.layout}` : ''}`} data-tone={section.tone ?? 'base'} data-spacing={section.spacing ?? 'standard'} key={section.title} aria-labelledby={`case-${index}`}>
    <div className="case-label mono"><span>{String(index + 1).padStart(2, '0')}</span>{section.title}</div>
    <div className="case-content">
      {section.lead && section.layout !== 'structure' && <ContentBlock block={section.lead} sentenceBreaks={sentenceBreaks} />}
      <h2 id={`case-${index}`}><CaseText text={section.heading} /></h2>{section.body && <p>{section.layout === 'trust' ? section.body.split('\n').map((line, lineIndex) => <Fragment key={line}>{lineIndex > 0 && <br />}{line}</Fragment>) : sentenceBreaks || ['overview', 'visual-measure', 'trust', 'directing-ai'].includes(section.layout ?? '') ? <CaseText text={section.body} prose={sentenceBreaks} /> : section.body}</p>}
      {section.lead && section.layout === 'structure' && <ContentBlock block={section.lead} sentenceBreaks={sentenceBreaks} />}
      {section.supporting && <aside className="case-supporting" aria-label="AI 활용 정보"><span>AI 활용</span><p>{section.supporting}</p></aside>}
      {section.reflectionSummary && section.blocks?.map((block, i) => <ContentBlock key={i} block={block} sentenceBreaks={sentenceBreaks} />)}
      {section.reflectionSummary && (section.process || section.closing) ? <div className="case-reflection-summary">
        {section.process && <div className="case-reflection-process">{section.process.map((step, i) => <Fragment key={step}>{i > 0 && <i aria-hidden="true">→</i>}<span>{step}</span></Fragment>)}</div>}
        {section.closing && <p className="case-reflection-insight">{section.closing}</p>}
      </div> : <>{section.process && <div className="process-line mono">{section.process.map((step, i) => <Fragment key={step}>{i > 0 && <i aria-hidden="true">→</i>}<span>{step}</span></Fragment>)}</div>}{section.closing && <p className="case-closing-copy">{section.closing}</p>}</>}
      {section.media && <div className="case-media media-surface" aria-hidden="true" />}
      {!section.reflectionSummary && section.blocks?.map((block, i) => <ContentBlock key={i} block={block} sentenceBreaks={sentenceBreaks} />)}
      {section.externalLink && <div className="case-external">
        <div className="case-external-copy">
          {section.externalLink.title && <h3>{section.externalLink.title}</h3>}
          {section.externalLink.context && <p>{section.externalLink.context}</p>}
          {section.externalLink.metaLabel && section.externalLink.metaValue && <div className="case-external-rank"><span>{section.externalLink.metaLabel}</span><strong>{section.externalLink.metaValue}</strong></div>}
        </div>
        <a className="case-external-link" href={section.externalLink.url} target="_blank" rel="noopener noreferrer" aria-label={section.externalLink.accessibleName}>{section.externalLink.label}<ArrowUpRight className="case-external-arrow" /></a>
      </div>}
    </div>
    {index === 0 && heroSlot && (heroSlot.panels ? <CaseImageCarousel slot={heroSlot} /> : <CaseImageSlot slot={heroSlot} hero />)}
    {section.layout === 'visual-measure' ? <VisualMeasureDemo /> : section.layout === 'trust' ? <ValidationDemo /> : section.imageSlot && <CaseImageSlot slot={section.imageSlot} />}
  </section>)}</div>
}
