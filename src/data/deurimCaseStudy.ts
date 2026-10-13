import type { CaseSection, ProjectDetailContent } from './caseStudy.ts'

export const deurimDetail: ProjectDetailContent = {
  presentation: 'editorial',
  liveUrl: 'https://deurim.co.kr/',
  liveLabel: '서비스 보러가기',
  summary: '구매 전에 우리 집에 냉장고를 설치할 수 있는지, 3D로 확인하는 웹 서비스예요.',
  metadata: [
    ['Type', '웹 서비스'],
    ['Period', '2026.09 — 3주'],
    ['Role', '기획 · UX/UI · AI 활용 구현'],
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
    body: '기획과 디자인의 판단을 실제 제품까지 직접 연결하고 싶었어요.\nAI를 활용해 UX/UI와 3D 경험을 설계하고, 냉장고 선택부터 설치 판단까지 하나의 서비스로 구현했어요.',
  },
  {
    layout: 'statement', title: 'The Problem', tone: 'focus', spacing: 'narrative',
    heading: '치수로 상상하던 공간을, 직접 확인할 수 있게 했어요.',
    blocks: [{ kind: 'problems', items: [
      { title: '치수만으로는 공간을 상상하기 어려웠어요.', body: '제품의 너비·높이·깊이는 알 수 있지만, 우리 집 공간과 실제로 비교하는 건 사용자 몫이었어요.' },
      { title: '들어가는 것만으로는 충분하지 않았어요.', body: '냉장고가 공간에 들어가더라도 좌우 여유 공간과 주변 벽까지 함께 확인해야 했어요.' },
      { title: '문이 열리는 공간까지 봐야 했어요.', body: '제품을 설치할 수 있어도 벽이나 가구 때문에 문을 충분히 열지 못할 수 있었어요.' },
    ] }],
  },
  {
    layout: 'structure', title: 'Structure', tone: 'base', spacing: 'standard',
    lead: { kind: 'flows', items: [{ title: '사용자가 따라가는 네 단계', steps: ['제품 선택', '공간 입력', '3D 확인', '설치 결과'] }] },
    heading: '선택에서 판단까지 연결했어요.',
    body: '제품 정보와 사용자가 입력한 공간을 함께 살펴보며, 설치 조건을 확인하는 흐름으로 정리했어요.',
  },
  {
    layout: 'visual-measure', title: 'Visual Measure', tone: 'elevated', spacing: 'standard',
    heading: '공간을 조절하면서,\n제품 크기도 바로 비교할 수 있게 했어요.',
    body: '숫자만으로는 공간 크기를 가늠하기 어려웠어요.\n슬라이더를 자처럼 만들고, 현재 공간과 제품 너비를 같은 축에 보여줬어요.\n파란 선은 공간, 빨간 선은 제품 너비를 보여줘요.',
    supporting: '공간 크기를 직관적으로 보여주기 위해 여러 표현 방식을 AI로 빠르게 구현해 비교했어요. 직접 조작해보며 이해하기 쉬운 방식을 골랐고, 현재 공간과 제품 너비를 같은 축에서 읽도록 정리했어요.',
  },
  {
    layout: 'trust', title: 'Validation', tone: 'focus', spacing: 'narrative',
    heading: '설치가 어렵다는 결과보다,\n왜 어려운지를 먼저 보여줬어요.',
    body: '실제 화면에서 빠르게 다듬어, 단순 실패 표시 대신 부족한 위치와 필요 수치를 보여줬어요. 문제를 누르면 3D 시점이 해당 위치로 이동해요.',
  },
  {
    layout: 'workflow', title: 'AI Workflow', tone: 'elevated', spacing: 'standard',
    heading: '반복은 AI와 나누고, 판단은 직접 했어요.',
    body: 'AI가 구현과 검증의 반복을 줄여준 덕분에, 저는 더 나은 방향을 비교하고 판단하는 데 집중할 수 있었어요.',
    blocks: [{ kind: 'execution-judgment', items: [
      { title: '빠르게 구현', judgmentTitle: '직접 써보고 판단', execution: '여러 UI 안을 실제 동작하는 화면으로 만들었어요.', judgment: '직접 사용해보고 어떤 방식이 더 이해하기 쉬운지 선택했어요.' },
      { title: '여러 안 비교', judgmentTitle: '더 명확한 방향 선택', execution: '레이아웃과 인터랙션의 여러 대안을 빠르게 만들어 비교할 수 있게 했어요.', judgment: '정보의 우선순위와 다음 행동이 가장 명확한 안을 결정했어요.' },
      { title: '상태 확인', judgmentTitle: '제품이 책임질 범위 설정', execution: '화면 크기와 다양한 상태를 반복해서 확인했어요.', judgment: '어떤 상태까지 제품에서 책임져야 하는지 기준을 정했어요.' },
      { title: '수정과 검증', judgmentTitle: '처음 의도와 다시 비교', execution: '수정 내용을 빠르게 반영하고 연결된 화면까지 다시 확인했어요.', judgment: '결과가 처음 의도한 경험과 맞는지 보고 다시 수정했어요.' },
    ] }],
  },
  {
    layout: 'directing-ai', title: 'Prompt Design', tone: 'base', spacing: 'standard',
    heading: 'AI에게 바로 작업을 맡기지 않았어요.\n먼저 판단 기준을 설계하고, 실행 가능한 지시로 바꿨어요.',
    blocks: [{ kind: 'prompt-document', request: 'Claude / Codex에 전달한 Meta Prompt', workflow: ['판단', '구조화', 'Claude / Codex 전달', '결과 확인'],
      sections: [
        { title: '목표', paragraphs: ['사용자가 더 쉽게 이해하거나 실행할 수 있게 개선해줘.'] },
        { title: '바꿀 범위', paragraphs: ['지정한 영역과 동작 안에서만 수정해줘.'] },
        { title: '유지할 것', paragraphs: ['기존 구조와 확정된 동작은 유지해줘.'] },
        { title: '변경하지 말 것', paragraphs: ['요청하지 않은 UI와 문구는 건드리지 마.'] },
        { title: '화면 기준', paragraphs: ['첨부 화면을 기준으로 간격·정렬·위계를 맞춰줘.'] },
        { title: '확인할 것', paragraphs: ['데스크톱·모바일 동작과 요청 외 변경 여부를 확인해줘.'] },
      ] }, { kind: 'supporting', text: 'Git 저장소를 AI와 연결해 현재 구현 상태를 이해시키고, 그 맥락으로 수정 프롬프트를 만들어 Claude와 Codex 작업에 활용했어요. 변경 규모가 큰 작업은 Git 상태와 체크포인트, 커밋·푸시 기준까지 프롬프트에 포함해 안전하게 진행하도록 했어요.' }],
  },
  {
    layout: 'decisions', title: 'Key Decisions', tone: 'elevated', spacing: 'standard',
    heading: '다음 행동을 분명하게 했어요.',
    body: '선택지를 늘리기보다, 세 가지 기준으로 화면을 정리했어요.',
    blocks: [{ kind: 'compact-decisions', items: [
      { title: '조작과 결과 분리', body: '메인은 공간 조작에 집중하고, 판단의 근거는 “결과 보기”에서 확인하게 했어요.' },
      { title: '모바일은 3D 먼저', body: '3D를 중심에 두고 상세 정보는 필요할 때 열게 했어요.\n결과 버튼은 하단에 뒀어요.' },
      { title: '강조는 필요한 곳에', body: '주요 행동과 선택·활성 상태에만 강조색을 남겼어요.' },
    ] }],
    imageSlot: { label: '모바일 시안 비교', panels: [
      { label: '모바일에서는 3D를 먼저 보여주고, 조작은 가까이에 뒀어요.', description: '좁은 화면에서도 공간 확인이 먼저 보이도록 3D 영역을 중심에 두고, 필요한 조작만 가까이에 배치했어요.', image: {
        src: new URL('../../img/projects/deurim/key_01.png', import.meta.url).href,
        alt: '3D 공간을 중심에 두고 조작과 결과 보기 버튼을 배치한 들임 모바일 화면', width: 490, height: 1064,
      } },
      { label: '모바일에서는 상세 결과를 별도 화면으로 분리했어요.', description: '3D 조작 화면과 설치 결과를 분리해, 부족한 위치와 필요한 수치를 작은 화면에서도 명확하게 확인할 수 있게 했어요.', image: {
        src: new URL('../../img/projects/deurim/key_02.png', import.meta.url).href,
        alt: '조작 화면에서 분리된 결과 패널에 부족한 공간과 공식 기준을 보여주는 들임 모바일 화면', width: 490, height: 1064,
      } },
    ], layout: 'decision-visual' },
  },
  {
    layout: 'product', title: 'Build', tone: 'focus', spacing: 'image',
    heading: '직접 써보며 다듬었어요.',
    body: '동작하는 화면을 실제 브라우저에서 직접 확인했어요.\n화면 크기와 상태, 터치처럼 Figma에서 놓치기 쉬운 문제를 찾아 다시 수정했어요.',
    supporting: '상태·반응형·인터랙션 조건을 묶어 Coding Agent에 구현을 맡기고, 실제 브라우저에서 직접 확인했어요. 화면 크기나 터치, 예외 상태에서 발견한 문제는 맥락과 함께 다시 전달해 수정하며 구현과 검증을 반복했어요.',
    imageSlot: { label: '같은 기능을 Desktop · Tablet · Mobile 화면 크기에서 구현하고 직접 검증한 화면', layout: 'wide', image: {
      src: new URL('../../img/projects/deurim/building_01.png', import.meta.url).href,
      alt: '들임 서비스를 여러 화면 크기에서 구현하고 검증한 화면', width: 1774, height: 887,
    } },
  },
  {
    layout: 'reflection', title: '핵심 시사점', tone: 'base', spacing: 'narrative',
    reflectionSummary: true,
    heading: 'AI는 제 판단을 대신하지 않았어요.\n제 판단을 제품으로 옮겼어요.',
    body: '혼자 제품을 만들며, 직접 판단해야 할 일도 더 선명해졌어요.',
    process: ['기준을 정하고', '빠르게 만들고', '직접 확인하고', '다시 수정해요'],
    closing: '이 과정이 제 AI 활용 방식으로 자리 잡았어요.',
    externalLink: {
      url: 'https://event.wanted.co.kr/ai-championship/2026/projects/718',
      label: '해커톤 제출작 보기',
      accessibleName: '들임 Wanted AI Championship 제출 페이지 새 창에서 열기',
      title: 'Wanted AI Championship',
      context: '완성한 들임을 실제 해커톤에 출품했어요.',
      metaLabel: '투표 순위',
      metaValue: '73위',
    },
    blocks: [
      { kind: 'rows', items: [
        { title: '01', body: '화면을 그리는 것과 실제 제품 경험을 완성하는 건 달랐어요.' },
        { title: '02', body: 'AI에게 더 많이 맡길수록, 제가 정해야 할 기준은 더 명확해야 했어요.' },
        { title: '03', body: '빠르게 만든 만큼 더 다양한 사용 상황을 직접 확인할 수 있었어요.' },
      ] },
    ],
  },
]
