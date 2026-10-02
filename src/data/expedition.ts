import figmaIcon from '../../img/tools/Figma.png'
import photoshopIcon from '../../img/tools/Photoshop.png'
import illustratorIcon from '../../img/tools/Illustrator.png'
import claudeIcon from '../../img/tools/claude.png'
import chatgptIcon from '../../img/tools/ChatGPT.png'
import fireflyIcon from '../../img/tools/Firefly.png'
import jiraIcon from '../../img/tools/Jira.png'
import notionIcon from '../../img/tools/Notion.png'
import slackIcon from '../../img/tools/Slack.png'

export { checkpoints } from './checkpoints'
export { profile } from './profile'

// One working process: define before (01), divide the work during (02–05), verify after (06).
// AI takes on repetition, search and checking; the product judgements stay with the designer.
export const workflow = [
  { name: '문제와 제약 정의하기', description: ['무엇을 만들지보다 무엇을 해결할지 먼저 정리해요.', '목표와 변경 범위, 반드시 유지할 조건을 나눠 AI가 판단할 경계를 명확히 해요.'] },
  { name: '반복은 AI에게, 판단은 내가', description: ['검색과 반복 수정은 AI에게 맡기고,', '정보 위계와 사용자 경험처럼 중요한 판단에 더 집중해요.'] },
  { name: '한 화면보다 시스템을 고치기', description: ['하나의 예외만 고치지 않고,', 'AI로 같은 문제가 반복되는 패턴과 공통 규칙을 함께 찾아요.'] },
  { name: '증상이 아닌 원인을 찾기', description: ['보이는 현상만 덮기보다 원인을 먼저 추적해요.', '다음 문제를 만들지 않는 수정 방법을 선택해요.'] },
  { name: '작업에 맞는 AI 선택하기', description: ['작업의 복잡도에 따라 AI의 역할과 추론 수준도 다르게 선택해요.', '필요 이상으로 무거운 도구를 사용하지 않아요.'] },
  { name: '결과를 다시 검증하기', description: ['AI의 완료를 그대로 믿지 않고 실제 화면과 동작으로 다시 확인해요.', '구현 → 확인 → 수정 → 검증의 과정을 반복해요.'] },
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
