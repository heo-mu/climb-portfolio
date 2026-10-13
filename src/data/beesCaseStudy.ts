import type { CaseSection, ProjectDetailContent } from './caseStudy.ts'

// Editorial draft based on the project brief; no unverified outcome metrics.
export const beesDetail: ProjectDetailContent = {
  presentation: 'editorial',
  summary: '삼성 E&A의 에너지 데이터를 디지털 트윈으로 연결해 관리하는 플랫폼',
  metadata: [['TYPE', '에너지 관리 플랫폼'], ['PERIOD', '2025.12 — 2026.07'], ['ROLE', 'UI/UX 디자인 · UX 리서치 · 서비스 설계 · 디자인 시스템 구축']],
  heroSlot: { label: '삼성 BEES 대표 화면', layout: 'wide', panels: [
    { label: '전체 현황', image: { src: new URL('../../img/projects/bees/bees_main01.webp', import.meta.url).href, alt: '삼성 BEES 건물 전체 에너지 현황 대시보드', width: 1920, height: 1080 } },
    { label: '층별 에너지', image: { src: new URL('../../img/projects/bees/bees_main02.webp', import.meta.url).href, alt: '삼성 BEES 층별 에너지 관리 화면', width: 1920, height: 1080 } },
    { label: '화재 시뮬레이션', image: { src: new URL('../../img/projects/bees/bees_main04.webp', import.meta.url).href, alt: '삼성 BEES 화재 시뮬레이션 화면', width: 1920, height: 1080 } },
    { label: '피난 시뮬레이션', image: { src: new URL('../../img/projects/bees/bees_main05.webp', import.meta.url).href, alt: '삼성 BEES 피난 시뮬레이션 화면', width: 1920, height: 1080 } },
  ] },
}

export const beesCaseStudy: readonly CaseSection[] = [
  {
    layout: 'overview', title: 'Overview', tone: 'base',
    heading: '삼성 E&A의 에너지를 디지털 트윈 위에서 읽고 관리해요.',
    body: '삼성 E&A의 건물·층·설비 에너지 데이터를 실제 공간과 연결한 관리 플랫폼이에요.\n운영자는 공간을 따라 상태를 확인하고 필요한 조치로 이어갈 수 있어요.',
  },
  {
    layout: 'spatial-structure', title: 'Structure', tone: 'elevated', spacing: 'narrative',
    heading: '기능이 아니라, 공간을 기준으로 구조를 다시 잡았어요.',
    body: '운영자가 익숙한 건물과 층, 공간을 따라 들어가면\n그 안의 설비와 데이터를 자연스럽게 확인할 수 있도록 구조를 정리했어요.',
    blocks: [{ kind: 'spatial-hierarchy', steps: [
      { title: '건물', detail: '전체 범위' },
      { title: '층', detail: '범위 좁히기' },
      { title: '공간', detail: '위치 선택' },
      { title: '설비', detail: '대상 확인' },
      { title: '데이터', detail: '상세 정보' },
    ], principles: [
      { title: '상위 공간은 남겨요', body: '설비까지 들어가도 어느 건물과 층에 속하는지 계속 알 수 있게 했어요.' },
      { title: '선택한 데이터는 바꿔요', body: '공간을 바꾸면 해당 위치의 데이터로 함께 전환되게 했어요.' },
    ] }],
  },
  {
    layout: 'statement', title: 'The Problem', tone: 'focus',
    heading: '화면의 수치를 볼 때마다,\n어느 공간의 값인지 다시 읽어야 했어요.',
    body: '기존 시스템은 에너지 데이터를 기능 단위로 나눠 보여줬어요. 그래서 수치를 볼 때마다 그 값이 어느 건물·층·설비의 것인지 다시 해석해야 했어요.',
    blocks: [{ kind: 'problems', items: [
      { title: '공간과 분리된 데이터', body: '데이터가 기능 단위로 나뉘어 있어, 어느 공간의 값인지 함께 읽기 어려웠어요.' },
      { title: '확인과 대응의 단절', body: '상태를 확인하는 화면과 조치하는 화면이 나뉘면 확인한 맥락이 이어지지 않아요.' },
    ] }, { kind: 'insight', label: '핵심 정리', text: '기능 이름을 익히게 하기보다, 운영자가 이미 알고 있는 실제 공간을 따라 정보를 찾게 하는 것이 먼저라고 봤어요.' }],
  },
  {
    layout: 'split', title: 'Spatial Data', tone: 'focus', spacing: 'narrative',
    heading: '데이터를 공간 위에서 바로 읽게 했어요.',
    body: '공간을 선택한 뒤 관련 설비와 에너지 값을 함께 보여줘, 숫자가 어느 위치의 정보인지 다시 해석하지 않아도 되게 했어요.',
    blocks: [{ kind: 'rows', items: [
      { title: '공간에서 선택해요.', body: '설비의 위치와 주변 맥락을 먼저 확인해요.' },
      { title: '같은 대상의 정보를 읽어요.', body: '선택한 설비 이름과 데이터 범위를 패널에서도 확인해요.' },
    ] }],
    imageSlot: { label: '선택한 설비의 위치와 상세 에너지 데이터가 연결된 화면', layout: 'split' },
  },
  {
    layout: 'comparison', title: 'Information Priority', tone: 'base',
    heading: '지금 보고 있는 범위에 맞춰 정보를 나눴어요.',
    body: '전체 현황에서는 변화가 있는 공간을 찾고, 설비 상세에서는 수치와 추이를 확인하도록 정보의 순서를 정했어요. 상세 확인과 상위 공간으로의 이동이 이어지도록, 선택한 위치와 설비의 맥락을 함께 남겼어요.',
    blocks: [{ kind: 'comparison', columns: [
      { title: '건물 · 층을 볼 때', items: ['에너지 사용의 전체 흐름을 먼저 봐요.', '변화가 있는 공간을 찾아요.', '상세 확인이 필요한 설비로 이동해요.'] },
      { title: '설비를 볼 때', items: ['선택한 설비와 데이터 범위를 확인해요.', '현재 수치와 변화 추이를 함께 읽어요.', '상위 공간으로 돌아갈 맥락을 남겨요.'] },
    ] }],
  },
  {
    layout: 'hierarchy', title: 'Consistency', tone: 'focus', spacing: 'narrative',
    heading: '공간은 달라도, 읽는 방식은 같게 했어요.',
    body: '공간을 옮길 때마다 차트 위치나 패널 구조가 달라지면, 데이터를 읽기 전에 화면부터 다시 익혀야 해요. 필요한 정보는 바꾸되 읽는 규칙은 유지해, 운영자가 데이터에 집중하도록 했어요.',
    blocks: [{ kind: 'rows', items: [
      { title: '정보의 깊이는 달라져요.', body: '건물에서는 전체 흐름과 이상 징후를, 층에서는 해당 공간의 상태를, 설비에서는 개별 상세 데이터를 보여줬어요.' },
      { title: '읽는 규칙은 유지해요.', body: '정보의 위치와 상태 표현, 차트·패널의 위계를 맞췄어요. 선택한 공간과 데이터를 연결하는 방식도 같은 규칙을 따르게 했어요.' },
      { title: '익숙한 방식으로 이어가요.', body: '새로운 공간에서도 이미 익힌 순서로 정보를 읽고 다음 행동을 찾도록 했어요. 사용할수록 화면을 더 익숙하게 다루는 것이 목표였어요.' },
    ] }],
  },
  {
    layout: 'split', title: 'Integration', tone: 'elevated',
    heading: '3D와 패널이 같은 대상을 말하게 했어요.',
    body: 'Unreal 환경의 공간 선택과 UI 패널의 정보가 하나의 흐름으로 읽히는 것을 기준으로 삼았어요. 선택, 이동, 정보 전환을 따로 설계하지 않고 연결된 상태로 살폈어요.',
    imageSlot: { label: 'Unreal 3D의 선택 표시와 UI 패널이 같은 공간·설비를 가리키는 화면', layout: 'split' },
  },
  {
    layout: 'narrative', title: 'Workflow', tone: 'focus', spacing: 'narrative',
    heading: '그래프 제작 방식부터 바꿨어요.',
    body: '반복되는 그래프 제작 시간을 줄이고 개발까지 더 빠르게 연결하기 위해, HTML로 먼저 구현하고 Figma로 옮기는 작업 방식을 제안했어요. 실제 인터랙션까지 HTML에서 확인한 뒤, 전용 Figma 플러그인을 통해 프로젝트 톤앤매너에 맞는 디자인으로 옮겼어요.',
    blocks: [
      { kind: 'graph-workflow', title: '동작하는 그래프에서 개발 전달까지', steps: [
        { title: 'HTML 구현', body: '그래프를 HTML로 구현해, 정적인 모양뿐 아니라 실제 동작까지 만들었어요.' },
        { title: '인터랙션 검증', body: 'HTML에서 그래프를 직접 조작하며, 사용할 인터랙션과 동작 방식을 확인했어요.' },
        { title: 'Figma Plugin으로 변환', body: '전용 플러그인으로 HTML 그래프를 Figma에 가져와, 프로젝트의 디자인 기준에 맞는 산출물로 정리했어요.' },
        { title: 'Figma + HTML 개발 전달', body: 'Unreal 개발자에게 Figma 디자인과 실제 동작하는 HTML 파일을 함께 전달해, 시각 디자인과 인터랙션을 직접 비교하며 참고할 수 있게 했어요.' },
      ],
        evidence: { stepIndex: 2, label: '직접 제작한 Figma 차트 삽입 플러그인', image: { src: new URL('../../img/projects/bees/graph_01.png', import.meta.url).href, alt: '직접 제작한 BEES 차트 삽입 Figma 플러그인의 차트 선택 목록과 캔버스 삽입 화면', width: 890, height: 1350 } },
        supporting: '반복되는 그래프 구현과 전용 Figma 플러그인 제작에 AI를 활용했어요. 인터랙션과 디자인 기준은 직접 확인하고 조정했어요.',
        insight: '개발자에게 화면만 전달하는 대신, 실제로 동작하는 HTML을 함께 전달했어요.',
        conclusion: '이후 Figma와 실제 동작하는 HTML을 함께 Unreal 개발자에게 전달해, 인터랙션을 다시 해석하는 과정을 줄이고 디자인 의도를 더 정확하게 구현할 수 있도록 했어요.',
      },
    ],
  },
  {
    layout: 'ai-agent', title: 'AI Agent', tone: 'elevated', spacing: 'narrative',
    heading: 'AI Agent의 역할부터, 보이는 모습까지 만들었어요.',
    body: 'BEES의 AI Agent를 직접 구성하고, 사용자가 역할을 직관적으로 알 수 있도록 캐릭터까지 함께 설계했어요.',
    blocks: [{ kind: 'rows', items: [
      { title: '역할 정의', body: 'Agent가 어떤 상황에서 등장하고 어떤 역할을 해야 하는지 먼저 정했어요.' },
      { title: 'AI로 비주얼 탐색', body: '캐릭터의 형태와 분위기를 AI로 빠르게 만들어 보면서 여러 방향을 비교했어요.' },
      { title: '서비스에 맞게 정리', body: '생성 결과를 그대로 쓰지 않고, BEES의 인터페이스와 어울리는 방향을 선택하고 다듬었어요.' },
    ] }, { kind: 'supporting', text: 'AI로 캐릭터 시안을 빠르게 반복 제작했어요. Agent의 역할과 서비스 톤에 맞는 결과는 직접 골랐어요.' }, { kind: 'insight', text: 'AI로 줄인 건 제작 과정이고, 어떤 모습과 역할이 맞는지는 직접 판단했어요.', supporting: '기능과 캐릭터를 따로 만들기보다, 사용자가 하나의 Agent 경험으로 받아들이도록 함께 정리했어요.' }],
    imageSlot: { label: 'Agent / Character' },
  },
  {
    layout: 'decisions', title: 'Key Decisions', tone: 'base',
    heading: '판단의 기준은, 현재 선택한 공간이었어요.',
    blocks: [{ kind: 'compact-decisions', items: [
      { title: '기능보다 공간을 먼저 보여줬어요.', body: '기능 이름을 먼저 고르지 않아도, 익숙한 건물과 층에서 탐색을 시작할 수 있게 했어요.' },
      { title: '선택한 공간의 데이터를 연결했어요.', body: '공간 선택이 바뀌면 패널의 대상과 데이터 범위도 함께 바뀌도록 정리했어요.' },
      { title: '확인한 맥락을 다음 행동까지 이었어요.', body: '설비 상세를 확인하거나 상위 공간으로 돌아갈 때도, 어느 위치의 정보를 보고 있는지 알 수 있게 했어요.' },
    ] }],
  },
  {
    layout: 'reflection', title: 'What I Learned', tone: 'elevated', spacing: 'narrative', reflectionSummary: true,
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
