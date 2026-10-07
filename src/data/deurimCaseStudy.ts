import type { CaseSection, ProjectDetailContent } from './caseStudy.ts'

export const deurimDetail: ProjectDetailContent = {
  summary: '구매 전, 우리 집에 냉장고를 설치할 수 있는지 3D로 확인하는 웹 서비스',
  metadata: [
    ['Type', 'Solo Product Experiment'],
    ['Period', '2026.09 · 3 Weeks'],
    ['Role', 'Product Design · AI-assisted Build'],
    ['Scope', 'Planning · UX/UI · 3D · Front-end · QA'],
  ],
  heroSlot: { label: 'PROJECT OVERVIEW', caption: '냉장고를 고르는 제품 선택 화면' },
}

export const deurimCaseStudy: readonly CaseSection[] = [
  {
    title: 'Overview', heading: '한 명의 디자이너, 하나의 완결된 제품 경험.',
    body: '들임은 AI와 함께 제품을 어디까지 독립적으로 설계하고 구현할 수 있는지 확인한 개인 실험입니다. 2026년 9월, 약 3주 동안 협업 인원 없이 기획부터 UX/UI, 3D 경험, 프런트엔드 구현과 QA까지 진행했습니다. 백엔드는 사용하지 않았습니다.',
    blocks: [{ kind: 'rows', items: [
      { title: 'Define & Design', body: '문제 정의와 제품 기획, UX 구조, 디자인 시스템, 반응형 UX, UX Writing과 인터랙션을 설계했습니다.' },
      { title: 'Build & Validate', body: 'Three.js / WebGL 경험과 프런트엔드 구현 방향을 정하고, AI Coding Agent를 운용하며 QA·회귀 검증·최종 품질 정리까지 연결했습니다.' },
    ] }],
  },
  {
    title: 'Why I Built This', heading: '제품 판단과 구현 사이의 거리를 줄이고 싶었습니다.',
    body: 'AI가 디자인 업무를 얼마나 대신할 수 있는지보다, 디자이너가 AI를 실행 파트너로 활용했을 때 자신의 판단을 실제 제품으로 어디까지 옮길 수 있는지가 궁금했습니다.',
    blocks: [{ kind: 'rows', items: [
      { title: '실험의 기준', body: '화면 생성에서 멈추지 않고, 제품을 고르고 공간을 입력해 설치 가능 여부를 확인하는 흐름을 끝까지 만들기로 했습니다. 실제 브라우저에서 직접 조작하고 다시 판단할 수 있어야 했습니다.' },
    ] }],
  },
  {
    title: 'The Problem', heading: '치수를 읽는 것만으로는 우리 집을 상상하기 어렵습니다.',
    body: '제품 페이지에는 치수가 있지만, 실제 공간과 비교하는 일은 사용자에게 남아 있습니다. 냉장고가 들어가는지, 좌우 여유가 충분한지, 벽과 가구가 방해하는지, 문을 열 수 있는지와 배치 위치를 함께 판단해야 합니다.',
    blocks: [{ kind: 'rows', items: [
      { title: 'Problem statement', body: '치수를 읽고 상상하는 경험을, 공간에서 직접 확인하는 경험으로 바꾸고 싶었습니다.' },
    ] }],
    imageSlot: { label: 'PRODUCT SELECTION', caption: '실제 제품 정보에서 시작하는 냉장고 선택 흐름' },
  },
  {
    title: 'Structuring the Product', heading: '화면보다 먼저, 데이터와 상태의 관계를 정했습니다.',
    body: '제품 데이터와 사용자 공간, 설치 조건을 분리하고 제조사 자료가 뒷받침하는 기능만 검증으로 연결했습니다. Product Data → User Space → Installation Conditions → Manufacturer Data → Capability → Validation → Consumer Result의 관계가 화면 구조의 기준이 됐습니다.',
    blocks: [
      { kind: 'flows', items: [{ title: '사용자 흐름', steps: ['제품 선택', '공간 입력', '3D Fit Checker', '공간·제품 비교', '설치 판정', '문제 위치 확인'] }] },
      { kind: 'rows', items: [
        { title: '판정 상태', body: 'INSTALLABLE / NOT_INSTALLABLE / UNKNOWN·PARTIAL을 구분했습니다. UNKNOWN은 실패가 아니라, 현재 근거로는 판단할 수 없음을 알리는 명시적인 제품 상태입니다.' },
        { title: '입력과 기능 상태', body: '사용자 입력 오류와 제조사 데이터 누락을 구분했습니다. 문 열림 시뮬레이션도 필요한 데이터가 있는 제품에서만 제공했습니다.' },
        { title: '제품 변경과 유지할 맥락', body: '제품을 바꿔도 입력한 공간은 유지하고, 이전 제품의 문 각도와 조작 상태는 초기화했습니다. 저장되는 공간 맥락과 일시적인 인터랙션 상태를 분리했습니다.' },
      ] },
    ],
    imageSlot: { label: 'SPACE INPUT', caption: '내 공간을 알려주세요 — 너비·높이·깊이로 판단에 필요한 최소 정보 입력' },
  },
  {
    title: 'Designing for Trust', heading: '보여줄 수 있는 것과, 판단할 수 있는 것을 나눴습니다.',
    body: '제조사마다 힌지 좌표, 최대 문 열림 각도, 측면 여유 공간, 문 두께와 문이 지나가는 영역의 데이터 범위가 달랐습니다. 공식 자료가 없는 값은 임의로 채우지 않고 UNKNOWN으로 유지했습니다.',
    blocks: [
      { kind: 'comparison', columns: [
        { title: 'Visual Approximation', items: ['공간과 제품의 관계를 이해하도록 돕는 시각적 표현', '외형을 위한 근삿값은 설치 판정의 근거로 사용하지 않음'] },
        { title: 'Authoritative Validation', items: ['제조사 근거가 있는 치수와 조건으로 판단', '사용자 입력이 없는 경우와 제조사 자료가 없는 경우를 구분해 안내'] },
      ] },
      { kind: 'quote', text: '더 많은 결과를 보여주는 것보다, 틀린 확신을 주지 않는 것을 우선했습니다.' },
    ],
    imageSlot: { label: 'VALIDATION STATE', caption: '설치 가능·불가·확인 필요 상태와 각 판단의 근거' },
  },
  {
    title: 'How I Used AI', heading: '구조화부터 회귀 검증까지, 실행의 반복에 AI를 연결했습니다.',
    body: '제작에 드는 반복을 줄인 만큼 더 많은 상태와 예외를 검토할 수 있었습니다. AI의 제안을 브라우저에서 확인하고, 제품 기준에 맞게 수정하는 순환을 만들었습니다.',
    blocks: [
      { kind: 'rows', items: [
        { title: 'Structure · ChatGPT', body: '문제 구조화, 요구사항 분해, 정책 비교, 누락된 상태 탐색, UX Writing 검토와 QA 기준 설계에 활용했습니다.' },
        { title: 'Build · Claude / Coding Agent', body: 'React·TypeScript·CSS 구현, 반응형 레이아웃, 상태와 저장, Three.js 인터랙션, 검증 로직 연결, 회귀 수정과 테스트를 반복했습니다.' },
        { title: 'Visual Exploration · Image AI', body: '초기 비주얼 방향과 썸네일, UI 무드를 탐색하는 데 활용했습니다.' },
        { title: 'QA · Browser & E2E', body: '화면 폭별 회귀, 한국어 줄바꿈, hover·focus, 새로고침과 저장, 같은 제품 재선택, 터치·키보드 조작, 콘솔과 런타임 오류를 확인했습니다.' },
      ] },
      { kind: 'flows', items: [
        { title: '기존 전달 중심 흐름', steps: ['Figma', '개발 전달', '구현 대기', 'QA', '수정 요청', '재구현'] },
        { title: '이번 AI-assisted 흐름', steps: ['문제 정의', '동작하는 프로토타입', '브라우저에서 판단', '수정', 'QA', '재검증'] },
      ] },
    ],
  },
  {
    title: 'What AI Did / What I Decided', heading: '실행을 맡겨도, 판단의 책임은 직접 가졌습니다.',
    body: 'AI가 제안한 결과를 그대로 적용하지 않았습니다. 구현의 편의보다 사용자가 무엇을 이해하고 믿을 수 있는지를 기준으로 선택했습니다.',
    blocks: [
      { kind: 'comparison', columns: [
        { title: 'AI에 맡긴 것', items: ['반복 구현, 코드 탐색과 보일러플레이트', 'UI 변형안, CSS 수정과 패턴 탐색', '상태 비교, QA와 회귀 탐지'] },
        { title: '직접 판단한 것', items: ['문제 정의와 정보 우선순위', '신뢰할 수 있는 범위와 허용할 불확실성', '보여줄 기능과 덜어낼 정보', '자연스러운 인터랙션과 최종 시각적 품질'] },
      ] },
      { kind: 'quote', text: 'AI는 판단을 대신하는 도구가 아니라, 내가 내린 판단을 더 빠르게 구현하고 검증하는 도구로 사용했습니다.' },
      { kind: 'rows', items: [
        { title: '01 · 면책 문구 대신 명확한 상태', body: '“각도는 3D로 추정한 값이라 실제와 다를 수 있어요.”라는 문구는 기능 전체를 불신하게 만들 수 있어 제거했습니다. 한계를 숨기는 대신 UNKNOWN과 데이터 출처로 확인할 수 있는 범위와 없는 범위를 구분했습니다.' },
        { title: '02 · 모바일에는 Solid', body: 'Desktop의 Glass 표현을 그대로 축소하지 않았습니다. 모바일은 Solid로 분리해 작은 화면의 정보와 조작에 집중하도록 했습니다.' },
        { title: '03 · 변경 범위에 맞춘 QA', body: '작은 시각 수정은 최소 QA, 릴리스는 전체 QA로 구분했습니다. AI를 얼마나 많이 쓰는지보다 언제, 어느 범위까지 검증할지를 직접 정했습니다.' },
        { title: '04 · 같은 문자열보다 같은 의미', body: '버튼의 “결과 보기”와 화면 제목의 “설치 결과”를 억지로 통일하지 않았습니다. 버튼은 행동, 제목은 도착한 위치를 설명해야 하기 때문입니다.' },
      ] },
    ],
  },
  {
    title: 'Key UX Decisions', heading: '지금 할 행동이 먼저 읽히도록 정리했습니다.',
    body: '제품·공간·결과 정보를 역할별로 묶고, 탭·슬라이더·바텀 시트처럼 익숙한 패턴을 사용했습니다. 공간 조절, 제품 변경, 문 열림, 배치와 결과 확인이 같은 강도로 경쟁하지 않도록 했습니다.',
    blocks: [
      { kind: 'quote', text: '더 많은 기능을 보여주는 것보다, 사용자가 지금 무엇을 판단해야 하는지 명확하게 만드는 데 집중했습니다.' },
      { kind: 'decisions', items: [
        { title: '모바일은 Desktop을 줄이지 않았습니다.', problem: '3열 화면을 축소하면 3D가 작아지고 정보 밀도가 높아졌습니다.', decision: '3D Main을 중심으로 Bottom Deck, Quick Controls, Bottom Sheet와 Sticky CTA를 배치했습니다.', principle: '반응형은 크기를 줄이는 일이 아니라 우선순위를 다시 결정하는 일입니다.' },
        { title: '결과와 조작을 분리했습니다.', problem: '설치 결과, 공간 조절, 문 열림과 배치가 동시에 주의를 요구했습니다.', decision: '메인 화면은 조작에 집중하고, Primary CTA인 “결과 보기”로 상세 결과에 접근하게 했습니다.', principle: '현재 행동과 상세 정보가 경쟁하지 않아야 둘 다 잘 읽힙니다.' },
        { title: '모르는 값은 모른다고 표현했습니다.', problem: '일부 제조사 데이터가 없어 모든 조건을 판정할 수 없었습니다.', decision: 'UNKNOWN을 별도 상태로 두고 추가 입력과 제조사 확인이 필요한 경우를 구분했습니다.', principle: '설치 서비스에서는 더 많은 결과보다 잘못된 확신을 주지 않는 것이 중요합니다.' },
        { title: '강조는 중요한 행동에만 사용했습니다.', problem: '여러 요소를 강조하면 중요도의 차이가 사라졌습니다.', decision: '브랜드 색은 Primary / Selected / Active / Current 상태에 집중했습니다.', principle: '강조는 많이 할수록 강해지는 것이 아니라 주변과 차이가 날 때 강해집니다.' },
      ] },
    ],
  },
  {
    title: 'From Design to Working Product', heading: '동작하는 제품에서 디자인을 다시 판단했습니다.',
    body: 'React와 TypeScript, 상태 관리와 저장, 반응형 UI, Three.js, 검증 로직을 하나의 흐름으로 연결하고 테스트와 E2E로 확인했습니다. 직접 동작하는 제품이 있어야 인터랙션의 자연스러움과 실제 조작성을 판단할 수 있었습니다.',
    blocks: [{ kind: 'list', items: [
      '3D가 장식이 아니라 제품·공간·판정의 관계를 이해하는 도구로 읽히는가?',
      '모바일에서도 조작 대상과 CTA가 충분히 크고 명확한가?',
      '긴 텍스트, 포커스, 스크롤바와 새로고침 이후에도 의도한 경험이 유지되는가?',
    ] }],
    imageSlot: { label: '3D FIT CHECKER', caption: 'Space Setup · Interactive 3D · Result / Door Control을 연결한 핵심 제품 경험' },
  },
  {
    title: 'Responsive Strategy', heading: '작은 화면에서는 정보의 순서를 다시 설계했습니다.',
    body: 'Desktop은 공간 설정·3D·결과를 함께 비교할 수 있게 구성했습니다. 모바일에서는 3D를 중심에 두고, 조작과 상세 정보는 필요할 때 열도록 나눴습니다.',
    blocks: [{ kind: 'comparison', columns: [
      { title: 'Desktop · Compare', items: ['3열 구조로 공간과 제품, 결과를 비교', 'Glass 표현으로 공간 경험과 UI 연결', '한 화면에서 조작 맥락 유지'] },
      { title: 'Mobile · Focus', items: ['3D Main과 Solid UI로 가독성 확보', 'Quick Controls와 Bottom Sheet로 단계적 접근', 'Sticky CTA로 결과 확인 경로 유지'] },
    ] }],
    imageSlot: { label: 'MOBILE RESPONSIVE', caption: '3D Main · Bottom Deck · Bottom Sheet · 결과 보기 CTA' },
  },
  {
    title: 'QA as Product Design', heading: '실제 환경에서도 의도가 유지되어야 디자인이 끝납니다.',
    body: 'Figma에서 정돈된 화면도 브라우저에서는 다른 문제를 드러냈습니다. 320·390·768·1199·1200px 등 화면 폭, 다른 제품과 긴 이름, UNKNOWN 상태, 새로고침, 터치·키보드·스크롤까지 검토 범위를 넓혔습니다.',
    blocks: [{ kind: 'rows', items: [
      { title: 'Layout & Readability', body: '1200–1280px에서 숫자가 잘리는 현상, 한국어 단어 중간 줄바꿈, 스크롤바 너비 차이와 툴팁 대비를 확인하고 조정했습니다.' },
      { title: 'State & Validation', body: '음수로 표시되는 가용 공간, 제품 변경 후 이전 상태가 남는 현상, 새로고침 이후 저장 상태와 결과 문구의 정합성을 검증했습니다.' },
      { title: 'Interaction & Regression', body: '모바일에서 남는 포커스, CTA hover 회귀, 같은 제품 재선택과 입력 방식별 동작을 확인했습니다. 수정 뒤에는 영향을 받는 흐름을 다시 검증했습니다.' },
    ] }],
  },
  {
    title: 'Outcome', heading: '완결된 제품 흐름을 만들고, 외부에 공개했습니다.',
    body: '제품 선택부터 공간 입력, 설치 판단과 문제 위치 확인까지 이어지는 경험을 혼자 설계하고 구현했습니다. 결과물은 Wanted AI Hackathon에 출품해 외부에 공개했고, 투표 순위 73위를 기록했습니다.',
    blocks: [
      { kind: 'rows', items: [
        { title: '완성한 경험', body: '제품 선택·변경, 공간 설정, Interactive 3D와 배치, 데이터가 지원되는 제품의 문 열림 조작, 설치 검증과 공간 문제 표시를 연결했습니다.' },
        { title: '제품으로 유지할 기반', body: '반응형 App Mode, 결과 확인 흐름, 제조사 출처 안내, 상태 저장과 Playwright QA까지 구성했습니다.' },
      ] },
      { kind: 'list', items: ['비즈니스 KPI나 사용자 성과는 측정하지 않았습니다. 이 실험의 결과는 독립적으로 제품 경험을 만들고 검증한 범위에 있습니다.'] },
    ],
  },
  {
    title: 'What I Learned', heading: '구현을 맡길수록 판단의 기준은 더 명확해야 했습니다.',
    body: '좋은 화면을 그리는 것과 실제 제품에서 좋은 경험을 만드는 것은 달랐습니다. 상태·데이터·검증·반응형·포커스·저장까지 연결해야 UX 품질을 지킬 수 있었습니다.',
    blocks: [
      { kind: 'rows', items: [
        { title: '기준을 먼저 정의하기', body: 'AI에게 구현을 맡길수록 무엇을 신뢰할 수 있고 어떤 상태를 허용할지 디자이너가 먼저 정해야 했습니다.' },
        { title: '줄인 반복을 더 많은 검증으로', body: 'AI는 작업량을 줄이는 도구를 넘어, 더 많은 가설과 상태를 실제 환경에서 확인할 수 있게 해주는 도구였습니다.' },
      ] },
      { kind: 'quote', text: '판단은 직접 하고, 반복은 AI로 줄였습니다.' },
    ],
  },
]
