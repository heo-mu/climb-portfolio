import type { CaseSection, ProjectDetailContent } from './caseStudy.ts'

// Editorial draft based on the project brief; no unverified outcome metrics.
export const beesDetail: ProjectDetailContent = {
  presentation: 'editorial',
  summary: '건물 · 층 · 설비의 에너지 데이터를 공간 단위로 읽고 관리하는 플랫폼',
  metadata: [['TYPE', '에너지 관리 플랫폼'], ['PERIOD', '2025.12 — 2026.07'], ['ROLE', 'UI/UX 디자인 · UX 리서치 · 서비스 설계 · 디자인 시스템 구축']],
  heroSlot: { label: '삼성 BEES 대표 화면', layout: 'wide', panels: [
    { label: '전체 현황', image: { src: new URL('../../img/projects/bees.png', import.meta.url).href, alt: '건물 전경과 에너지 운영 지표를 함께 보여주는 삼성 BEES 전체 현황', width: 7680, height: 4320 } },
    { label: '공간 탐색', description: '건물에서 층과 공간을 선택하며 해당 위치의 데이터를 탐색하는 화면' },
    { label: '설비 상세', description: '선택한 설비의 위치와 상세 상태·에너지 데이터를 함께 보여주는 화면' },
    { label: '에너지 분석', description: '선택한 공간의 에너지 사용 추이와 기간별 비교를 보여주는 화면' },
  ] },
}

export const beesCaseStudy: readonly CaseSection[] = [
  {
    layout: 'overview', title: 'Overview', tone: 'base',
    heading: '숫자가 가리키는 공간을 함께 봐요.',
    body: '에너지 데이터는 수치만으로 읽기보다 어느 건물과 설비의 정보인지 함께 볼 때 맥락이 생겨요. 건물에서 설비까지 내려가는 공간 구조를 중심으로, 데이터를 확인하고 관리하는 경험을 정리했어요.',
  },
  {
    layout: 'hierarchy', title: 'Spatial Structure', tone: 'elevated', spacing: 'narrative',
    heading: '먼저, 공간과 데이터의 관계를 연결했어요.',
    body: '건물·층·설비가 따로 읽히면 어떤 위치의 수치를 보고 있는지 놓치기 쉬워요. 화면을 나누기 전에 공간의 계층과 정보가 연결되는 순서를 먼저 정했어요.',
    blocks: [{ kind: 'flows', items: [{ title: '전체에서 구체적인 대상으로', steps: ['건물', '층', '공간', '설비', '데이터'] }] }, { kind: 'rows', items: [
      { title: '위치의 맥락', body: '설비 상세로 들어가도 어느 건물과 층에 속하는지 알 수 있도록 상위 공간을 함께 보여줘요.' },
      { title: '선택의 맥락', body: '공간을 바꿨을 때는 그 위치의 데이터로 함께 전환하고, 이전 설비의 정보와 섞이지 않게 해요.' },
    ] }],
    imageSlot: { label: '건물에서 층과 공간을 선택하며 데이터 범위가 바뀌는 화면', layout: 'wide' },
  },
  {
    layout: 'statement', title: 'The Problem', tone: 'base',
    heading: '정보는 많아도, 위치는 다시 찾아야 했어요.',
    blocks: [{ kind: 'problems', items: [
      { title: '공간과 수치가 떨어져 있어요.', body: '차트에서 발견한 변화가 어느 공간의 문제인지 다시 연결해서 읽어야 해요.' },
      { title: '범위가 바뀌면 의미도 달라져요.', body: '건물 전체 수치와 개별 설비의 수치를 같은 수준으로 보면 판단이 어려워요.' },
      { title: '선택한 대상을 놓치기 쉬워요.', body: '3D와 정보 패널이 서로 다른 대상을 보여주면 확인 과정이 끊겨요.' },
    ] }],
  },
  {
    layout: 'split', title: 'Spatial Data', tone: 'focus', spacing: 'narrative',
    heading: '수치 옆에, 실제 위치를 뒀어요.',
    body: '공간에서 설비를 선택하고 그 대상의 정보를 읽도록 연결했어요. 3D는 건물을 감상하는 화면보다, 데이터가 어디에 속하는지 이해하는 길잡이로 사용했어요.',
    blocks: [{ kind: 'rows', items: [
      { title: '공간에서 선택해요.', body: '설비의 위치와 주변 맥락을 먼저 확인해요.' },
      { title: '같은 대상의 정보를 읽어요.', body: '선택한 설비 이름과 데이터 범위를 패널에서도 확인해요.' },
    ] }],
    imageSlot: { label: '선택한 설비의 위치와 상세 에너지 데이터가 연결된 화면', layout: 'split' },
  },
  {
    layout: 'comparison', title: 'Information Priority', tone: 'base',
    heading: '지금 보고 있는 범위에 맞춰 정보를 나눴어요.',
    body: '전체 흐름을 볼 때와 개별 설비를 확인할 때 필요한 정보는 달라요. 한 화면에 모든 지표를 쌓기보다, 선택한 범위에서 답해야 할 질문을 기준으로 위계를 정했어요.',
    blocks: [{ kind: 'comparison', columns: [
      { title: '건물 · 층을 볼 때', items: ['에너지 사용의 전체 흐름을 먼저 봐요.', '변화가 있는 공간을 찾아요.', '상세 확인이 필요한 설비로 이동해요.'] },
      { title: '설비를 볼 때', items: ['선택한 설비와 데이터 범위를 확인해요.', '현재 수치와 변화 추이를 함께 읽어요.', '상위 공간으로 돌아갈 맥락을 남겨요.'] },
    ] }],
  },
  {
    layout: 'split', title: '3D Collaboration', tone: 'elevated',
    heading: '3D와 패널이 같은 대상을 말하게 했어요.',
    body: 'Unreal 환경의 공간 선택과 UI 패널의 정보가 하나의 흐름으로 읽히는 것을 기준으로 삼았어요. 선택, 이동, 정보 전환을 따로 설계하지 않고 연결된 상태로 살폈어요.',
    imageSlot: { label: 'Unreal 3D의 선택 표시와 UI 패널이 같은 공간·설비를 가리키는 화면', layout: 'split' },
  },
  {
    layout: 'narrative', title: 'Graph Workflow', tone: 'focus', spacing: 'narrative',
    heading: '그래프 제작 방식부터 바꿨어요.',
    body: '반복되는 그래프 제작 시간을 줄이고 개발까지 더 빠르게 연결하기 위해, HTML로 먼저 구현하고 Figma로 옮기는 작업 방식을 제안했어요. 실제 인터랙션까지 HTML에서 확인한 뒤, AI로 만든 전용 Figma 플러그인을 통해 프로젝트 톤앤매너에 맞는 디자인으로 옮겼어요.',
    blocks: [
      { kind: 'graph-workflow', title: '동작하는 그래프에서 개발 전달까지', steps: [
        { title: 'HTML 구현', body: 'AI를 활용해 반복되는 그래프 구현을 빠르게 진행하고, 정적인 모양뿐 아니라 실제 동작까지 만들었어요.' },
        { title: '인터랙션 검증', body: 'HTML에서 그래프를 직접 조작하며, 사용할 인터랙션과 동작 방식을 확인했어요.' },
        { title: 'Figma Plugin으로 변환', body: 'AI를 활용해 제작한 전용 플러그인으로 HTML 그래프를 Figma에 가져와, 프로젝트의 디자인 기준에 맞는 산출물로 정리했어요.' },
        { title: 'Figma + HTML 개발 전달', body: 'Unreal 개발자에게 Figma 디자인과 실제 동작하는 HTML 파일을 함께 전달해, 시각 디자인과 인터랙션을 직접 비교하며 참고할 수 있게 했어요.' },
      ],
        insight: '개발자에게 화면만 전달하는 대신, 실제로 동작하는 HTML을 함께 전달했어요.',
        conclusion: '이후 Figma와 실제 동작하는 HTML을 함께 Unreal 개발자에게 전달해, 인터랙션을 다시 해석하는 과정을 줄이고 디자인 의도를 더 정확하게 구현할 수 있도록 했어요.',
      },
    ],
  },
  {
    layout: 'decisions', title: 'Key Decisions', tone: 'base',
    heading: '판단의 기준은, 현재 선택한 공간이었어요.',
    blocks: [{ kind: 'compact-decisions', items: [
      { title: '공간에서 데이터로', body: '공간 → 설비 → 데이터 순서로 좁혀가며 정보의 소속을 놓치지 않게 했어요.' },
      { title: '선택을 중심으로', body: '현재 선택과 관계있는 정보부터 보여주고, 상위 범위는 맥락으로 남겼어요.' },
      { title: '3D와 패널을 함께', body: '공간의 선택 표시와 패널의 제목·내용이 같은 대상을 가리키도록 정리했어요.' },
    ] }],
  },
  {
    layout: 'product', title: 'Building Together', tone: 'focus', spacing: 'image',
    heading: '실제 공간 안에서 화면을 맞춰갔어요.',
    body: '평면 시안에서 정리한 정보가 3D 환경에서도 잘 읽히는지 살폈어요. 공간 이동 중 패널이 가리는 범위와 선택 표시, 정보가 전환되는 순간을 기획·개발·3D 결과와 함께 맞춰가는 방향으로 정리했어요.',
    imageSlot: { label: '건물·층·설비 선택 상태별로 3D와 UI 정합성을 비교한 화면', layout: 'wide' },
  },
  {
    layout: 'reflection', title: 'What I Learned', tone: 'base', spacing: 'narrative', reflectionSummary: true,
    heading: '복잡한 데이터일수록, 관계가 먼저였어요.',
    blocks: [{ kind: 'rows', items: [
      { title: '01', body: '같은 수치도 어느 공간의 정보인지에 따라 다르게 읽혔어요.' },
      { title: '02', body: '3D와 UI가 같은 상태를 보여주는 것이 화면의 완성도를 결정했어요.' },
      { title: '03', body: '더 많이 보여주기보다, 지금 필요한 범위를 정하는 일이 중요했어요.' },
    ] }],
    process: ['관계를 정하고', '공간에 연결하고', '정보를 좁혀요'],
    closing: '데이터를 이해하는 순서가 곧 화면의 구조가 되었어요.',
  },
]
