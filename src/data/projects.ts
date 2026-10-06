export type CaseSection = {
  title: string
  heading: string
  body: string
  /** Steps drawn as a process line under the body. */
  process?: readonly string[]
  /** Reserves a media frame under the body. */
  media?: boolean
}

export type Project = {
  slug: string
  number: string
  name: string
  tags: readonly string[]
  type: string
  period: string
  role: string
  summary: string
  /** Only real, project-specific status. Never a placeholder value. */
  status?: string
  /** Unmodified source capture; declared dimensions reserve the frame before loading. */
  screen: { desktop: string; width: number; height: number }
  /** The project's own case study; until provided, the shared process narrative is shown. */
  caseStudy?: readonly CaseSection[]
}

// new URL(…, import.meta.url): a fingerprinted asset for Vite, a plain URL for Node tooling.
const screen = (source: URL, width: number, height: number) => ({ desktop: source.href, width, height })

export const projects: readonly Project[] = [
  { slug: 'deurim', number: '01', name: '들임', tags: ['SoloBuild', 'AIAssisted', 'WebGL', 'WebService'], type: 'Web Service', period: '2026.09 — 2026.10', role: '기획 · 디자인 · 구현', summary: '구매 전 설치 가능 여부를 확인하는 웹 서비스', screen: screen(new URL('../../img/projects/originals/deurim.webp', import.meta.url), 1920, 1080) },
  { slug: 'samsung-bees', number: '02', name: '삼성 BEES', tags: ['UnrealEngine', 'DigitalTwin', 'EnergyData'], type: 'Energy Platform', period: '2025.12 — 2026.07', role: 'UX Research / Service Design', summary: '건물 · 층 · 설비의 에너지 데이터를 공간 단위로 읽고 관리하는 플랫폼', screen: screen(new URL('../../img/projects/bees-dashboard.png', import.meta.url), 1920, 1080) },
  { slug: 'edk', number: '03', name: 'EDK', tags: ['ESGPlatform', 'B2BSaaS', 'RBAC'], type: 'B2B Platform', period: '2024.12 — 2025.12', role: 'Design Systems', summary: '기업의 ESG 지표를 종합적으로 관리하는 B2B 플랫폼', screen: screen(new URL('../../img/projects/originals/edk.png', import.meta.url), 1920, 1080) },
  { slug: 'moel-ax', number: '04', name: '고용노동부 AX', tags: ['OCR', 'GovernmentService', 'AIAnalysis'], type: 'Public Service', period: '2026.01 — 2026.06', role: 'Interaction / Prototyping', summary: 'AI가 서류와 현장 사진을 분석해 필요한 솔루션을 제안하는 공공 서비스', screen: screen(new URL('../../img/projects/originals/ax.png', import.meta.url), 1920, 1080) },
  { slug: 'groupware', number: '05', name: '사내 그룹웨어', tags: ['HRPlatform', 'RBAC', 'HRManagement'], type: 'HR Platform', period: '2025.12 — 2026.04', role: 'Creative Development', summary: '인사관리를 종합적으로 지원하는 HR 플랫폼', screen: screen(new URL('../../img/projects/originals/groupware.png', import.meta.url), 1920, 1080) },
]

/** Prototype routes that may already have been shared; they resolve to the semantic slugs. */
export const legacyProjectSlugs: Readonly<Record<string, string>> = {
  'project-alpha': 'deurim',
  'project-beta': 'samsung-bees',
  'project-gamma': 'edk',
  'project-delta': 'moel-ax',
  'project-epsilon': 'groupware',
}

/**
 * Shared process narrative shown until a project supplies its own case study.
 * It describes how the work is approached, not project facts: keep it free of
 * outcomes, metrics or responsibilities that have not been provided.
 */
export const processCaseStudy: readonly CaseSection[] = [
  { title: 'Overview', heading: '좋은 경험은, 좋은 질문에서 시작해요.', body: '사용자의 목표와 제품의 맥락을 연결하는 과정을 보여줘요.' },
  { title: 'Problem', heading: '사용자가 멈추는 순간을 찾아요.', body: '정보가 많아질수록 다음 행동은 오히려 모호해질 수 있어요. 사용자가 무엇을 이해하고 어떤 결정을 내려야 하는지 먼저 정리해요.' },
  { title: 'Role', heading: '문제 정의부터 구현의 디테일까지.', body: '리서치 가설, 정보 구조, 화면 설계, 인터랙션 프로토타입을 연결해요. 함께 일하는 사람들과 판단의 기준을 공유하고, 구현 과정에서도 경험의 일관성을 살펴요.' },
  { title: 'Process', heading: '관찰하고, 만들고, 다시 질문해요.', body: '발견 → 정의 → 탐색 → 프로토타입 → 검증의 흐름으로 진행해요. 각 단계에서 배운 내용을 다음 판단에 반영하고, 초기 가설을 수정할 수 있는 여지를 남겨요.', process: ['Discover', 'Define', 'Explore', 'Prototype', 'Validate'] },
  { title: 'Design System', heading: '같은 언어로, 다양한 경험을 만들어요.', body: '타이포그래피와 간격, 컴포넌트의 상태를 공통 규칙으로 정리해요. 반복되는 문제에는 재사용 가능한 패턴을 두고, 새로운 맥락에도 확장할 수 있도록 설계해요.', media: true },
  { title: 'Key Decisions', heading: '더하기 전에, 무엇을 덜어낼지 생각해요.', body: '핵심 행동에 우선순위를 두고 필요한 순간에 필요한 정보를 보여줘요. 선택한 방향뿐 아니라 대안과 제약도 기록해 디자인의 판단 과정을 설명해요.' },
  { title: 'Result', heading: '결과는 근거와 함께 이야기해요.', body: '실제 성과 데이터는 아직 없어요. 출시 후 관찰한 변화와 검증된 지표를 이 자리에 담을 예정이에요.' },
  { title: 'Reflection', heading: '다음 여정에 가져갈 배움.', body: '무엇이 잘 작동했고 어떤 가설이 달라졌는지 돌아봐요. 다음 프로젝트에서 더 일찍 질문할 것, 더 세심하게 검증할 것을 정리하는 공간이에요.' },
]
