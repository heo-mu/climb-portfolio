import type { CaseBlock } from '../data/caseStudy'

export function SpatialHierarchy({ block }: { block: Extract<CaseBlock, { kind: 'spatial-hierarchy' }> }) {
  return <div className="case-spatial-hierarchy">
    <ol className="case-spatial-path" aria-label="건물에서 데이터까지 공간을 좁혀가는 순서">
      {block.steps.map((step, index) => <li key={step.title}>
        <span className="case-spatial-index mono" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <span className="case-spatial-node" aria-hidden="true" />
        <h3>{step.title}</h3>
        <span className="case-spatial-detail">{step.detail}</span>
        {index < block.steps.length - 1 && <span className="case-spatial-arrow" aria-hidden="true" />}
      </li>)}
    </ol>
    <div className="case-spatial-principles">{block.principles.map(item => <div key={item.title}><h3>{item.title}</h3><p>{item.body}</p></div>)}</div>
  </div>
}
