import figmaIcon from '../../img/tools/Figma.png'
import photoshopIcon from '../../img/tools/Photoshop.png'
import illustratorIcon from '../../img/tools/Illustrator.png'
import claudeIcon from '../../img/tools/claude.png'
import chatgptIcon from '../../img/tools/ChatGPT.png'
import fireflyIcon from '../../img/tools/Firefly.png'
import jiraIcon from '../../img/tools/Jira.png'
import notionIcon from '../../img/tools/Notion.png'
import slackIcon from '../../img/tools/Slack.png'

export const checkpoints = [
  { id: 'base-camp', index: '00', navigation: 'Home', name: 'Base Camp', altitude: 1240, progress: 0, route: 0 },
  { id: 'about', index: '01', navigation: 'About', name: 'Approach', altitude: 1887, progress: 0.06, route: 0.1 },
  { id: 'camp-one', index: '02', navigation: 'AI Workflow', name: 'Camp I', altitude: 2858, progress: 0.29, route: 0.25 },
  { id: 'camp-two', index: '03', navigation: 'Tools', name: 'Camp II', altitude: 4321, progress: 0.52, route: 0.5 },
  { id: 'high-camp', index: '04', navigation: 'Projects', name: 'High Camp', altitude: 5824, progress: 0.75, route: 0.75 },
  { id: 'summit', index: '05', navigation: 'Contact', name: 'Summit', altitude: 6956, progress: 1, route: 1 },
] as const

export const profile = {
  name: 'Changmu Heo', role: 'Product Designer',
  email: 'gjckdan156@naver.com',
  phone: '010-8524-6956',
  // Replace null with the actual profile URL when real content is available.
  socials: [{ label: 'LinkedIn', url: null }, { label: 'GitHub', url: null }] as { label: string; url: string | null }[],
}

export const workflow = [
  { name: '요구사항 나누기', description: ['기획을 기능·사용자·상태·예외로 나눠요.', '화면에 앞서 풀어야 할 문제를 정리해요.'] },
  { name: '화면의 차이 찾기', description: ['비슷한 화면의 정책·권한·상태를 비교해요.', '중복을 줄이고 필요한 차이에 집중해요.'] },
  { name: '반복 제작 줄이기', description: ['반복 작업은 코드와 AI로 빠르게 만들어요.', '아낀 시간으로 더 많은 상태를 확인해요.'] },
  { name: '비주얼 다듬기', description: ['이미지와 아이콘은 AI로 빠르게 탐색해요.', '제품의 톤과 실제 화면에 맞게 다듬어요.'] },
]

export const inventory = [
  { name: 'Figma', group: 'DESIGN', icon: figmaIcon, use: '화면 · 시스템 설계' },
  { name: 'Photoshop', group: 'DESIGN', icon: photoshopIcon, use: '이미지 보정 · 리터칭' },
  { name: 'Illustrator', group: 'DESIGN', icon: illustratorIcon, use: '아이콘 · 벡터 그래픽' },
  { name: 'ChatGPT', group: 'AI', icon: chatgptIcon, use: '정보 정리 · 대안 탐색' },
  { name: 'Claude', group: 'AI', icon: claudeIcon, use: '요구사항 · 반복 작업 정리' },
  { name: 'Adobe Firefly', group: 'AI', icon: fireflyIcon, use: '비주얼 시안 탐색' },
  { name: 'Jira', group: 'COLLABORATION', icon: jiraIcon, use: '이슈 · 수정 내역 관리' },
  { name: 'Notion', group: 'COLLABORATION', icon: notionIcon, use: '프로젝트 · 작업 기록' },
  { name: 'Slack', group: 'COLLABORATION', icon: slackIcon, use: '기획 · 개발 커뮤니케이션' },
]
