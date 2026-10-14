import type { CaseSection, ProjectDetailContent } from './caseStudy.ts'

// Editorial draft based on the project brief; responsibilities use existing repo metadata.
export const edkDetail: ProjectDetailContent = {
  presentation: 'editorial', summary: '기업의 ESG 데이터를 한곳에서 관리하는 기업용 ESG 플랫폼',
  metadata: [['TYPE', '기업 ESG 관리 플랫폼'], ['PERIOD', '2024.12 — 2025.12'], ['ROLE', 'UI/UX 디자인 · UX 기획 · 정책 설계 · 디자인 시스템 구축']],
  heroSlot: { label: 'EDK 대표 화면', layout: 'wide', panels: [
    { label: '업무 현황', image: { src: new URL('../../img/projects/edk/edk_main01.png', import.meta.url).href, alt: 'EDK ESG 업무 현황 대시보드', width: 1920, height: 1080 } },
    { label: '목표 탐색', image: { src: new URL('../../img/projects/edk/edk_main04.png', import.meta.url).href, alt: 'EDK ESG 목표 탐색 화면', width: 1920, height: 1080 } },
    { label: '목표 상세', image: { src: new URL('../../img/projects/edk/edk_main05.png', import.meta.url).href, alt: 'EDK ESG 목표 상세 화면', width: 1920, height: 1080 } },
    { label: '결과보고서', image: { src: new URL('../../img/projects/edk/edk_main02.webp', import.meta.url).href, alt: 'EDK ESG 결과보고서 작성 화면', width: 1920, height: 1080 } },
    { label: 'AI 진단', image: { src: new URL('../../img/projects/edk/edk_main03.webp', import.meta.url).href, alt: 'EDK AI 진단 화면', width: 1920, height: 1080 } },
    { label: '평가 문항', image: { src: new URL('../../img/projects/edk/edk_main06.png', import.meta.url).href, alt: 'EDK ESG 평가 문항 수정 화면', width: 1920, height: 1080 } },
    { label: '평가 등급', image: { src: new URL('../../img/projects/edk/edk_main07.png', import.meta.url).href, alt: 'EDK ESG 평가 등급 화면', width: 1920, height: 1080 } },
  ] },
}

export const edkCaseStudy: readonly CaseSection[] = [
  {
    layout: 'overview', title: 'Overview', tone: 'base',
    heading: '많은 지표를, 관리할 수 있는 구조로 정리했어요.',
    body: '기업의 ESG 데이터를 한곳에서 관리하는 B2B SaaS 플랫폼이에요. 조직과 기간, 담당자에 따라 달라지는 정보를 찾고 입력하고 확인하는 공통 규칙을 정리했어요.',
  },
  {
    layout: 'statement', title: 'The Problem', tone: 'focus', spacing: 'narrative',
    heading: '같은 ESG 데이터라도, 역할에 따라 관리 범위가 달랐어요.',
    body: '플랫폼 관리자부터 기업 사용자까지 서로 다른 역할이 하나의 플랫폼에서 ESG 데이터를 관리해야 했어요.\n역할마다 책임과 권한이 달라, 어떤 기능과 정보를 보여줄지 명확한 기준이 필요했어요.',
    blocks: [{ kind: 'problems', items: [
      { title: '역할마다 다른 관리 범위', body: '플랫폼 관리자는 전체를, 기업 관리자는 자기 기업을 관리하고 사용자는 필요한 기능만 사용해요.' },
      { title: '여러 업무에 쌓이는 ESG 데이터', body: '인권영향평가·공급망평가·목표 등 다양한 ESG 데이터를 한 플랫폼에서 관리해야 했어요.' },
      { title: '권한에 따라 달라지는 접근', body: '같은 메뉴라도 역할에 따라 조회·관리 범위가 달라, 권한 기준이 명확해야 했어요.' },
    ] }, { kind: 'insight', text: '기능을 늘리기보다, 역할과 관리 범위를 먼저 명확히 나누는 것이 서비스 구조의 기준이 됐어요.' }],
  },
  {
    layout: 'hierarchy', title: 'Structure', tone: 'elevated', spacing: 'narrative',
    heading: '역할은 나누고, ESG 업무는 하나의 구조로 연결했어요.',
    body: '플랫폼 관리자부터 기업 사용자까지 관리 범위를 구분하고, 웹공시·정책·목표·평가·AI 보고서 같은 ESG 업무를 하나의 B2B SaaS 안에서 운영하도록 설계했어요.',
    blocks: [{ kind: 'role-hierarchy', roles: [
      { title: '플랫폼 관리자', scope: '전체 플랫폼 / 기업 / 기능 운영' },
      { title: '기업 관리자', scope: '자기 기업 / 사용자 / ESG 데이터 관리' },
      { title: '기업 사용자', scope: '부여된 권한 안에서 실무 기능 사용' },
    ], workflows: ['웹공시', '정책', '목표', '인권영향평가', '공급망평가', 'AI 보고서'] },
    { kind: 'insight', text: '역할은 달라도, 업무 구조는 같게 가져갔어요.', supporting: '누가 사용하는지에 따라 접근 범위는 달라지지만, 평가·목표·데이터를 확인하고 관리하는 기본 흐름은 일관되게 유지했어요.' }],
  },
  {
    layout: 'comparison', title: 'Permissions', tone: 'base',
    heading: '권한 정책을 화면의 기능과 정보 범위에 연결했어요.',
    body: '관리자의 운영·관리 기능과 기업 사용자의 실무 기능을 구분했어요.\nUX 기획과 정책 설계에서 정한 책임 범위를 화면 구성의 기준으로 삼았어요.',
    blocks: [{ kind: 'comparison', columns: [
      { title: '정책에서 구분한 범위', items: ['플랫폼 전체 운영과 개별 기업의 관리를 구분했어요.', '기업 관리자에게는 자기 기업의 사용자와 ESG 데이터 관리 범위를 정했어요.'] },
      { title: '화면에 반영한 범위', items: ['관리 화면은 각 관리자가 맡은 운영 범위에 맞춰 구성했어요.', '기업 사용자 화면은 부여된 권한 안에서 사용하는 실무 기능을 기준으로 구성했어요.'] },
    ] }],
  },
  {
    layout: 'narrative', title: 'Policy Design', tone: 'focus', spacing: 'narrative',
    heading: '반복되는 화면보다, 먼저 기준을 정했어요.',
    body: '디자인 시스템을 컴포넌트 모음으로 끝내지 않고, 상태·행동·문구·예외 상황까지 같은 기준으로 동작하도록 UX 정책을 함께 설계했어요.',
    supporting: '정책 초안을 기준으로 AI와 함께 반복되는 규칙을 정리하고, 빠져 있던 상태·예외·인터랙션 기준까지 점검했어요. 필요한 항목을 보완한 뒤 실제 서비스에 맞는지 직접 검토해 최종 정책으로 정리했어요.',
    blocks: [{ kind: 'rows', items: [
      { title: '01. 행동의 기준을 통일했어요', body: '같은 행동이 화면마다 다르게 표현되지 않도록 문구와 액션 기준을 먼저 정했어요.', examples: [
        'Modal 확인·취소 버튼의 명칭과 순서',
        'Table 상단 액션 버튼의 위치와 우선순위',
        'Toast 문구의 종결 어미와 작성 방식',
      ] },
      { title: '02. 상태가 바뀌어도 사용자가 바로 이해하게 했어요', body: '기본·선택·읽기 전용처럼 반복되는 상태를 공통 규칙으로 정의해 화면이 달라도 같은 방식으로 읽히게 했어요.', examples: [
        'Table Row의 Hover와 현재 선택 상태',
        '단일·다중 Filter의 Default·Active 상태',
        'Editable·Read-only 구분',
        '상태 아이콘의 Hover·Click 시 설명 방식',
      ] },
      { title: '03. 입력 오류와 예외 상황까지 정책으로 만들었어요', body: '정상 화면뿐 아니라 입력 오류와 데이터가 없는 상황까지 미리 정의해 구현 단계에서 판단이 달라지지 않게 했어요.', examples: [
        '필수값 누락 시 에러 메시지 노출',
        '최대 글자수 초과 시 입력 제한과 안내',
        'File Upload 상태와 오류 처리',
        'Table Empty·Null 데이터 노출 기준',
      ] },
      { title: '04. 반복되는 컴포넌트도 사용 방식까지 정했어요', body: '컴포넌트 모양뿐 아니라, 언제 어떻게 동작하고 어떤 문구를 쓰는지까지 정책으로 연결했어요.', examples: [
        'Search Bar의 검색 방식과 Active 상태',
        'Textarea의 Default·Hover·Active·Read-only 상태',
        'Modal 내 상태 설명 구조',
      ] },
    ] }],
    imageSlot: { label: 'UX/UI 정책 문서', layout: 'wide', image: {
      src: new URL('../../img/projects/edk/policy_01.png', import.meta.url).href,
      alt: 'Form, Table, Toast, Modal의 UX/UI 정책 문서',
      width: 1118,
      height: 420,
    } },
  },
  {
    layout: 'narrative', title: 'Design System', tone: 'elevated', spacing: 'narrative',
    heading: '여러 ESG 업무를 같은 화면 기준으로 설계했어요.',
    body: '버튼·입력·테이블·모달 등 반복 컴포넌트와 Default·Hover·Active·Disabled·Read-only 상태를 정리하고, Policy Design의 문구·상태·예외 기준을 연결해 운영 가능한 디자인 시스템으로 만들었어요.',
    blocks: [{ kind: 'rows', items: [
      { title: '역할이 달라도 같은 UI 규칙', body: '관리자와 기업 사용자 화면에서 같은 컴포넌트와 상태 표현 기준을 유지했어요.' },
      { title: '반복 화면을 같은 기준으로 확장', body: '문구·상태·예외 정책을 컴포넌트에 연결해 화면마다 새로 판단하지 않고 같은 규칙으로 구성할 수 있게 했어요.' },
    ] }],
    imageSlot: { label: 'EDK 디자인 시스템', layout: 'wide', image: {
      src: new URL('../../img/projects/edk/system_01.png', import.meta.url).href,
      alt: 'EDK 디자인 시스템의 Button, Badge, Dashboard 컴포넌트와 상태 예시',
      width: 2204,
      height: 956,
    } },
  },
  {
    layout: 'reflection', title: 'Reflection', tone: 'base', spacing: 'narrative', reflectionSummary: true,
    heading: '화면을 늘리기 전에, 제품의 기준을 정해야 했어요.',
    blocks: [{ kind: 'rows', items: [
      { title: '01', body: '플랫폼 전체와 기업별 관리 범위를 구분하는 일이 화면 설계의 출발점이었어요.' },
      { title: '02', body: 'UX 기획과 정책 설계는 어떤 정보와 기능을 보여줄지 정하는 기준이었어요.' },
      { title: '03', body: '디자인 시스템은 서로 다른 ESG 업무를 하나의 제품으로 연결하는 기준이었어요.' },
    ] }],
    closing: '제품 전체의 일관성은 역할·권한·업무 범위를 먼저 명확히 정의하는 데서 시작됐어요.',
  },
]
