import { Link } from 'react-router-dom'
import { ArrowUpRight } from './ArrowUpRight'
import './DesigningSystems.css'

export function DesigningSystems() {
  return <>
    <h1 className="portfolio-heading" id="title-systems" tabIndex={-1}>Designing Systems<span className="heading-accent">.</span></h1>
    <p className="systems-intro">화면을 반복해서 만드는 대신,<br />다시 사용할 수 있는 기준을 설계해요.</p>
    <ol className="systems-foundations" aria-label="디자인 시스템의 세 가지 기준">
      <li><span className="systems-index">01</span><div><h2>Foundation</h2><p>제품의 기본 언어를 정의해요.</p><span className="systems-terms">Token · Typography · Spacing · Grid · Radius · Color</span></div></li>
      <li><span className="systems-index">02</span><div><h2>Product Rules</h2><p>컴포넌트보다, 사용하는 규칙까지 설계해요.</p><span className="systems-terms">Components · States · Patterns · UX Policy</span></div></li>
      <li><span className="systems-index">03</span><div><h2>AI-ready System</h2><p>사람과 AI가 같은 기준으로 만들게 해요.</p><span className="systems-terms">Figma · Tokens · MCP · Coding Agent · Validation</span></div></li>
    </ol>
    <p className="systems-chain" aria-label="기반에서 제품으로 이어지고 AI와 코드가 같은 기준을 참조해요"><span>Foundation</span><i aria-hidden="true">→</i><span>Component</span><i aria-hidden="true">→</i><span>Pattern</span><i aria-hidden="true">→</i><span>Product</span><span className="systems-chain-code">AI / Code ↔ 같은 기준</span></p>
    <Link className="systems-case-link" to="/design-system">View System Case<ArrowUpRight className="systems-case-arrow" /></Link>
  </>
}
