import type { CaseSection, ProjectDetailContent } from './caseStudy.ts'

export const deurimDetail: ProjectDetailContent = {
  presentation: 'editorial',
  keywords: [],
  liveUrl: 'https://deurim.co.kr/',
  liveLabel: '서비스 보러가기',
  summary: '구매 전에 우리 집에 냉장고를 설치할 수 있는지,\n3D로 확인하는 웹 서비스예요.',
  metadata: [
    ['Type', 'Solo Product Experiment'],
    ['Period', '2026.09 · 3 Weeks'],
    ['Role', 'Product Design · AI-assisted Build'],
  ],
  heroSlot: {
    label: '들임 대표 화면',
    layout: 'wide',
    panels: [
      { label: '제품 선택', image: {
        src: new URL('../../img/projects/deurim/overview_01.png', import.meta.url).href,
        alt: '들임 냉장고 제품 선택 화면', width: 1919, height: 1079,
      } },
      { label: '공간 설정', image: {
        src: new URL('../../img/projects/deurim/overview_02.png', import.meta.url).href,
        alt: '들임에서 제품을 선택한 뒤 설치 공간의 너비·높이·깊이를 입력하는 화면', width: 1919, height: 1079,
      } },
      { label: '시작 가이드', image: {
        src: new URL('../../img/projects/deurim/overview_03.png', import.meta.url).href,
        alt: '들임 첫 진입 시 설치 가능 여부를 확인하는 방법을 안내하는 시작 가이드 화면', width: 1919, height: 1079,
      } },
      { label: '설치 결과', image: {
        src: new URL('../../img/projects/deurim/overview_04.png', import.meta.url).href,
        alt: '들임 3D 설치 확인과 공식 기준에 따른 확인 필요 항목을 함께 보여주는 결과 화면', width: 1919, height: 1079,
      } },
      { label: '모바일 시안', image: {
        src: new URL('../../img/projects/deurim/overview_05.png', import.meta.url).href,
        alt: '들임 제품 선택, 공간 입력, 3D 확인, 설치 결과를 담은 모바일 화면 시안', width: 1118, height: 629,
      } },
    ],
  },
}

export const deurimCaseStudy: readonly CaseSection[] = [
  {
    layout: 'overview', title: 'Overview', tone: 'base', spacing: 'image',
    heading: '디자이너 혼자,\n제품까지 만들 수 있을까요?',
    body: 'AI와 함께라면 기획부터 구현까지 어디까지 할 수 있을지 궁금했어요.\n3주 동안 기획, UX/UI, 3D 방향, 구현과 검증을 맡아 냉장고를 고르고 설치 가능 여부를 확인하는 경험을 만들었어요.',
  },
  {
    layout: 'statement', title: 'The Problem', tone: 'focus', spacing: 'narrative',
    heading: '치수로 상상하던 공간을,\n직접 확인할 수 있게 했어요.',
    body: '제품 치수는 나와 있지만, 우리 집과 비교하는 건 사용자 몫이었어요. 폭이 맞는지만으로는 부족했어요. 설치 여유, 주변 벽과 가구, 문을 열 공간까지 함께 살펴야 했어요.',
  },
  {
    layout: 'structure', title: 'Structure', tone: 'base', spacing: 'standard',
    lead: { kind: 'flows', items: [{ title: '사용자가 따라가는 네 단계', steps: ['제품 선택', '공간 입력', '3D 확인', '설치 결과'] }] },
    heading: '선택에서 판단까지 연결했어요.',
    body: '제품 정보와 사용자가 입력한 공간을 함께 살펴보며, 설치 조건을 확인하는 흐름으로 정리했어요.',
  },
  {
    layout: 'visual-measure', title: 'Visual Measure', tone: 'elevated', spacing: 'standard',
    heading: '공간을 조절하면서,\n설치 기준도 함께 확인할 수 있게 했어요.',
    body: '숫자 입력만으로는 공간 크기를 직관적으로 파악하기 어려울 수 있다고 판단했어요.\n그래서 슬라이더를 자 형태로 디자인하고, 제품 크기와 설치에 필요한 최소 기준을 같은 축에 표시했어요. 빨간 기준선을 활용해 현재 공간의 부족한 정도와 여유 공간을 시각적으로 비교할 수 있도록 설계했어요.',
    imageSlot: { label: '자 눈금 위에 설치 공간 너비와 제품 너비를 함께 보여주는 슬라이더', layout: 'wide', image: {
      src: new URL('../../img/projects/deurim/interaction_01.png', import.meta.url).href,
      alt: '자 눈금 위에 설치 공간 너비 150cm와 제품 너비 91.2cm를 함께 보여주는 슬라이더',
      width: 612,
      height: 270,
    } },
  },
  {
    layout: 'trust', title: 'Validation', tone: 'focus', spacing: 'narrative',
    heading: '설치 가능 여부뿐 아니라,\n그 판단의 근거까지 보여줬어요.',
    body: '설치 가능 여부만 제공하면 결과의 근거가 충분히 전달되지 않을 수 있다고 판단했어요.\n그래서 어느 위치에 공간이 부족한지, 얼마나 더 필요한지를 함께 표시했어요. 이를 통해 사용자가 설치 조건을 확인하고 다음 행동을 판단할 수 있도록 설계했어요.',
    imageSlot: { label: '설치 결과에서 확인이 필요한 공간 여유를 보여주는 화면', layout: 'split', image: {
      src: new URL('../../img/projects/deurim/trust_01.png', import.meta.url).href,
      alt: '들임 설치 결과에서 좌우 문 여유 공간이 각각 0.1cm 부족하다고 표시한 화면',
      width: 348,
      height: 354,
    } },
  },
  {
    layout: 'workflow', title: 'Working with AI', tone: 'elevated', spacing: 'standard',
    heading: '기다리는 시간을 줄였어요.',
    body: '전달하고 기다리던 흐름에서, 동작하는 화면을 직접 써보고 판단하는 흐름으로 바꿨어요.',
    blocks: [
      { kind: 'flows', items: [
        { title: 'BEFORE', steps: ['생각 정리', 'Figma 설계', '개발 전달', '구현 대기', '결과 확인', '수정 요청'] },
        { title: 'WITH AI', steps: ['문제 정의', '프로토타입 구현', '직접 사용', '판단', '수정', '검증'] },
      ] },
    ],
  },
  {
    layout: 'directing-ai', title: 'Directing AI', tone: 'base', spacing: 'standard',
    heading: 'AI에게 바로 작업을 맡기지 않았어요.\n먼저 판단 기준을 설계하고, 실행 가능한 지시로 바꿨어요.',
    body: '프롬프트를 길게 쓰는 게 아니라, 작업의 목표·범위·기준을 먼저 설계했어요.\n그 구조를 메타 프롬프트로 정리해 Claude와 Codex에 실제 작업 지시로 전달했어요.',
    blocks: [{ kind: 'prompt-document', request: 'Claude / Codex 작업 요청 예시',
      workflow: ['내가 먼저 판단한 것', 'Meta Prompt로 구조화', 'Claude / Codex에 전달', '실제 결과 확인 후 다시 수정'],
      sections: [
        { title: '목표', paragraphs: ['제품 정보를 확인한 뒤 바로 제품을 변경할 수 있다는 걸 더 쉽게 인지할 수 있게 개선해줘.'] },
        { title: '이번 작업 범위', items: ['제품 정보 영역의 hover interaction 개선', '“제품 변경” 액션의 위치와 인지성 개선', '기존 디자인 톤은 그대로 유지'] },
        { title: '유지해야 할 것', items: ['현재 3D Viewer 크기와 위치', '공간 조절 구조', '결과 보기 CTA', '기존 제품 데이터와 동작 방식', '모바일에서 이미 확정된 구조'] },
        { title: '변경하지 말 것', items: ['요청하지 않은 다른 UI', '전체 페이지 레이아웃', '이미 확정된 문구', '관련 없는 기능이나 구조'] },
        { title: 'Visual 기준', paragraphs: ['첨부한 화면을 최종 기준으로 사용해줘. 새로운 스타일을 추가하기보다 현재 UI 안에서 간격, 정렬, 위계를 개선해줘.'] },
        { title: '검증', paragraphs: ['작업 후 아래 기준을 확인해줘.'], items: ['데스크톱과 모바일 모두 확인', '기존 기능이 그대로 동작하는지 확인', '요청한 영역 외에 불필요한 변경이 없는지 확인'] },
        { title: '작업 방식', paragraphs: ['먼저 현재 구조를 확인한 뒤 수정하고, 필요 이상의 리팩터링은 하지 말아줘.'] },
      ], notes: [
        { title: '기준을 먼저 정했어요.', body: 'AI가 무엇을 만들지보다, 어떤 경험을 지켜야 하는지 먼저 정했어요.' },
        { title: '범위를 명확하게 줬어요.', body: '빠르게 작업하더라도 요청하지 않은 부분까지 바뀌지 않게 했어요.' },
        { title: '결과를 다시 판단했어요.', body: 'AI가 만든 결과를 그대로 쓰지 않고 실제 화면에서 다시 확인했어요.' },
      ], closing: 'AI가 실행을 맡을수록,\n디자이너의 기준은 더 명확해야 했어요.' }],
  },
  {
    layout: 'comparison', title: 'AI vs. Me', tone: 'elevated', spacing: 'standard',
    heading: '실행을 나누고, 판단은 직접 했어요.',
    body: 'AI의 제안은 비교할 대안으로 봤어요. 무엇을 만들고 어디까지 믿을지는 직접 결정했어요.',
    blocks: [{ kind: 'comparison', columns: [
      { title: 'AI', items: ['반복 구현', '대안 탐색', '상태 비교', 'QA'] },
      { title: 'ME', items: ['문제 정의', '정보 우선순위', '신뢰 기준', 'Interaction 판단', '최종 Visual 판단'] },
    ] }],
  },
  {
    layout: 'decisions', title: 'Key Decisions', tone: 'base', spacing: 'standard',
    heading: '다음 행동을 분명하게 했어요.',
    body: '선택지를 늘리기보다, 세 가지 기준으로 화면을 정리했어요.',
    blocks: [{ kind: 'compact-decisions', items: [
      { title: '조작과 결과 분리', body: '메인은 공간 조작에 집중하고, 판단의 근거는 “결과 보기”에서 확인하게 했어요.' },
      { title: '모바일은 3D 먼저', body: '3D를 중심에 두고 상세 정보는 필요할 때 열게 했어요. 결과 버튼은 하단에 뒀어요.' },
      { title: '강조는 필요한 곳에', body: '주요 행동과 선택·활성 상태에만 강조색을 남겼어요.' },
    ] }],
    imageSlot: { label: '모바일에서 보는 공간과 설치 결과', panels: [
      { label: '모바일에서 3D 공간과 빠른 조작 버튼이 함께 보이는 화면' },
      { label: '같은 제품의 상세 정보를 연 모바일 패널과 결과 보기 버튼' },
    ], layout: 'mobile-pair' },
  },
  {
    layout: 'product', title: 'Building the Product', tone: 'focus', spacing: 'image',
    heading: '직접 써보며 다듬었어요.',
    body: '브라우저에서 화면 크기, 상태 유지, 터치와 키보드 이동을 확인했어요. 설계할 때 보이지 않던 불편함을 찾고, 수정한 뒤 연결된 흐름도 다시 살폈어요.',
    imageSlot: { label: '좌측 공간 설정 · 중앙 3D · 우측 설치 결과가 함께 보이는 핵심 화면', layout: 'wide' },
  },
  {
    layout: 'outcome', title: 'Outcome', tone: 'base', spacing: 'standard',
    heading: '3주 동안 혼자,\n하나의 제품 흐름을 완성했어요.',
    body: '제품 선택부터 공간 입력, 3D 비교, 설치 판정까지 연결했어요. 사용자·비즈니스 성과는 아직 측정하지 않았어요.',
  },
  {
    layout: 'reflection', title: 'What I Learned', tone: 'focus', spacing: 'narrative',
    heading: 'AI는 제 판단을 대신하지 않았어요.\n제 판단을 제품으로 옮겼어요.',
    body: '혼자 제품을 만들며, 직접 판단해야 할 일도 더 선명해졌어요.',
    externalLink: {
      url: 'https://event.wanted.co.kr/ai-championship/2026/projects/718',
      label: '해커톤 제출작 보기',
      accessibleName: '들임 Wanted AI Championship 제출 페이지 새 창에서 열기',
      context: '완성한 서비스는 Wanted AI Championship에 출품했고, 투표 순위 73위를 기록했어요.',
    },
    blocks: [
      { kind: 'rows', items: [
        { title: '01', body: '좋은 화면을 그리는 것과 제품 경험을 완성하는 건 달랐어요.' },
        { title: '02', body: 'AI에게 더 많이 맡길수록 제 판단 기준은 더 분명해야 했어요.' },
        { title: '03', body: 'AI로 아낀 시간은 더 다양한 사용 상황을 확인하는 데 썼어요.' },
      ] },
    ],
  },
]
