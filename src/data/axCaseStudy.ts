import type { CaseSection, ProjectDetailContent } from './caseStudy.ts'

// Portfolio draft: describes UX decisions, not measured AI accuracy or public-service outcomes.
export const axDetail: ProjectDetailContent = {
  presentation: 'editorial', summary: 'AI가 서류와 현장 사진을 분석해 필요한 솔루션을 제안하는 공공 서비스',
  metadata: [['TYPE', 'AI 기반 공공 서비스'], ['PERIOD', '2026.01 — 2026.06'], ['ROLE', 'UI/UX 디자인 · 인터랙션 · 프로토타이핑']],
  heroSlot: { label: '고용노동부 AX 대표 화면', layout: 'wide', panels: [
    { label: '서비스 시작', image: { src: new URL('../../img/projects/ax.png', import.meta.url).href, alt: '점검 서류 등록과 분석 시작을 안내하는 고용노동부 AX 서비스 화면', width: 7680, height: 4320 } },
    { label: '자료 입력', description: '분석할 서류·현장 사진을 등록하고 입력 자료를 확인하는 화면' },
    { label: 'AI 분석', description: '자료 분석의 진행 상태와 추가 확인이 필요한 내용을 안내하는 화면' },
    { label: '결과 / 제안', description: '분석 결과와 근거를 확인하고 추천 솔루션으로 이어지는 화면' },
  ] },
}

export const axCaseStudy: readonly CaseSection[] = [
  {
    layout: 'overview', title: 'Overview', tone: 'base',
    heading: 'AI의 분석을, 이해할 수 있는 안내로 바꿨어요.',
    body: '서류와 현장 사진에서 필요한 정보를 읽고 솔루션을 제안하는 서비스예요. 분석 결과를 보여주는 데서 끝나지 않고, 사용자가 이유를 이해하고 다음 행동으로 이어갈 수 있도록 경험을 정리했어요.',
  },
  {
    layout: 'narrative', title: 'The Problem', tone: 'focus', spacing: 'narrative',
    heading: '답이 있어도, 이유를 모르면 판단하기 어려워요.',
    body: 'AI가 만든 긴 답변만으로는 무엇이 중요한지, 어디까지 믿고 행동해도 되는지 알기 어려워요. 결과를 받아보는 사람의 질문을 먼저 정리했어요.',
    blocks: [{ kind: 'rows', items: [
      { title: '무엇을 보고 분석했나요?', body: '내가 올린 자료 중 어떤 정보가 결과에 반영됐는지 확인할 수 있어야 해요.' },
      { title: '확인이 더 필요한가요?', body: '읽지 못한 자료나 불확실한 정보가 결과와 구분돼야 해요.' },
      { title: '이제 무엇을 해야 하나요?', body: '분석 내용을 이해한 뒤 이어갈 수 있는 행동이 필요해요.' },
    ] }],
  },
  {
    layout: 'split', title: 'Input', tone: 'base',
    heading: '무엇을 준비해야 하는지부터 알려줘요.',
    body: 'OCR이나 이미지 분석이라는 기술 이름보다 어떤 서류와 사진이 필요한지를 먼저 안내해요. 업로드한 자료를 확인하고 부족한 부분을 다시 준비할 수 있도록 입력 과정을 나눴어요.',
    blocks: [{ kind: 'list', items: ['필요한 자료와 촬영할 내용을 먼저 확인해요.', '올린 자료가 맞는지 분석 전에 살펴봐요.', '자료가 부족하면 보완할 위치를 알려줘요.'] }],
    imageSlot: { label: '필요한 서류·현장 사진 안내와 업로드 후 자료를 확인하는 입력 화면', layout: 'split' },
  },
  {
    layout: 'hierarchy', title: 'AI Result', tone: 'elevated', spacing: 'narrative',
    heading: '결과, 근거, 행동의 순서로 읽게 했어요.',
    body: '분석 내용을 한 번에 읽도록 요구하지 않았어요. 핵심 결과를 파악하고, 근거를 확인한 뒤, 필요한 행동을 선택할 수 있도록 정보의 깊이를 나눴어요.',
    blocks: [{ kind: 'flows', items: [{ title: '결과를 이해하는 세 단계', steps: ['핵심 결과', '분석 근거', '다음 행동'] }] }],
    imageSlot: { label: '핵심 분석 결과와 그 근거, 다음 행동의 위계를 함께 보여주는 화면', layout: 'wide' },
  },
  {
    layout: 'comparison', title: 'Trust', tone: 'base',
    heading: '확인된 정보와, 확인할 정보를 구분해요.',
    body: 'AI의 제안을 확정된 답처럼 보이게 하지 않는 것이 중요했어요. 분석에 사용한 정보와 추가 확인이 필요한 조건을 구분해, 사용자가 결과를 해석할 여지를 남겼어요.',
    blocks: [{ kind: 'comparison', columns: [
      { title: '근거가 있는 내용', items: ['어떤 자료에서 읽었는지 함께 보여줘요.', '결과와 연결되는 핵심 정보를 가까이 둬요.', '추천 이유를 사용자가 이해할 말로 설명해요.'] },
      { title: '확인이 필요한 내용', items: ['자료가 부족한 부분을 따로 알려줘요.', '정보를 읽지 못한 상태를 실패와 구분해요.', '다시 올리거나 확인할 방법을 안내해요.'] },
    ] }],
  },
  {
    layout: 'split', title: 'Recommendation', tone: 'focus',
    heading: '분석 이후의 행동까지 연결했어요.',
    body: '솔루션 이름을 나열하기보다 왜 필요한지와 무엇을 확인해야 하는지 함께 보여줘요. 사용자가 지금 할 수 있는 중요한 행동 하나를 중심에 두고, 보조 정보는 다음 단계에서 읽도록 정리했어요.',
    imageSlot: { label: '추천 솔루션의 이유와 상세 확인·다음 행동이 연결된 화면', layout: 'split' },
  },
  {
    layout: 'decisions', title: 'Key Decisions', tone: 'elevated',
    heading: 'AI의 확신보다, 사용자의 이해를 먼저 봤어요.',
    blocks: [{ kind: 'compact-decisions', items: [
      { title: '근거를 가까이에', body: '답변만 강조하지 않고, 그렇게 분석한 이유를 같은 맥락에서 확인하게 했어요.' },
      { title: '중요한 행동 하나', body: '여러 선택지가 경쟁하지 않게 현재 필요한 다음 행동을 먼저 보여줘요.' },
      { title: '불확실함도 정보로', body: '예외와 추가 확인 상태를 명확히 구분해 잘못된 확신을 줄여요.' },
    ] }],
  },
  {
    layout: 'product', title: 'Prototype & Validation', tone: 'focus', spacing: 'image',
    heading: '답이 나오는 순간 외의 경험도 살폈어요.',
    body: '분석 결과를 가정한 여러 상태를 프로토타입으로 비교했어요. 분석 중, 자료 부족, 결과 확인처럼 상황이 달라져도 사용자가 현재 상태와 다음 행동을 알 수 있는지 확인했어요.',
    imageSlot: { label: 'AI 분석 중·자료 보완 필요·결과 확인 상태를 비교한 프로토타입 화면', layout: 'wide' },
  },
  {
    layout: 'reflection', title: 'What I Learned', tone: 'base', spacing: 'narrative', reflectionSummary: true,
    heading: '이해하고 행동할 수 있어야, 결과가 경험이 돼요.',
    blocks: [{ kind: 'rows', items: [
      { title: '01', body: 'AI의 답을 보여주는 것과 사용자가 이해하도록 돕는 것은 달랐어요.' },
      { title: '02', body: '확인할 수 없는 부분을 명확히 드러내는 것도 신뢰를 설계하는 일이었어요.' },
      { title: '03', body: '분석 이후의 행동까지 이어져야 서비스의 흐름이 완성됐어요.' },
    ] }],
    process: ['결과를 읽고', '근거를 확인하고', '다음 행동으로 가요'],
    closing: 'AI가 만든 결과를, 사용자가 판단할 수 있는 경험으로 정리했어요.',
  },
]
