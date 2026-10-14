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
    heading: '삼성 E&A의 에너지를\n디지털 트윈 위에서 읽고 관리해요.',
    body: '삼성 E&A의 건물·층·설비 에너지 데이터를 실제 공간과 연결한 관리 플랫폼이에요.\n운영자는 공간을 따라 상태를 확인하고 필요한 조치로 이어갈 수 있어요.',
  },
  {
    layout: 'spatial-structure', title: 'Structure', tone: 'elevated', spacing: 'narrative',
    heading: '공간을 기준으로 정보 구조를 설계했어요.',
    body: '운영자가 익숙한 건물과 층, 공간을 따라 들어가면\n그 안의 설비와 데이터를 자연스럽게 확인할 수 있도록 구조를 정리했어요.',
    blocks: [{ kind: 'spatial-hierarchy', steps: [
      { title: '건물', detail: '전체 범위' },
      { title: '층', detail: '건물 안의 층' },
      { title: '공간', detail: '층 안의 공간' },
      { title: '설비', detail: '공간 안의 설비' },
      { title: '데이터', detail: '선택 대상의 정보' },
    ], principles: [
      { title: '상위 공간은 남겨요', body: '설비까지 들어가도 어느 건물과 층에 속하는지 계속 알 수 있게 했어요.' },
      { title: '선택한 데이터는 바꿔요', body: '공간을 바꾸면 해당 위치의 데이터로 함께 전환되게 했어요.' },
    ] }],
  },
  {
    layout: 'statement', title: 'The Problem', tone: 'focus',
    heading: '건물·층·설비의 수치만으로는,\n어느 공간의 상태인지 바로 이해하기 어려웠어요.',
    body: '에너지 데이터는 건물·층·설비처럼 여러 공간 단위로 연결돼 있어요.\n수치와 공간의 관계를 한눈에 읽을 수 있는 구조가 필요했어요.',
    blocks: [{ kind: 'problems', items: [
      { title: '공간과 분리된 데이터', body: '건물·층·설비의 수치만 보면, 어느 공간의 상태인지 함께 읽기 어려워요.' },
      { title: '확인과 대응의 단절', body: '상태를 확인하는 화면과 조치하는 화면이 나뉘면 확인한 맥락이 이어지지 않아요.' },
    ] }, { kind: 'insight', text: '기능 이름을 익히게 하기보다, 운영자가 이미 알고 있는 실제 공간을 따라 정보를 찾게 하는 것이 먼저라고 봤어요.' }],
  },
  {
    layout: 'spatial-data', title: 'Spatial Data', tone: 'elevated', spacing: 'narrative',
    heading: '공간 데이터와 설비 상세를 분리했어요.',
    body: '공간의 상태와 데이터는 공간 화면에서, 설비 상세는 필요할 때 별도 모달에서 확인하게 했어요.',
    blocks: [{ kind: 'rows', items: [
      { title: '공간의 상태를 먼저 읽어요.', body: '공간 화면에서는 현재 위치의 상태와 데이터를 우선해서 읽고, 설비 상세는 필요할 때 열게 했어요.' },
      { title: '설비 상세는 모달에서 확인해요.', body: '한 화면에 정보를 더하기보다 공간과 설비의 역할을 나눴어요. 모달로 구분해 지금 보고 있는 정보가 무엇인지 분명하게 했어요.' },
    ] }],
    imageSlot: { label: '공간 화면과 별도 모달로 분리한 설비 상세', layout: 'wide', image: {
      src: new URL('../../img/projects/bees/spatial_01.png', import.meta.url).href,
      alt: '삼성 BEES 공간 화면 위에 설비 모델과 장비 정보를 별도 모달로 표시한 화면', width: 1920, height: 1080,
    } },
  },
  {
    layout: 'comparison', title: 'Information Priority', tone: 'base',
    heading: '공간마다 정보는 달라도, 읽는 규칙은 같게 했어요.',
    body: '건물·층·설비마다 필요한 정보의 깊이를 정하고, 화면을 읽는 방식은 일관되게 설계했어요.\n공간을 이동할 때마다 화면을 다시 익히지 않고 데이터에 집중하도록 했어요.',
    blocks: [{ kind: 'comparison', columns: [
      { title: '건물 · 층을 볼 때', items: ['건물에서는 전체 에너지 흐름과 이상 징후를 봐요.', '층에서는 해당 공간의 상태와 변화를 확인해요.', '상세 확인이 필요한 설비로 이동해요.'] },
      { title: '설비를 볼 때', items: ['선택한 설비와 데이터 범위를 확인해요.', '현재 수치와 변화 추이를 함께 읽어요.', '상위 공간으로 돌아갈 맥락을 남겨요.'] },
    ] }, {
      kind: 'insight',
      text: '정보의 위치와 상태 표현, 차트·패널의 위계는 같은 규칙으로 맞췄어요.',
      supporting: '선택한 공간과 데이터를 연결하는 방식도 유지해, 새로운 공간에서도 익숙한 순서로 정보를 읽고 다음 행동을 찾도록 했어요.',
    }],
  },
  {
    layout: 'narrative', title: 'Workflow', tone: 'focus', spacing: 'narrative',
    heading: '그래프를 실제로 동작하도록 설계했어요.',
    body: '반복되는 그래프 제작 시간을 줄이고 개발까지 더 빠르게 연결하기 위해, HTML로 먼저 구현하고 Figma로 옮기는 작업 방식을 제안했어요.\n실제 인터랙션까지 HTML에서 확인한 뒤, 전용 Figma 플러그인을 통해 프로젝트 톤앤매너에 맞는 디자인으로 옮겼어요.',
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
    heading: 'AI Agent의 모습부터, 실제 사용하는 경험까지 설계했어요.',
    body: 'Agent의 역할을 정하고, 캐릭터 비주얼은 AI를 활용해 제작했어요. 실제 기능과 UX 흐름, UI 구성은 직접 설계했어요.',
    imageSlot: { label: 'Agent 캐릭터 제작과 실제 기능·UI 설계', layout: 'agent-sequence', introductions: [
      { label: '01. Character Design', heading: '원하는 모습이 나올 때까지 AI를 디렉팅했어요.', body: 'Agent의 역할과 인상을 먼저 정하고, 결과를 비교하며 프롬프트를 계속 조정했어요. AI가 만든 결과를 고르는 데 그치지 않고, 원하는 방향으로 결과를 만들어갔어요.', aiUsage: 'Agent의 역할과 방향은 직접 정하고, 캐릭터의 형태를 탐색하고 제작하는 과정에 AI를 활용했어요. 여러 결과를 비교해 서비스에 어울리는 모습으로 정리했어요.' },
      { label: '02. Agent Experience', heading: '필요한 순간에 먼저 알려주고, 바로 행동으로 이어지게 설계했어요.', body: 'Agent 진입부터 사용자 입력과 대화, 이상 상황 알림까지 하나의 흐름으로 직접 설계했어요. 관련 화면으로 이동하고 조치를 확인하는 과정까지 연결해 실제 UI로 구성했어요.' },
    ], panels: [
      { label: '캐릭터 탐색 1', image: { src: new URL('../../img/projects/bees/agent_01.png', import.meta.url).href, alt: 'AI를 활용해 제작한 BEES Agent 캐릭터의 정면 모습', width: 136, height: 136 } },
      { label: '캐릭터 탐색 2', image: { src: new URL('../../img/projects/bees/agent_02.png', import.meta.url).href, alt: 'AI를 활용해 제작한 BEES Agent 캐릭터의 다른 방향 모습', width: 136, height: 136 } },
      { label: 'Agent UI 적용', image: { src: new URL('../../img/projects/bees/agent_03.png', import.meta.url).href, alt: 'BEES Agent 캐릭터를 적용한 진입 버튼, 대화 화면과 긴급 알림 UI', width: 1656, height: 504 } },
    ] },
  },
  {
    layout: 'reflection', title: 'Reflection', tone: 'base', spacing: 'narrative', reflectionSummary: true,
    heading: '공간을 따라가며 필요한 정보의 범위를 정했어요.',
    blocks: [{ kind: 'rows', items: [
      { title: '01', body: '낯선 환경일수록 기준이 먼저 필요했어요.\n공간을 따라 이동한다는 기준으로 복잡한 구조를 단순하게 정리할 수 있었어요.' },
      { title: '02', body: '공간이 달라도 읽는 방식은 같게 했어요.\n화면 구조를 일관되게 유지해 사용자가 새로운 화면을 다시 익히지 않도록 했어요.' },
      { title: '03', body: '더 많이 보여주는 게 답은 아니었어요.\n현재 공간에서 필요한 정보의 범위를 정하는 것이 더 중요했어요.' },
    ] }],
    process: ['관계를 정하고', '공간에 연결하고', '정보를 좁혀요'],
    closing: '더 많이 보여주기보다, 지금 필요한 정보의 범위를 정하는 일이 중요했어요.',
  },
]
