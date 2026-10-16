import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useCaseMotion } from '../components/useCaseMotion'
import { ArrowUpRight } from '../components/ArrowUpRight'
import '../components/CaseStudy.css'
import '../components/CaseMotion.css'
import './DesignSystemDetail.css'

const architecture = [
  ['Foundation', '색·글자·간격의 기본 언어'], ['Tokens', '의미와 역할을 가진 공통 값'],
  ['Components', '상태를 포함한 재사용 단위'], ['Patterns', '실제 업무를 수행하는 흐름'],
  ['UX Policy', '표현·행동·예외의 판단 기준'], ['Product', '같은 기준으로 확장하는 화면'],
]
const foundations = [
  ['Color', '표현의 역할', '텍스트 · 배경 · 상태'], ['Typography', '정보의 위계', '제목 · 본문 · 보조 설명'],
  ['Spacing / Grid', '배치의 관계', '입력 내부 간격 · 폼 간격 · 화면 정렬'], ['Radius / Breakpoint', '형태와 화면 대응', '컴포넌트 모서리 · 화면 크기에 따른 배치'],
]
const states = [
  ['Default', '기본 상태', '시작할 수 있는 행동을 보여줘요.'], ['Hover / Active', '가리킴 · 선택', '반응과 현재 선택을 구분해요.'],
  ['Focus', '입력 위치', '키보드로 이동한 위치를 보여줘요.'], ['Disabled', '사용 불가', '지금 실행할 수 없는 상태를 구분해요.'],
  ['Read-only', '읽기 전용', '확인할 수 있지만 수정할 수 없어요.'], ['Error', '확인 필요', '무엇을 수정해야 하는지 함께 알려줘요.'],
]

function SystemSection({ index, label, heading, body, tone = 'base', children }: {
  index: number; label: string; heading: string; body?: string; tone?: 'base' | 'elevated' | 'focus'; children?: ReactNode
}) {
  return <section className="case-section system-section" data-tone={tone} aria-labelledby={`system-heading-${index}`}>
    <div className="case-label mono"><span>{String(index).padStart(2, '0')}</span>{label}</div>
    <div className="case-content"><h2 id={`system-heading-${index}`}>{heading}</h2>{body && <p>{body}</p>}</div>
    {children}
  </section>
}

function SystemReturn({ closing = false }: { closing?: boolean }) {
  return <Link to="/#systems" className={closing ? 'case-external-link' : 'back-link'}>
    {!closing && <svg className="back-link-arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true"><path d="M13.5 8.5h-11m4-4-4 4 4 4" /></svg>}
    Back to Designing Systems{closing && <ArrowUpRight className="case-external-arrow" />}
  </Link>
}

export function DesignSystemDetail() {
  const root = useRef<HTMLDivElement>(null)
  useCaseMotion(root, 'design-system')
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    document.title = 'Designing Systems — Heo Chang Mu'
    root.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true })
  }, [])
  return <main className="project-detail project-detail-editorial system-detail">
    <header className="detail-header"><SystemReturn /></header>
    <div ref={root} className="case-study">
      <div className="detail-wrap system-introduction">
        <p className="mono system-eyebrow">Company-wide Design System</p>
        <h1 className="detail-title" tabIndex={-1}>Designing Systems.</h1>
        <p className="detail-summary">제품을 만드는 기준을,<br />사람과 AI가 함께 쓰는 언어로.</p>
        <ul className="system-positioning" aria-label="시스템의 범위"><li>Company-wide Foundation</li><li>Product Rules</li><li>AI-ready Workflow</li></ul>
      </div>

      <SystemSection index={1} label="Overview" heading="제품마다 반복되던 기준을, 하나의 시스템으로 만들었어요." body="프로젝트마다 다시 정의하던 UI 규칙을 공통 기반으로 정리하고, Figma와 코드, AI 작업까지 같은 기준을 참조할 수 있는 사내 범용 디자인 시스템을 구축했어요." />

      <SystemSection index={2} label="The Problem" heading="화면보다, 반복되는 판단을 먼저 줄였어요." body="간격부터 상태·검증·문구까지, 프로젝트마다 같은 결정을 반복하면 결과도 달라지기 쉬워요. AI로 제작이 빨라질수록 공통 기준 없이 UI의 편차도 커질 수 있다고 봤어요." tone="elevated">
        <div className="system-decision-line"><span>화면마다 다시 결정</span><i aria-hidden="true">→</i><strong>공통 기준으로 먼저 정의</strong><i aria-hidden="true">→</i><span>제품에 맞게 적용</span></div>
      </SystemSection>

      <SystemSection index={3} label="System Architecture" heading="작은 기준이 제품 전체로 이어지게 설계했어요." body="기반 값, 상태, 업무 흐름과 정책이 이어져야 화면을 확장해도 같은 제품 언어를 유지할 수 있어요." tone="focus">
        <div className="system-architecture">
          <ol className="system-architecture-layers">{architecture.map(([title, description], i) => <li key={title}><span className="system-number">0{i + 1}</span><h3>{title}</h3><p>{description}</p></li>)}</ol>
          <div className="system-reference" aria-label="Figma와 코드, AI가 같은 디자인 시스템을 참조하는 관계">
            <span className="mono">One shared reference</span><h3>같은 기준을 참조해요.</h3>
            <div>Figma<span>Variables · Components</span></div><i aria-hidden="true">↕</i>
            <strong>Design System<span>Token · Pattern · Policy</span></strong><i aria-hidden="true">↕</i>
            <div>Code / AI Agent<span>구현 · 재사용 · 검토</span></div>
            <p>화면의 모양뿐 아니라<br />사용하는 규칙까지 연결해요.</p>
          </div>
        </div>
      </SystemSection>

      <SystemSection index={4} label="Foundation" heading="값을 모으는 대신, 사용하는 이유를 연결했어요." body="색·글자·간격·그리드·모서리·화면 크기 대응을 공통 기반으로 정리했어요. 아래는 구체적인 토큰명 대신 값에서 실제 UI로 이어지는 관계를 보여줘요.">
        <div className="system-token-map" role="table" aria-label="기반 값에서 토큰의 역할과 UI 사용처로 이어지는 관계">
          <div role="row" className="system-map-header"><span role="columnheader">기반 값</span><span role="columnheader">Token의 역할</span><span role="columnheader">실제 UI</span></div>
          {foundations.map(row => <div role="row" key={row[0]}>{row.map((cell, i) => <span role={i ? 'cell' : 'rowheader'} key={cell}>{cell}</span>)}</div>)}
        </div>
      </SystemSection>

      <SystemSection index={5} label="Components & States" heading="모양뿐 아니라, 상황에 따른 동작까지 정의했어요." body="Button·Input·Select·Table·Modal·Toast를 재사용 단위로 정리하고, 각 컴포넌트에서 필요한 상태를 구분했어요." tone="elevated">
        <div className="system-state-matrix" role="table" aria-label="컴포넌트의 상태를 구분하는 기준">
          <div role="row" className="system-map-header"><span role="columnheader">State</span><span role="columnheader">의미</span><span role="columnheader">사용자에게 전달할 정보</span></div>
          {states.map(([state, label, text]) => <div role="row" key={state}><span role="rowheader" className="system-state-name">{state}</span><span role="cell">{label}</span><span role="cell">{text}</span></div>)}
        </div>
      </SystemSection>

      <SystemSection index={6} label="Product Patterns" heading="컴포넌트의 조합을, 업무 흐름으로 정리했어요." body="검색하고, 결과를 확인하고, 입력한 뒤 처리하는 흐름을 더 큰 단위로 묶었어요. 결과가 없거나 접근할 수 없는 상황도 같은 흐름 안에서 다뤄요.">
        <ol className="system-pattern-flow">
          <li><span className="system-number">01</span><h3>찾기</h3><p>Search / Filter</p><small>검색 조건과 선택 상태</small></li>
          <li><span className="system-number">02</span><h3>확인하기</h3><p>Table</p><small>Loading · Empty · Permission</small></li>
          <li><span className="system-number">03</span><h3>작성하기</h3><p>Form / Modal</p><small>입력 기준 · Validation · Error</small></li>
          <li><span className="system-number">04</span><h3>마무리하기</h3><p>Confirmation / Toast</p><small>행동 확인과 처리 결과</small></li>
        </ol>
      </SystemSection>

      <SystemSection index={7} label="UX Policy" heading="컴포넌트만으로 설명되지 않는 규칙도 시스템에 담았어요." body="같은 행동이 다른 화면에서 다르게 표현되지 않도록, 문구·상태·예외 상황까지 판단 기준으로 연결했어요." tone="elevated">
        <dl className="system-policy-list">
          <div><dt>행동의 순서</dt><dd>확인 / 취소 순서, 주요·보조 행동 위계와 Table 액션을 함께 정리해요.</dd></div>
          <div><dt>입력과 예외</dt><dd>Validation 위치, 오류 메시지, 데이터가 없는 상태의 안내 기준을 정의해요.</dd></div>
          <div><dt>표현의 일관성</dt><dd>날짜 형식, 버튼 명칭, Toast 문구처럼 반복되는 표현을 통일해요.</dd></div>
          <div><dt>조회와 관리 범위</dt><dd>Read-only와 Permission을 구분해, 확인과 수정의 범위가 화면에서도 읽히게 해요.</dd></div>
        </dl>
      </SystemSection>

      <SystemSection index={8} label="AI Workflow" heading="AI가 빨라질수록, 기준은 더 명확해야 했어요." body="화면만 요청하기보다 Design System을 맥락으로 제공해요. AI가 새 스타일을 임의로 만드는 대신 Token·Component·Pattern·Policy를 기준으로 구현하도록 해요." tone="focus">
        <ol className="system-ai-flow">{[
          ['요구사항', '무엇을 만들지 정해요.'], ['시스템 기준 제공', 'Figma · Tokens · MCP'], ['AI 구현', 'Claude / Coding Agent'], ['직접 검토', '업무 흐름과 규칙을 확인해요.'], ['규칙 보완', '반복 문제를 기준에 반영해요.'],
        ].map(([title, text], i) => <li key={title}><span className="system-number">0{i + 1}</span><h3>{title}</h3><p>{text}</p></li>)}</ol>
        <div className="case-conclusion"><p className="case-conclusion-primary">반복 제작은 AI가 줄이고, 시스템과 최종 판단은 직접 책임져요.</p></div>
      </SystemSection>

      <SystemSection index={9} label="Figma & Code" heading="도구가 달라도, 참조하는 기준은 같게 가져가요." body="Figma의 Foundation과 Components를 출발점으로, 이름과 상태·사용 규칙을 코드와 AI 작업에서도 참조할 수 있게 정리했어요.">
        <div className="system-contract"><div><span className="mono">Design</span><h3>Figma</h3><p>Variables / Tokens<br />Components / States</p></div><div className="system-contract-center"><span className="mono">Shared contract</span><h3>이름 · 역할 · 사용 규칙</h3><p>화면을 옮길 때도 유지할 기준</p></div><div><span className="mono">Implementation</span><h3>Code / AI Agent</h3><p>기존 기준 참조<br />구현 후 직접 검토</p></div></div>
        <p className="system-scope-note">연결의 기준은 공통 이름과 사용 규칙이에요. 자동 Token Sync나 React 컴포넌트 자동 생성까지 구축했다는 의미는 아니에요.</p>
      </SystemSection>

      <SystemSection index={10} label="Validation" heading="한 번 만드는 것보다, 계속 같은 기준을 유지하는 게 중요했어요." body="AI가 만든 화면도 시스템을 따르는지 직접 확인해요. 반복되는 문제는 화면 하나만 고치는 대신 공통 규칙으로 돌아가 점검해요." tone="elevated">
        <dl className="system-policy-list">
          <div><dt>참조 기준</dt><dd>공통 원본을 기준으로 이름, 컴포넌트 책임과 상태 정의를 확인해요.</dd></div>
          <div><dt>예외와 변경</dt><dd>새 규칙이 필요한지, 기존 규칙으로 해결할 수 있는지 먼저 검토해요.</dd></div>
          <div><dt>지속적인 검증</dt><dd>변경된 기준과 더 이상 쓰지 않을 규칙을 구분하고, 적용 화면의 일관성을 확인하는 방향으로 관리해요.</dd></div>
        </dl>
      </SystemSection>

      <SystemSection index={11} label="Reflection" heading="AI가 빨라질수록, 디자인 시스템의 역할은 더 커졌어요." body="디자이너와 개발자가 같은 UI를 만드는 기준에서, AI Agent까지 같은 제품 언어를 사용하는 기반으로 역할이 확장됐어요." tone="focus">
        <div className="case-conclusion"><p className="case-conclusion-primary">더 빨리 만드는 것보다, 같은 기준으로 계속 만들 수 있는 구조를 설계했어요.</p></div>
        <div className="system-return"><SystemReturn closing /></div>
      </SystemSection>
    </div>
  </main>
}
