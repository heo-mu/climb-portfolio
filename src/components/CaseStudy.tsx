import { Fragment, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import type { CaseBlock, CaseSection, ImageSlot } from '../data/caseStudy'
import { SpatialHierarchy } from './SpatialHierarchy'
import { ArrowUpRight } from './ArrowUpRight'
import { VisualMeasureDemo } from './VisualMeasureDemo'
import { ValidationDemo } from './ValidationDemo'
import { useCaseMotion } from './useCaseMotion'
import { CaseAIBorder } from './CaseAIBorder'
import './CaseStudy.css'
import './CaseStudyExpanded.css'
import './SpatialHierarchy.css'
import './CaseMotion.css'

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

function CaseImageCarousel({ slot, projectSlug, projectName }: { slot: ImageSlot; projectSlug: string; projectName: string }) {
  const panels = slot.panels ?? [slot]
  const [activeIndex, setActiveIndex] = useState(0)
  const [outgoingIndex, setOutgoingIndex] = useState<number | null>(null)
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'backward'>('forward')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const activePanel = panels[activeIndex]
  const selectPanel = (nextIndex: number) => {
    if (nextIndex === activeIndex) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setTransitionDirection(nextIndex > activeIndex ? 'forward' : 'backward')
    setOutgoingIndex(reducedMotion ? null : activeIndex)
    setIsTransitioning(!reducedMotion)
    setActiveIndex(nextIndex)
  }
  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    let nextIndex = activeIndex
    if (event.key === 'ArrowRight') nextIndex = (activeIndex + 1) % panels.length
    else if (event.key === 'ArrowLeft') nextIndex = (activeIndex - 1 + panels.length) % panels.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = panels.length - 1
    else return
    event.preventDefault()
    selectPanel(nextIndex)
    tabRefs.current[nextIndex]?.focus()
  }
  return <div className="case-image-carousel" aria-label={`${projectName} 대표 화면`}>
    <div className="case-image-tabs" role="tablist" aria-label={`${projectName} 대표 화면 선택`} style={{ '--case-image-tab-count': panels.length } as CSSProperties}>
      {panels.map((panel, index) => <button
        key={panel.label}
        ref={element => { tabRefs.current[index] = element }}
        className="case-image-tab"
        id={`${projectSlug}-screen-tab-${index}`}
        type="button"
        role="tab"
        aria-selected={activeIndex === index}
        aria-controls={`${projectSlug}-screen-panel`}
        tabIndex={activeIndex === index ? 0 : -1}
        onClick={() => selectPanel(index)}
        onKeyDown={onTabKeyDown}
      ><span className="case-image-tab-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span>{panel.label}</span></button>)}
    </div>
    <figure className="case-image-slot case-image-slot--wide case-image-carousel-frame" role="tabpanel" id={`${projectSlug}-screen-panel`} aria-labelledby={`${projectSlug}-screen-tab-${activeIndex}`}>
      <div className="case-image-stage case-image-stage--crossfade">
        {outgoingIndex !== null && <div className={`case-image-panel case-image-panel--outgoing case-image-panel--${transitionDirection}`} aria-hidden="true" style={panels[outgoingIndex].image ? { aspectRatio: `${panels[outgoingIndex].image.width} / ${panels[outgoingIndex].image.height}` } : undefined}>
          {panels[outgoingIndex].image ? <img src={panels[outgoingIndex].image.src} alt="" width={panels[outgoingIndex].image.width} height={panels[outgoingIndex].image.height} loading="eager" decoding="async" />
            : <div className="case-image-placeholder"><span>IMAGE — {panels[outgoingIndex].description ?? panels[outgoingIndex].label}</span></div>}
        </div>}
        <div key={activeIndex} className={`case-image-panel${isTransitioning ? ` case-image-panel--incoming case-image-panel--${transitionDirection}` : ''}`} onAnimationEnd={() => { setOutgoingIndex(null); setIsTransitioning(false) }} style={activePanel.image ? { aspectRatio: `${activePanel.image.width} / ${activePanel.image.height}` } : undefined}>
          {activePanel.image ? <img src={activePanel.image.src} alt={activePanel.image.alt} width={activePanel.image.width} height={activePanel.image.height} loading="eager" decoding="async" />
            : <div className="case-image-placeholder"><span>IMAGE — {activePanel.description ?? activePanel.label}</span></div>}
        </div>
      </div>
    </figure>
  </div>
}

/** Prose keeps semantic groups; headings release hard breaks on narrow screens. */
export function CaseText({ text, prose = false }: { text: string; prose?: boolean }) {
  if (!prose && /<br\s*\/?\s*>/i.test(text)) return <>{text.split(/<br\s*\/?\s*>/i).map((line, index) => <Fragment key={index}>{index > 0 && <br />}<span className="case-text-unit">{line}</span></Fragment>)}</>
  if (prose) return <>{text.split('\n').map((line, index) => <Fragment key={index}>{index > 0 && ' '}<span className="case-copy-unit">{line}</span></Fragment>)}</>
  return <>{text.split('\n').map((line, index) => <Fragment key={index}>{index > 0 && <><br className="desktop-break" /><span className="mobile-break-space"> </span></>}<span className="case-text-unit">{line}</span></Fragment>)}</>
}

function usesSplitSectionHeader(section: CaseSection, projectSlug: string) {
  return Boolean(section.body && (
    ['overview', 'product', 'spatial-structure'].includes(section.layout ?? '')
    || (projectSlug === 'samsung-bees' && section.title.trim().toLowerCase() === 'the problem')
  ))
}

function PromptFields({ sections }: { sections: Extract<CaseBlock, { kind: 'prompt-document' }>['sections'] }) {
  return <div className="case-prompt-fields">{sections.map(section => <section className="case-prompt-section" key={section.title}>
    <h3>{section.title}</h3>
    <div>{section.paragraphs?.map(text => <p key={text}>{text}</p>)}{section.items && <ul>{section.items.map(item => <li key={item}>{item}</li>)}</ul>}</div>
  </section>)}</div>
}

function CaseAIInsight({ text }: { text: string }) {
  return <aside className="case-ai-insight" aria-label="AI 활용 정보"><CaseAIBorder /><span className="case-ai-insight-label">AI 활용</span><p className="case-ai-insight-body">{text}</p></aside>
}

/** A design judgment or lesson, distinct from the AI usage surface. */
function CaseConclusion({ label = '핵심 정리', text, supporting }: { label?: '핵심 정리' | '배운 점' | '다음에 가져갈 기준'; text?: string; supporting?: string }) {
  return <aside className="case-conclusion">
    <span className="case-conclusion-label">{label}</span>
    {text && <p className="case-conclusion-primary"><CaseText text={text} /></p>}
    {supporting && <p className="case-conclusion-supporting"><CaseText text={supporting} /></p>}
  </aside>
}

function ContentBlock({ block, sentenceBreaks = false }: { block: CaseBlock; sentenceBreaks?: boolean }) {
  const copy = (text: string) => sentenceBreaks ? <CaseText text={text} prose /> : text
  switch (block.kind) {
    case 'supporting': return <CaseAIInsight text={block.text} />
    case 'spatial-hierarchy': return <SpatialHierarchy block={block} />
    case 'image-workflow': return <div className="case-image-workflow">
      <ol className="case-image-workflow-steps">{block.steps.map((step, index) => <li key={step.title}>
        <span className="case-image-workflow-index mono" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <h3>{step.title}</h3><span className="case-image-workflow-role">{step.responsibility}</span><p>{step.body}</p>
      </li>)}</ol>
      <div className="case-image-workflow-grid">{block.images.map(panel => <div className="case-image-workflow-slot" key={panel.label} aria-hidden={!panel.image || undefined}>
        {panel.image && <img src={panel.image.src} alt={panel.image.alt} width={panel.image.width} height={panel.image.height} loading="lazy" decoding="async" />}
      </div>)}</div>
    </div>
    case 'insight': return <CaseConclusion label={block.label} text={block.text} supporting={block.supporting} />
    case 'production-workflow': return <ol className="case-production-workflow" aria-label="요구사항부터 실제 시안까지의 제작 과정">{block.steps.map((step, index) => <li key={step.title}><span className="case-production-index mono" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><h3>{step.title}</h3><p>{step.body}</p></li>)}</ol>
    case 'execution-judgment': return <div className="case-ai-pairs">
      <div className="case-ai-pair-header"><span>AI가 맡은 일</span><span>내가 판단한 일</span></div>
      {block.items.map(item => <article className="case-ai-pair" key={item.title}>
        <div className="case-ai-pair-content">
          <div><span className="case-ai-pair-label">AI가 맡은 일</span><h3>{item.title}</h3><p>{item.execution}</p></div>
          <span className="case-ai-pair-arrow" aria-hidden="true" />
          <div><span className="case-ai-pair-label">내가 판단한 일</span><h3>{item.judgmentTitle}</h3><p>{item.judgment}</p></div>
        </div>
      </article>)}
    </div>
    case 'problems': return <div className="case-problems" style={{ '--case-problem-count': block.items.length } as CSSProperties}>{block.items.map((item, index) => <article className="case-problem" key={item.title}>
      <span className="case-problem-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <h3>{item.title}</h3><p>{copy(item.body)}</p>
    </article>)}</div>
    case 'prompt-document': return <div className="case-prompt">
      <ol className="case-prompt-workflow" aria-label="AI와 작업하는 흐름">{block.workflow.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span><strong>{step}</strong></li>)}</ol>
      <div className="case-prompt-example">
        <article className="case-prompt-document" aria-label="AI에게 전달하는 프롬프트 예시">
          <header className="case-prompt-masthead"><span>{block.request}</span></header>
          <div className="case-prompt-input">
          <PromptFields sections={block.sections} />
          </div>
        </article>
      </div>
    </div>
    case 'graph-workflow': return <div className="case-graph-workflow">
      <p className="case-graph-workflow-label">{block.title}</p>
      <div className={block.evidence ? 'case-graph-workflow-evidence' : undefined}>
      <ol className="case-graph-workflow-steps">{block.steps.map((step, index) => <li key={step.title} id={block.evidence?.stepIndex === index ? 'graph-plugin-step' : undefined}>
        <span className="case-graph-workflow-index mono">STEP {String(index + 1).padStart(2, '0')}</span>
        <h3>{step.title}</h3><p>{step.body}</p>
      </li>)}</ol>
      {block.evidence && <figure className="case-graph-plugin"><img src={block.evidence.image.src} alt={block.evidence.image.alt} width={block.evidence.image.width} height={block.evidence.image.height} loading="lazy" decoding="async" /></figure>}
      </div>
      {block.supporting && <CaseAIInsight text={block.supporting} />}
      <CaseConclusion text={block.insight} supporting={block.conclusion} />
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
      <h3>{flow.title}</h3><ol style={{ '--case-flow-count': flow.steps.length } as CSSProperties}>{flow.steps.map(step => <li key={step}>{step}</li>)}</ol>
    </div>)}</div>
    case 'decisions': return <div className="case-decisions">{block.items.map((decision, index) => <article className="case-decision" key={decision.title}>
      <span className="case-decision-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <h3>{decision.title}</h3>
      <dl>{[['Problem', decision.problem], ['Decision', decision.decision], ['Principle', decision.principle]].map(([label, text]) => <div key={label}><dt>{label}</dt><dd>{text}</dd></div>)}</dl>
    </article>)}</div>
  }
}

export function CaseStudy({ sections, heroSlot, projectSlug, projectName, sentenceBreaks = false }: { sections: readonly CaseSection[]; heroSlot?: ImageSlot; projectSlug: string; projectName: string; sentenceBreaks?: boolean }) {
  const motionRoot = useRef<HTMLDivElement>(null)
  useCaseMotion(motionRoot, projectSlug)
  const orderedSections = [...sections]
  const overviewIndex = orderedSections.findIndex(section => section.title.trim().toLowerCase() === 'overview')
  if (overviewIndex > 0) orderedSections.unshift(orderedSections.splice(overviewIndex, 1)[0])
  const problemIndex = orderedSections.findIndex(section => ['problem', 'the problem'].includes(section.title.trim().toLowerCase()))
  if (problemIndex > 1) orderedSections.splice(1, 0, orderedSections.splice(problemIndex, 1)[0])

  return <div className="case-study" ref={motionRoot}>{orderedSections.map((section, index) => <section className={`case-section${section.blocks ? ' case-section-editorial' : ''}${section.layout ? ` case-section--${section.layout}` : ''}`} data-tone={section.tone ?? 'base'} data-spacing={section.spacing ?? 'standard'} key={section.title} aria-labelledby={`case-${index}`}>
    <div className="case-label mono"><span>{String(index + 1).padStart(2, '0')}</span>{section.title}</div>
    <div className={`case-content${usesSplitSectionHeader(section, projectSlug) ? ' case-section-header-split' : ''}`}>
      {section.lead && section.layout !== 'structure' && <ContentBlock block={section.lead} sentenceBreaks={sentenceBreaks} />}
      <h2 id={`case-${index}`}><CaseText text={section.heading} /></h2>{section.body && <p>{usesSplitSectionHeader(section, projectSlug) ? section.body.split(/<br\s*\/?\s*>|\n|(?<=\.)\s+/i).map((sentence, i) => <Fragment key={i}>{i > 0 && ' '}<span className="case-section-description-line">{sentence}</span></Fragment>) : section.layout === 'trust' ? section.body.split('\n').map((line, lineIndex) => <Fragment key={line}>{lineIndex > 0 && <br />}{line}</Fragment>) : section.body.includes('<br') || sentenceBreaks || ['overview', 'visual-measure', 'trust', 'directing-ai'].includes(section.layout ?? '') ? <CaseText text={section.body} prose={sentenceBreaks && section.layout !== 'visual-measure'} /> : section.body}</p>}
      {section.lead && section.layout === 'structure' && <ContentBlock block={section.lead} sentenceBreaks={sentenceBreaks} />}
      {section.reflectionSummary && section.blocks?.map((block, i) => <ContentBlock key={i} block={block} sentenceBreaks={sentenceBreaks} />)}
      {section.reflectionSummary && (section.process || section.closing)
        ? <div className="case-reflection-summary">
          {section.closing && <CaseConclusion label="배운 점" text={section.closing} />}
          {section.process && <div className="case-reflection-process" style={{ '--case-process-count': section.process.length } as CSSProperties}>{section.process.map((step, i) => <Fragment key={step}>{i > 0 && <i aria-hidden="true">→</i>}<span>{step}</span></Fragment>)}</div>}
        </div>
        : <>{section.process && <div className="process-line mono">{section.process.map((step, i) => <Fragment key={step}>{i > 0 && <i aria-hidden="true">→</i>}<span>{step}</span></Fragment>)}</div>}{section.closing && <CaseConclusion text={section.closing} />}</>}
      {section.media && <div className="case-media media-surface" aria-hidden="true" />}
      {!section.reflectionSummary && section.blocks?.map((block, i) => <Fragment key={i}>
        {section.layout === 'ai-agent' && block.kind === 'supporting' && section.imageSlot && <CaseImageSlot slot={section.imageSlot} />}
        <ContentBlock block={block} sentenceBreaks={sentenceBreaks} />
      </Fragment>)}
      {section.externalLink && <div className="case-external">
        <div className="case-external-copy">
          {section.externalLink.title && <h3>{section.externalLink.title}</h3>}
          {section.externalLink.context && <p>{section.externalLink.context}</p>}
          {section.externalLink.metaLabel && section.externalLink.metaValue && <div className="case-external-rank"><span>{section.externalLink.metaLabel}</span><strong>{section.externalLink.metaValue}</strong></div>}
        </div>
        <a className="case-external-link" href={section.externalLink.url} target="_blank" rel="noopener noreferrer" aria-label={section.externalLink.accessibleName}>{section.externalLink.label}<ArrowUpRight className="case-external-arrow" /></a>
      </div>}
    </div>
    {index === 0 && heroSlot && <CaseImageCarousel key={projectSlug} slot={heroSlot} projectSlug={projectSlug} projectName={projectName} />}
    {section.layout === 'visual-measure' ? <VisualMeasureDemo /> : section.layout === 'trust' ? <ValidationDemo /> : section.layout !== 'ai-agent' && section.imageSlot && <CaseImageSlot slot={section.imageSlot} />}
    {section.supporting && <CaseAIInsight text={section.supporting} />}
  </section>)}</div>
}
