import { useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react'
import { Link } from 'react-router-dom'
import { UserCircleIcon } from '@phosphor-icons/react/dist/csr/UserCircle'
import { PlugsConnectedIcon } from '@phosphor-icons/react/dist/csr/PlugsConnected'
import { ClockCounterClockwiseIcon } from '@phosphor-icons/react/dist/csr/ClockCounterClockwise'
import { PackageIcon } from '@phosphor-icons/react/dist/csr/Package'
import { CodeIcon } from '@phosphor-icons/react/dist/csr/Code'
import { LayoutIcon } from '@phosphor-icons/react/dist/csr/Layout'
import { StackIcon } from '@phosphor-icons/react/dist/csr/Stack'
import { SquaresFourIcon } from '@phosphor-icons/react/dist/csr/SquaresFour'
import { useCaseMotion } from '../components/useCaseMotion'
import { DetailReturnTrail } from '../components/DetailReturnTrail'
import { ArrowUpRight } from '../components/ArrowUpRight'
import { SystemFoundations } from '../components/SystemFoundations'
import { CodeBadge } from './CodeBadge'
import { StorybookAction } from '../components/StorybookAction'
import { InputSpecimen } from './DesignSystemSpecimen'
import '../components/CaseStudy.css'
import '../components/CaseMotion.css'
import './DesignSystemDetail.css'
import figmaMark from '../assets/brands/Figma Icon (Full-color).svg'
import claudeMark from '../assets/brands/Claude Spark - Clay.svg'
import mcpMark from '../assets/brands/mcp-favicon.svg'

// Original assets: Figma brand ZIP, Anthropic press kit, and official MCP repository.
// https://www.figma.com/using-the-figma-brand/ | https://anthropic.com/press-kit
// https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/favicon.svg
const brandMarks = { figma: figmaMark, claude: claudeMark, mcp: mcpMark }
function BrandMark({ brand }: { brand: keyof typeof brandMarks }) {
  return <span className={'ai-brand-mark ai-brand-mark--' + brand} aria-hidden="true"><img src={brandMarks[brand]} alt="" /></span>
}


// Existing Figma-verified alias chain. The visual introduces no new token or variant.
const variableLinks = [
  ['Primitive', '원본 색상', 'colors/emerald/900', '#004A38'],
  ['Theme', '브랜드 기준', 'colors/brand/900', 'colors/emerald/900'],
  ['Semantic', '화면에서 쓰는 역할', 'colors/fill/primary/strong/default', 'colors/brand/900'],
  ['Component', '실제 컴포넌트', 'colors/button/primary/solid/background/default', 'colors/fill/primary/strong/default'],
]
// The delivery and review practices below are supplied by the case-study author.
const systemDelivery = [
  [ClockCounterClockwiseIcon, '버전 관리', '변경 내용을 버전 단위로 관리해요.'],
  [PackageIcon, 'npm 패키지', '개발자가 설치해 사용할 수 있는 형태로 만들었어요.'],
  [CodeIcon, '프론트엔드 사용', '실제 화면 개발에서 재사용해요.'],
] as const

function SystemSection({ index, title, description, scene, children }: {
  index: number; title: string; description?: string; scene: string; children: ReactNode
}) {
  return <section className={'case-section system-section system-scene--' + scene} data-section-order={index} aria-labelledby={'system-heading-' + index}>
    <div className="system-section-heading">
      <div className="case-content"><h2 id={'system-heading-' + index}>{title}</h2>{description && <p>{description}</p>}</div>
    </div>
    {children}
  </section>
}
function SystemReturn({ closing = false, linkRef }: { closing?: boolean; linkRef?: RefObject<HTMLAnchorElement | null> }) {
  return <Link ref={linkRef} to="/#systems" className={closing ? 'case-external-link' : 'back-link'}>
    {!closing && <svg className="back-link-arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true"><path d="M13.5 8.5h-11m4-4-4 4 4 4" /></svg>}
    Back to Design System{closing && <ArrowUpRight className="case-external-arrow" />}
  </Link>
}
function SystemOverview() {
  return <div className="system-glance system-group system-wide">
    <div className="glance-stage glance-core">
      <StackIcon size={32} weight="regular" aria-hidden="true" /><h3>공통 기준</h3><p>Core</p>
      <SystemFoundations className="foundation-grid" />
    </div>
    <div className="glance-spine" aria-hidden="true" />
    <div className="glance-stage glance-platform">
      <LayoutIcon size={32} weight="regular" aria-hidden="true" /><h3>환경별 시스템</h3><p>Platform</p>
      <div className="glance-branches">{['DT', 'Web'].map(name => <div className="glance-branch" key={name}><h4>{name} 디자인 시스템</h4></div>)}</div>
    </div>
    <div className="glance-spine" aria-hidden="true" />
    <div className="glance-stage glance-project">
      <SquaresFourIcon size={32} weight="regular" aria-hidden="true" /><h3>실제 서비스</h3><p>Project</p>
    </div>
  </div>
}
function TokenFlow() {
  return <div className="token-composition system-wide">
    <ol className="token-flow" aria-label="Primitive → Theme → Semantic → Component">{variableLinks.map(([layer, meaning, name], index) => <li key={layer}>
      <span className="token-order" aria-hidden="true">0{index + 1}</span>
      <div className="token-meaning"><h3>{meaning}</h3><p>{layer}</p></div>
      <div className="token-reference">{index === 0 ? <div className="token-source"><div className="token-source-color" aria-label="원본 색상 #004A38" /><div className="code-badge-group"><CodeBadge>#004A38</CodeBadge><CodeBadge>{name}</CodeBadge></div></div> : <CodeBadge>{name}</CodeBadge>}</div>
    </li>)}</ol>
  </div>
}
function ChangePropagation() {
  return <div className="propagation-network system-wide">
    <div className="propagation-reach system-group">
      <ol className="propagation-chain" aria-label="Theme → Semantic → Component → Service">
        <li className="propagation-origin"><strong>바꾸는 색상 기준</strong><span>Theme</span><div className="propagation-node-visual"><i className="propagation-color" aria-label="확인된 기준 색상 #004A38" /><CodeBadge>#004A38</CodeBadge></div></li>
        <li><strong>같은 역할 유지</strong><span>Semantic</span><div className="propagation-node-visual"><PlugsConnectedIcon size={32} weight="regular" aria-hidden="true" /><small>참조하는 값만 반영</small></div></li>
        <li><strong>컴포넌트에 적용</strong><span>Component</span><div className="propagation-node-visual"><SquaresFourIcon size={32} weight="regular" aria-hidden="true" /><small>같은 역할을 쓰는 UI</small></div></li>
        <li><strong>여러 화면에 반영</strong><span>Service</span>
          <div className="propagation-services" aria-hidden="true">{[0, 1].map(index => <div className="propagation-service" key={index}><div className="service-wireframe" aria-hidden="true"><i /><div><b /><b /><b /></div></div></div>)}</div>
        </li>
      </ol>
    </div>
  </div>
}
function AIConnectedSystem() {
  return <div className="ai-connected-system system-group system-wide">
    <div className="ai-design-loop">
      <div className="ai-human-review">
        <UserCircleIcon size={32} weight="regular" aria-hidden="true" />
        <h3>최종 결과는 직접 검토해요</h3>
        <p>오류와 디자인을 확인하고, 최종 판단은 직접 해요.</p>
      </div>
      <div className="ai-review-bridge" aria-hidden="true" />
      <ol className="ai-reference-flow" aria-label="디자이너가 함께 검토하는 Figma, Figma MCP, Claude 연결">
        <li><BrandMark brand="figma" /><h4>Figma</h4><p>컴포넌트와 변수를 관리해요.</p></li>
        <li><BrandMark brand="mcp" /><h4>Figma MCP</h4><p>Claude가 같은 기준을 보게 연결해요.</p></li>
        <li><BrandMark brand="claude" /><h4>Claude</h4><p>화면 구조·오류·누락을 함께 살펴요.</p></li>
      </ol>
    </div>
    <div className="ai-delivery">
      <h3>검토한 기준을 개발자가 쓸 수 있게</h3>
      <p><span className="ai-copy-line">AI와 컴포넌트 구조·패키지 구성을 정리하고,</span><span className="ai-copy-line">개발자가 npm으로 설치해 쓰도록 만들었어요.</span></p>
      <ol className="ai-delivery-flow" aria-label="버전 관리에서 npm 패키지를 거쳐 프론트엔드 사용까지">{systemDelivery.map(([Icon, title, description]) => <li key={title}>
        <Icon size={24} weight="regular" aria-hidden="true" /><h4>{title}</h4><p>{description}</p>
      </li>)}</ol>
    </div>
  </div>
}
function StorybookResult() {
  return <div className="storybook-result system-group system-wide">
    <ol className="storybook-flow" aria-label="Figma 설계에서 AI 구현, Storybook 확인, 개발 활용까지">
      <li><strong>설계</strong><span>Figma</span><p>컴포넌트 · 변수 · 상태</p></li>
      <li><strong>구현</strong><span>AI</span><p>기존 기준으로 구조와 스타일 구현</p></li>
      <li><strong>확인</strong><span>Storybook</span><p>컴포넌트별 형태와 상태 확인</p></li>
      <li><strong>개발 활용</strong><span>Frontend</span><p>실제 구현 기준으로 사용</p></li>
    </ol>
    <div className="storybook-review">
      <p>화면 전체를 열지 않아도 컴포넌트 하나씩 상태와 스타일을 확인할 수 있어요.</p>
      <p>Figma 구조·토큰 확인부터 코드 구현·상태 구성·Storybook 등록까지 AI를 활용했어요. 결과는 직접 비교하고, 오류를 수정하며 정합성을 확인했어요.</p>
      <StorybookAction />
    </div>
  </div>
}
export function DesignSystemDetail() {
  const root = useRef<HTMLDivElement>(null)
  const backLinkRef = useRef<HTMLAnchorElement>(null)
  useCaseMotion(root, 'design-system')
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    document.title = 'Design System — Heo Chang Mu'
    root.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true })
  }, [])
  return <main className="project-detail project-detail-editorial system-detail">
    <header className="detail-header"><SystemReturn linkRef={backLinkRef} /></header>
    <DetailReturnTrail backLinkRef={backLinkRef} destination="/#systems" label="Design System" />
    <div ref={root} className="case-study">
      <div className="detail-wrap system-introduction"><h1 className="detail-title" tabIndex={-1}>Design System.</h1><p className="detail-summary">여러 서비스가 함께 쓸 디자인 기준을 만들고, DT·Web 환경에 맞춰 실제 화면에 적용했어요.</p></div>
      <SystemSection index={1} title="공통 기준에서 실제 서비스까지" description="공통 기준이 DT·Web 시스템을 거쳐 실제 서비스에 적용되는 구조를 보여줘요." scene="overview"><SystemOverview /></SystemSection>
      <SystemSection index={2} title="기본 값이 화면에 쓰이기까지" description="색상 같은 기본 값이 역할별 토큰을 거쳐 실제 UI에 연결되는 과정을 보여줘요." scene="token"><TokenFlow /></SystemSection>
      <SystemSection index={3} title="컴포넌트 하나를 여러 형태로" description="컴포넌트를 다시 만들지 않고, 속성을 바꿔 여러 상황에 사용하는 방식을 보여줘요." scene="component"><div className="system-wide"><InputSpecimen /></div></SystemSection>
      <SystemSection index={4} title="한 곳의 변경을 연결된 화면까지" description="한 곳의 기준을 바꾸면 연결된 컴포넌트와 서비스 화면에도 같은 변경이 이어져요." scene="propagation"><ChangePropagation /></SystemSection>
      <SystemSection index={5} title="AI와 검토하고 개발까지 연결해요" description="Figma 기준을 Claude와 검토하고, 개발자가 쓰는 패키지로 연결한 과정을 보여줘요." scene="ai"><AIConnectedSystem /></SystemSection>
      <SystemSection index={6} title="설계한 컴포넌트를 Storybook까지 구현했어요" description="Figma의 컴포넌트와 상태를 AI로 구현해, Storybook에서 확인할 수 있게 했어요." scene="storybook"><StorybookResult /></SystemSection>
      <SystemSection index={7} title="하나의 기준을 넓혀, 여러 서비스가 같은 디자인 언어를 쓰도록 만들었어요." scene="conclusion">{null}</SystemSection>
    </div>
    <footer className="detail-closing"><nav className="detail-closing-inner" aria-label="메인 Journey로 돌아가기"><SystemReturn closing /></nav></footer>
  </main>
}
