import { Fragment } from 'react'
import type { CaseBlock, CaseSection, ImageSlot } from '../data/caseStudy'

export function CaseImageSlot({ slot, hero = false }: { slot: ImageSlot; hero?: boolean }) {
  return <figure className={`case-image-slot${hero ? ' detail-hero' : ''}`}>
    <div className="case-image-placeholder"><span>[IMAGE AREA — {slot.label}]</span></div>
    <figcaption>{slot.caption}</figcaption>
  </figure>
}

function ContentBlock({ block }: { block: CaseBlock }) {
  switch (block.kind) {
    case 'quote': return <blockquote className="case-principle">{block.text}</blockquote>
    case 'list': return <ul className="case-list">{block.items.map(item => <li key={item}>{item}</li>)}</ul>
    case 'comparison': return <div className="case-comparison">{block.columns.map(column => <div key={column.title}>
      <h3>{column.title}</h3><ul className="case-list">{column.items.map(item => <li key={item}>{item}</li>)}</ul>
    </div>)}</div>
    case 'rows': return <div className="case-rows">{block.items.map(item => <div className="case-row" key={item.title}>
      <h3>{item.title}</h3><p>{item.body}</p>
    </div>)}</div>
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

export function CaseStudy({ sections }: { sections: readonly CaseSection[] }) {
  return <div className="case-study">{sections.map((section, index) => <section className={`case-section${section.blocks ? ' case-section-editorial' : ''}`} key={section.title} aria-labelledby={`case-${index}`}>
    <div className="case-label mono"><span>{String(index + 1).padStart(2, '0')}</span>{section.title}</div>
    <div className="case-content">
      <h2 id={`case-${index}`}>{section.heading}</h2><p>{section.body}</p>
      {section.process && <div className="process-line mono">{section.process.map((step, i) => <Fragment key={step}>{i > 0 && <i aria-hidden="true">→</i>}<span>{step}</span></Fragment>)}</div>}
      {section.media && <div className="case-media media-surface" aria-hidden="true" />}
      {section.blocks?.map((block, i) => <ContentBlock key={i} block={block} />)}
    </div>
    {section.imageSlot && <CaseImageSlot slot={section.imageSlot} />}
  </section>)}</div>
}
