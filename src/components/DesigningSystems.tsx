import { Link } from 'react-router-dom'
import { ArrowUpRight } from './ArrowUpRight'
import './DesigningSystems.css'
import { StorybookAction } from './StorybookAction'

export function DesigningSystems() {
  return <>
    <h1 className="portfolio-heading" id="title-systems" tabIndex={-1}>Design System<span className="heading-accent">.</span></h1>
    <p className="systems-intro"><span>여러 프로젝트가 함께 쓸 디자인 기준을 만들고,</span><span>DT·Web 환경에 맞춰 실제 서비스에 적용했어요.</span></p>
    <div className="systems-summary">
      <ol className="systems-structure" aria-label="공통 기준에서 환경별 시스템을 거쳐 실제 서비스까지">
        <li><h2>함께 쓰는 기준</h2><p>Core</p><div className="systems-foundations">글자 · 색상 · 간격 · 모서리 · 아이콘</div></li>
        <li><h2>환경에 맞게 확장</h2><p>Platform <span aria-hidden="true">·</span> DT / Web</p></li>
        <li><h2>실제 서비스에서 사용</h2><p>Project</p></li>
      </ol>
    </div>
    <div className="systems-actions"><Link className="systems-case-link" to="/design-system">
      <strong>View System Case</strong>
      <ArrowUpRight className="systems-case-arrow" />
    </Link><StorybookAction /></div>
  </>
}
