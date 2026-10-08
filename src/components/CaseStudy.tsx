import { Fragment, useRef, useState, type KeyboardEvent } from 'react'
import type { CaseBlock, CaseSection, ImageSlot } from '../data/caseStudy'
import { ArrowUpRight } from './ArrowUpRight'
import './CaseStudy.css'

export function CaseImageSlot({ slot, hero = false }: { slot: ImageSlot; hero?: boolean }) {
  const panels = slot.panels ?? [slot]
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

/** Explicit editorial breaks on desktop; ordinary spaces on narrower screens. */
export function CaseText({ text }: { text: string }) {
  return <>{text.split('\n').map((line, index) => <Fragment key={index}>{index > 0 && <><br className="desktop-break" /><span className="mobile-break-space"> </span></>}<span className="case-text-unit">{line}</span></Fragment>)}</>
}

function ContentBlock({ block }: { block: CaseBlock }) {
  switch (block.kind) {
    case 'prompt-document': return <div className="case-prompt">
      <ol className="case-prompt-workflow" aria-label="AI와 작업하는 흐름">{block.workflow.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span><strong>{step}</strong>{index < block.workflow.length - 1 && <i aria-hidden="true">→</i>}</li>)}</ol>
        <article className="case-prompt-document" aria-label="AI에게 전달하는 프롬프트 예시">
          <div className="case-prompt-masthead"><span>Meta Prompt</span></div>
          <p className="case-prompt-request">{block.request}</p>
          {block.sections.map(section => <section className="case-prompt-section" key={section.title}>
            <h3>{section.title}</h3>
            <div>{section.paragraphs?.map(text => <p key={text}>{text}</p>)}
              {section.items && <ul>{section.items.map(item => <li key={item}>{item}</li>)}</ul>}
            </div>
          </section>)}
        </article>
        <aside className="case-prompt-notes" aria-label="이렇게 지시한 이유">
          <div className="case-prompt-notes-label">제가 AI와 일하는 방식</div>
          <ol>{block.notes.map((note, index) => <li key={note.title}>
            <span className="case-prompt-note-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <h3>{note.title}</h3><p>{note.body}</p>
          </li>)}</ol>
        </aside>
      <footer className="case-prompt-takeaway"><p><CaseText text={block.closing} /></p></footer>
    </div>
    case 'quote': return <blockquote className="case-principle"><CaseText text={block.text} /></blockquote>
    case 'list': return <ul className="case-list">{block.items.map(item => <li key={item}>{item}</li>)}</ul>
    case 'comparison': return <div className="case-comparison">{block.columns.map(column => <div key={column.title}>
      <h3>{column.title}</h3><ul className="case-list">{column.items.map(item => <li key={item}>{item}</li>)}</ul>
    </div>)}</div>
    case 'rows': return <div className="case-rows">{block.items.map(item => <div className="case-row" key={item.title}>
      <h3>{item.title}</h3><p>{item.body}</p>
    </div>)}</div>
    case 'compact-decisions': return <div className="case-decisions case-decisions--compact">{block.items.map((item, index) => <article className="case-decision" key={item.title}>
      <span className="case-decision-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <h3>{item.title}</h3><p>{item.body}</p>
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

export function CaseStudy({ sections, heroSlot }: { sections: readonly CaseSection[]; heroSlot?: ImageSlot }) {
  return <div className="case-study">{sections.map((section, index) => <section className={`case-section${section.blocks ? ' case-section-editorial' : ''}${section.layout ? ` case-section--${section.layout}` : ''}`} data-tone={section.tone ?? 'base'} data-spacing={section.spacing ?? 'standard'} key={section.title} aria-labelledby={`case-${index}`}>
    <div className="case-label mono"><span>{String(index + 1).padStart(2, '0')}</span>{section.title}</div>
    <div className="case-content">
      {section.lead && <ContentBlock block={section.lead} />}
      <h2 id={`case-${index}`}><CaseText text={section.heading} /></h2><p>{['overview', 'visual-measure', 'trust', 'directing-ai'].includes(section.layout ?? '') ? <CaseText text={section.body} /> : section.body}</p>
      {section.process && <div className="process-line mono">{section.process.map((step, i) => <Fragment key={step}>{i > 0 && <i aria-hidden="true">→</i>}<span>{step}</span></Fragment>)}</div>}
      {section.media && <div className="case-media media-surface" aria-hidden="true" />}
      {section.blocks?.map((block, i) => <ContentBlock key={i} block={block} />)}
      {section.externalLink && <div className="case-external">
        {section.externalLink.context && <p>{section.externalLink.context}</p>}
        <a className="case-external-link" href={section.externalLink.url} target="_blank" rel="noopener noreferrer" aria-label={section.externalLink.accessibleName}>{section.externalLink.label}<ArrowUpRight className="case-external-arrow" /></a>
      </div>}
    </div>
    {index === 0 && heroSlot && (heroSlot.panels ? <CaseImageCarousel slot={heroSlot} /> : <CaseImageSlot slot={heroSlot} hero />)}
    {section.imageSlot && <CaseImageSlot slot={section.imageSlot} />}
  </section>)}</div>
}
