import type { CaseSection, ProjectDetailContent } from './caseStudy.ts'

// Editorial draft based on the project brief; responsibilities use existing repo metadata.
export const edkDetail: ProjectDetailContent = {
  presentation: 'editorial', summary: '기업의 ESG 지표를 종합적으로 관리하는 B2B 플랫폼',
  metadata: [['TYPE', '기업 ESG 관리 플랫폼'], ['PERIOD', '2024.12 — 2025.12'], ['ROLE', 'UI/UX 디자인 · 디자인 시스템 구축'], ['SCOPE', '지표 관리 · 권한 UX · 화면 일관성']],
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
    body: '기업의 ESG 지표는 조직과 기간, 담당자에 따라 확인해야 할 내용이 달라요. 개별 화면의 모양보다 정보를 찾고 입력하고 확인하는 공통 규칙을 만드는 데 집중했어요.',
  },
  {
    layout: 'narrative', title: 'The Problem', tone: 'focus',
    heading: '같은 데이터여도, 해야 할 일은 달랐어요.',
    body: '담당자는 입력할 지표를 찾아야 하고, 검토자는 확인할 상태를 알아야 해요. 데이터의 양뿐 아니라 서로 다른 업무 목적을 한 구조 안에서 다루는 것이 과제였어요.',
    blocks: [{ kind: 'rows', items: [
      { title: '찾아야 하는 정보', body: '조직·기간·지표가 겹치면 필요한 항목을 찾기 위해 여러 조건을 다시 확인해야 해요.' },
      { title: '할 수 있는 행동', body: '같은 항목이라도 역할에 따라 열람·수정·승인 가능한 범위가 달라요.' },
      { title: '반복되는 화면', body: '목록과 입력 화면마다 규칙이 다르면 같은 업무를 할 때도 사용법을 다시 익혀야 해요.' },
    ] }],
  },
  {
    layout: 'hierarchy', title: 'Structure', tone: 'elevated', spacing: 'narrative',
    heading: '화면보다 먼저, 정보의 연결 기준을 정했어요.',
    body: '조직과 기간으로 대상 범위를 정하고, 그 안에서 지표·상태·담당자를 읽도록 구조화했어요. 같은 기준으로 목록을 좁힐 수 있어야 상세 화면에서도 맥락이 이어져요.',
    blocks: [{ kind: 'flows', items: [{ title: '관리할 대상을 찾는 기준', steps: ['조직', '기간', '지표', '상태', '담당자'] }] }],
    imageSlot: { label: '조직·기간·상태 필터와 ESG 지표 목록의 연결 구조', layout: 'wide' },
  },
  {
    layout: 'comparison', title: 'Permissions', tone: 'base',
    heading: '역할의 차이를, 가능한 행동으로 보여줘요.',
    body: '권한을 별도의 설정 문제로만 보지 않았어요. 사용자가 지금 무엇을 할 수 있는지, 할 수 없다면 어떤 조건이 필요한지 화면 안에서 알 수 있게 정리했어요.',
    blocks: [{ kind: 'comparison', columns: [
      { title: '입력하는 사람', items: ['내가 맡은 지표와 작성 상태를 확인해요.', '수정 가능한 항목을 구분해요.', '제출 전에 필요한 입력을 확인해요.'] },
      { title: '확인하는 사람', items: ['검토할 항목과 담당자를 확인해요.', '입력값과 근거를 함께 살펴봐요.', '승인하거나 수정 요청할 다음 행동을 알아요.'] },
    ] }],
    imageSlot: { label: '동일한 지표를 입력 담당자와 검토자 권한으로 각각 본 화면', layout: 'split', panels: [{ label: '입력 담당자의 수정·제출 가능 범위' }, { label: '검토자의 확인·승인 가능 범위' }] },
  },
  {
    layout: 'split', title: 'Information Priority', tone: 'focus',
    heading: '많이 보여줘도, 읽는 순서는 분명하게 했어요.',
    body: '목록에서는 이름과 현재 상태를 먼저 읽고, 상세 값은 필요한 순간에 확인하도록 정리했어요. 필터는 찾는 범위를, 테이블은 항목 간 차이를 알려주는 역할로 나눴어요.',
    imageSlot: { label: '지표 이름·상태·담당자 위계를 정리한 테이블과 상세 정보 화면', layout: 'split' },
  },
  {
    layout: 'narrative', title: 'Design System', tone: 'elevated', spacing: 'narrative',
    heading: '반복되는 업무에는 같은 화면 문법을 썼어요.',
    body: '컴포넌트의 외형만 맞추기보다 사용자가 같은 상황에서 같은 행동을 예상할 수 있도록 했어요. 목록, 입력, 상태, 행동을 하나의 규칙으로 연결했어요.',
    blocks: [{ kind: 'rows', items: [
      { title: '목록과 필터', body: '조건을 고르고 해제하는 위치, 결과가 없는 경우의 안내를 일관되게 정리했어요.' },
      { title: '상태와 행동', body: '같은 상태에는 같은 용어를 쓰고, 그 상태에서 가능한 행동을 가까이 배치했어요.' },
      { title: '입력과 확인', body: '필수 입력, 오류 안내, 저장 전 확인을 반복해서 익힐 수 있는 패턴으로 만들었어요.' },
    ] }],
    imageSlot: { label: '테이블·필터·상태·버튼·폼의 반복 규칙을 정리한 디자인 시스템 화면', layout: 'wide' },
  },
  {
    layout: 'decisions', title: 'Key Decisions', tone: 'base',
    heading: '정보의 양보다, 처리할 순서를 먼저 봤어요.',
    blocks: [{ kind: 'compact-decisions', items: [
      { title: '상태를 먼저', body: '어떤 항목을 확인해야 하는지 현재 상태를 통해 빠르게 찾도록 했어요.' },
      { title: '같은 일은 같은 패턴으로', body: '화면이 바뀌어도 필터·입력·저장 방식을 다시 배우지 않게 했어요.' },
      { title: '권한 차이는 명확하게', body: '할 수 없는 행동은 가능한 행동과 구분하고, 필요한 조건을 함께 안내해요.' },
    ] }],
  },
  {
    layout: 'comparison', title: 'Consistency', tone: 'focus',
    heading: '한 화면의 수정이 다른 화면에서도 이어져야 해요.',
    body: '여러 화면에 반복되는 용어와 상태, 컴포넌트가 같은 의미로 쓰이는지 살폈어요. 정상 화면뿐 아니라 입력 오류와 권한 제한 상황도 같은 기준으로 확인해요.',
    blocks: [{ kind: 'comparison', columns: [
      { title: '정보를 확인해요.', items: ['같은 지표에 같은 이름을 사용해요.', '기간과 상태의 기준이 이어져요.', '목록과 상세의 정보가 일치해요.'] },
      { title: '동작을 확인해요.', items: ['역할에 맞는 행동만 가능해요.', '입력 오류에서 다시 진행할 수 있어요.', '저장과 제출 후 상태를 알 수 있어요.'] },
    ] }],
  },
  {
    layout: 'reflection', title: 'What I Learned', tone: 'base', spacing: 'narrative', reflectionSummary: true,
    heading: '일관성은, 업무를 이해하는 시간을 줄여줘요.',
    blocks: [{ kind: 'rows', items: [
      { title: '01', body: '데이터와 권한의 관계를 정해야 화면의 구조도 명확해졌어요.' },
      { title: '02', body: '디자인 시스템은 같은 일을 같은 방식으로 처리하게 하는 약속이었어요.' },
      { title: '03', body: '예외 상태까지 일관되게 다뤄야 제품을 예측할 수 있었어요.' },
    ] }],
    process: ['정보를 연결하고', '권한을 구분하고', '같은 규칙을 써요'],
    closing: '관리하기 쉬운 제품은, 정보와 행동의 관계가 분명한 제품이었어요.',
  },
]
