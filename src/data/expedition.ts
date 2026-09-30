export const checkpoints = [
  { id: 'base-camp', index: '00', navigation: 'HOME', name: 'BASE CAMP', altitude: 1240, progress: 0, route: 0 },
  { id: 'about', index: '01', navigation: 'ABOUT', name: 'APPROACH', altitude: 1576, progress: 0.12, route: 0.1 },
  { id: 'camp-one', index: '02', navigation: 'AI', name: 'CAMP I', altitude: 2080, progress: 0.29, route: 0.25 },
  { id: 'camp-two', index: '03', navigation: 'TOOLS', name: 'CAMP II', altitude: 2840, progress: 0.52, route: 0.5 },
  { id: 'high-camp', index: '04', navigation: 'PROJECTS', name: 'HIGH CAMP', altitude: 3620, progress: 0.75, route: 0.75 },
  { id: 'summit', index: '05', navigation: 'CONTACT', name: 'SUMMIT', altitude: 4208, progress: 1, route: 1 },
] as const

export const profile = {
  name: 'CHANGMU HEO', role: 'PRODUCT DESIGNER', location: 'SEOUL, KR',
  introduction: '복잡한 문제에서 명료한 경험으로. 구조와 인터랙션을 연결하는 프로덕트 디자이너 허창무예요.',
  focus: ['UI / UX', 'INTERACTION', 'DESIGN SYSTEMS'],
  email: 'hello@example.com',
  // Replace null with the actual profile URL when real content is available.
  socials: [{ label: 'LinkedIn', url: null }, { label: 'GitHub', url: null }] as { label: string; url: string | null }[],
  contact: '아직 그려지지 않은 다음 경험을 함께 만들어요. 좋은 질문에서 새로운 여정이 시작돼요.',
}

export const workflow = [
  { name: 'RESEARCH', label: '질문을 넓혀요', description: '인터뷰와 리서치의 맥락을 정리하고, 놓친 질문을 AI와 함께 찾아요.' },
  { name: 'STRUCTURE', label: '복잡함에 질서를 만들어요', description: '흩어진 단서를 연결해 정보 구조와 사용자 흐름의 가설을 세워요.' },
  { name: 'PROTOTYPE', label: '생각을 빠르게 경험해요', description: '여러 인터랙션을 작동하는 프로토타입으로 만들고 가능성을 비교해요.' },
  { name: 'IMPLEMENT', label: '의도를 구현으로 연결해요', description: '컴포넌트와 상태를 구체화하고, 디자인의 의도가 코드까지 이어지게 해요.' },
  { name: 'QA', label: '마지막 차이를 살펴요', description: '접근성, 예외 상태, 화면 크기를 점검해 경험의 빈틈을 줄여요.' },
]

export const inventory = [
  { name: 'Figma', category: 'DESIGN', use: '화면부터 시스템까지', detail: '생각을 화면으로 구체화하고, 함께 사용할 디자인 언어를 정리해요.' },
  { name: 'ChatGPT', category: 'AI / REASONING', use: '질문과 구조의 확장', detail: '문제의 맥락을 정리하고, 다른 관점에서 가설과 사용자 흐름을 검토해요.' },
  { name: 'Claude', category: 'AI / BUILD', use: '아이디어를 작동하게', detail: '인터랙션의 세부 상태를 탐색하고 작동하는 프로토타입으로 확인해요.' },
  { name: 'Photoshop', category: 'IMAGE', use: '이미지의 맥락과 디테일', detail: '시각적 맥락에 맞춰 이미지를 편집하고 세부 표현을 조정해요.' },
  { name: 'Illustrator', category: 'VECTOR', use: '명료한 그래픽 언어', detail: '아이콘과 그래픽을 일관된 형태와 규칙으로 만들어요.' },
  { name: 'Firefly', category: 'AI / EXPLORATION', use: '시각적 가능성 탐색', detail: '초기 콘셉트의 표현 방향을 비교하고 시각적 가설을 탐색해요.' },
  { name: 'Jira', category: 'DELIVERY', use: '실행의 우선순위', detail: '할 일과 의존 관계를 정리해 팀의 다음 행동을 명확하게 해요.' },
  { name: 'Notion', category: 'KNOWLEDGE', use: '결정의 맥락 기록', detail: '리서치부터 의사결정까지, 다시 찾을 수 있는 팀의 기억을 만들어요.' },
  { name: 'Slack', category: 'COLLABORATION', use: '연결된 협업', detail: '질문과 피드백을 연결하고 함께 만드는 과정의 간격을 줄여요.' },
]
