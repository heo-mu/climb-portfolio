import type { CaseSection, ProjectDetailContent } from './caseStudy.ts'

// Editorial draft from the HR-platform brief; no unverified efficiency or adoption claims.
export const groupwareDetail: ProjectDetailContent = {
  presentation: 'editorial', summary: '반복적인 인사 업무와 권한·상태를 하나의 흐름으로 연결하는 HR 플랫폼',
  metadata: [['TYPE', '사내 인사관리 플랫폼'], ['PERIOD', '2025.12 — 2026.04'], ['ROLE', 'UI/UX 디자인 · UX 설계 · 디자인 시스템 구축']],
  heroSlot: { label: '사내 그룹웨어 대표 화면', layout: 'wide', panels: [
    { label: '사용자 홈', image: { src: new URL('../../img/projects/groupware/groupware_user01.png', import.meta.url).href, alt: '사내 그룹웨어 사용자 홈 화면', width: 1920, height: 911 } },
    { label: '내 근태', image: { src: new URL('../../img/projects/groupware/groupware_user03.png', import.meta.url).href, alt: '사내 그룹웨어 내 근태 확인 화면', width: 1920, height: 911 } },
    { label: '신청 · 요청', image: { src: new URL('../../img/projects/groupware/groupware_user04.png', import.meta.url).href, alt: '사내 그룹웨어 신청 및 요청 화면', width: 1920, height: 911 } },
    { label: '관리자 현황', image: { src: new URL('../../img/projects/groupware/groupware_admin01.png', import.meta.url).href, alt: '사내 그룹웨어 관리자 현황 화면', width: 1920, height: 911 } },
    { label: '조직 관리', image: { src: new URL('../../img/projects/groupware/groupware_admin04.png', import.meta.url).href, alt: '사내 그룹웨어 조직 관리 화면', width: 1920, height: 911 } },
    { label: '조직 근태', image: { src: new URL('../../img/projects/groupware/groupware_admin05.png', import.meta.url).href, alt: '사내 그룹웨어 조직 근태 관리 화면', width: 1920, height: 911 } },
    { label: '회원 상세', image: { src: new URL('../../img/projects/groupware/groupware_admin03.png', import.meta.url).href, alt: '사내 그룹웨어 관리자 회원 상세 화면', width: 1920, height: 911 } },
  ] },
}

export const groupwareCaseStudy: readonly CaseSection[] = [
  {
    layout: 'overview', title: 'Overview', tone: 'base',
    heading: '매일 하는 일을, 망설임 없이 이어가게 했어요.',
    body: '직원과 관리자가 인사 업무를 한 시스템에서 처리하는 내부 플랫폼이에요. 새로운 사용법을 익히기보다 현재 상태와 해야 할 일을 빠르게 알 수 있는 흐름에 집중했어요.',
  },
  {
    layout: 'narrative', title: 'Roles', tone: 'focus', spacing: 'narrative',
    heading: '역할과 동작의 기준으로, 복잡한 업무를 정리했어요.',
    body: '누가 어떤 정보를 보고 처리할 수 있는지, 업무 상태가 어떻게 이어지는지 먼저 정리했어요. 반복되는 조작도 같은 규칙으로 맞춰, 디자인과 개발이 화면을 다르게 해석하지 않도록 기준을 만들었어요.',
    blocks: [
      { kind: 'compact-decisions', items: [
        { title: '사용자', body: '내 인사 정보와 근태를 확인하고, 신청부터 결재 결과 확인까지 이어지는 업무를 기준으로 묶었어요.' },
        { title: '관리자', body: '조직과 구성원, 권한을 관리하는 범위를 구분하고, 운영에 필요한 정보와 처리할 일을 정리했어요.' },
        { title: '공통 상태', body: '대기·승인·반려·완료의 의미와 다음 행동을 맞춰, 어느 화면에서든 같은 기준으로 상태를 읽게 했어요.' },
      ] },
      { kind: 'insight', label: '핵심 정리', text: '화면이 달라져도, 조작하는 방식은 익숙하게 이어지도록 했어요.', supporting: '모달의 열기·닫기, 드롭다운 선택, 토스트 안내, 탭 전환, 상태 표시와 페이지 이동 규칙을 디자인 시스템에 연결했어요. 반복되는 동작을 함께 정리해, 화면마다 사용 방식이 달라지지 않도록 했어요.' },
    ],
  },
  {
    layout: 'structure', title: 'Workflow', tone: 'elevated', spacing: 'narrative',
    heading: '화면보다, 일이 끝나는 순서를 먼저 봤어요.',
    body: '요청을 올리는 사람과 확인하는 사람은 다르지만 하나의 업무를 이어가요. 화면을 따로 설계하기 전에 요청부터 완료까지의 상태와 역할을 연결했어요.',
    lead: { kind: 'flows', items: [{ title: '인사 업무가 이어지는 흐름', steps: ['요청', '확인', '처리', '승인', '완료'] }] },
    imageSlot: { label: '요청 등록부터 확인·처리·승인·완료까지 이어지는 업무 화면', layout: 'wide' },
  },
  {
    layout: 'narrative', title: 'The Problem', tone: 'base',
    heading: '같은 화면에서도, 가능한 일이 달랐어요.',
    blocks: [{ kind: 'rows', items: [
      { title: '역할이 달라요.', body: '직원은 본인의 업무를 처리하고, 관리자는 여러 요청과 구성원을 함께 살펴봐요.' },
      { title: '상태가 달라요.', body: '작성 중인지, 승인을 기다리는지, 반려됐는지에 따라 다음 행동도 달라져요.' },
      { title: '업무가 반복돼요.', body: '비슷한 내용을 매번 하나씩 확인하고 처리하면 같은 이동을 반복하게 돼요.' },
    ] }],
  },
  {
    layout: 'comparison', title: 'Permissions', tone: 'focus',
    heading: '각자의 역할에 맞는 정보와 행동을 보여줘요.',
    body: '직원과 관리자의 화면을 완전히 다른 제품처럼 만들지는 않았어요. 공통된 화면 문법 안에서 볼 수 있는 범위와 처리할 수 있는 행동을 구분했어요.',
    blocks: [{ kind: 'comparison', columns: [
      { title: '직원', items: ['내 정보와 요청 상태를 확인해요.', '필요한 내용을 작성하고 제출해요.', '반려 사유를 확인하고 보완해요.'] },
      { title: '관리자', items: ['담당 범위의 직원과 요청을 확인해요.', '처리할 항목의 상태를 함께 살펴봐요.', '가능한 업무를 처리하고 결과를 남겨요.'] },
    ] }],
    imageSlot: { label: '같은 직원·조직 정보를 역할별로 확인하고 관리하는 화면', layout: 'wide' },
  },
  {
    layout: 'split', title: 'Efficiency', tone: 'elevated',
    heading: '반복할수록, 조작은 덜 필요하게 했어요.',
    body: '반복 업무에서는 어떤 항목을 선택했는지와 무엇을 한 번에 처리할 수 있는지가 중요해요. 다중 선택과 일괄 처리를 가까이 두되, 실행 전 대상과 가능한 범위를 확인하도록 정리했어요.',
    blocks: [{ kind: 'rows', items: [
      { title: '대상을 먼저 확인해요.', body: '선택한 항목과 처리할 범위를 분명하게 보여줘요.' },
      { title: '처리 결과를 함께 봐요.', body: '반영된 상태와 다시 확인할 항목을 구분해요.' },
    ] }],
    imageSlot: { label: '직원·업무 목록의 다중 선택과 일괄 처리 전 대상 확인 화면', layout: 'split' },
  },
  {
    layout: 'hierarchy', title: 'States', tone: 'base',
    heading: '상태를 읽으면, 다음 행동이 보이게 했어요.',
    body: '색만으로 업무 상태를 구분하지 않고 의미가 드러나는 이름과 행동을 함께 뒀어요. 대기와 완료를 구분하고, 반려된 항목은 이유와 수정할 위치까지 이어지도록 했어요.',
    blocks: [{ kind: 'rows', items: [
      { title: '대기 · 확인 중', body: '처리를 기다리는 상태와 현재 확인할 정보를 구분해요.' },
      { title: '반려 · 보완 필요', body: '왜 돌아왔는지와 무엇을 고쳐야 하는지 함께 보여줘요.' },
      { title: '승인 · 완료', body: '처리된 결과와 이력을 확인하고 중복 행동을 줄여요.' },
    ] }],
    imageSlot: { label: '현재 상태·반려 사유·가능한 행동이 함께 보이는 업무 테이블', layout: 'wide' },
  },
  {
    layout: 'decisions', title: 'Key Decisions', tone: 'focus',
    heading: '반복되는 판단을, 화면이 먼저 도와줘요.',
    blocks: [{ kind: 'compact-decisions', items: [
      { title: '반복 조작을 줄여요.', body: '같은 일을 여러 번 처리할 때 선택과 실행을 한 흐름으로 연결했어요.' },
      { title: '상태 옆에 행동을 둬요.', body: '현재 상태를 읽은 자리에서 다음에 할 일을 찾을 수 있게 했어요.' },
      { title: '권한으로 혼동하지 않게', body: '볼 수 있는 정보와 실행할 수 있는 기능의 차이를 명확하게 정리했어요.' },
    ] }],
  },
  {
    layout: 'comparison', title: 'Design System', tone: 'elevated',
    heading: '업무가 달라도, 사용하는 방식은 같게 했어요.',
    body: '직원 관리와 승인 업무가 같은 테이블·폼·상태·행동 문법을 사용하도록 정리했어요. 한 화면에서 익힌 사용법을 다음 업무에서도 그대로 쓸 수 있게 하는 것이 기준이었어요.',
    blocks: [{ kind: 'comparison', columns: [
      { title: '확인하는 방식', items: ['목록에서 같은 순서로 정보를 읽어요.', '필터로 대상 범위를 좁혀요.', '상태 용어를 화면마다 동일하게 써요.'] },
      { title: '처리하는 방식', items: ['입력과 오류 안내 위치를 통일해요.', '주요 행동과 보조 행동을 구분해요.', '변경 후 결과를 같은 방식으로 알려줘요.'] },
    ] }],
  },
  {
    layout: 'narrative', title: 'AI Workflow', tone: 'focus', spacing: 'narrative',
    heading: '요구사항에서 실제 시안까지, AI를 제작 과정에 연결했어요.',
    body: '요구사항부터 와이어프레임, 실제 Figma 시안까지 하나의 제작 흐름으로 연결했어요. 직접 정의한 디자인 시스템을 기준으로 컴포넌트와 스타일을 일관되게 적용했어요.',
    blocks: [
      { kind: 'production-workflow', steps: [
        { title: '요구사항 정리', body: '기능, 사용자 역할, 상태와 예외 조건을 먼저 정리했어요.' },
        { title: 'Claude로 화면 구조 설계', body: 'Claude를 활용해 요구사항을 화면 단위와 정보 구조로 빠르게 분해했어요.' },
        { title: 'Figma MCP로 와이어프레임 제작', body: 'Claude에 Figma MCP를 연결하고, 정리한 구조를 실제 Figma 와이어프레임으로 만들었어요.' },
        { title: 'Design System 적용', body: '직접 정의한 컴포넌트와 스타일, UI 규칙을 기준으로 Claude가 일관된 화면을 만들게 했어요.' },
        { title: '직접 검토해 시안 완성', body: '업무 흐름과 정보 위계, 상태, 컴포넌트 사용과 일관성을 직접 확인하고 수정해 최종 시안을 완성했어요.' },
      ] },
      { kind: 'supporting', text: '화면 구조를 정리하고 와이어프레임과 시안을 반복 제작하는 데 Claude와 Figma MCP를 활용했어요. 업무 흐름과 정보 위계, 상태와 최종 UI는 직접 검토했어요.' },
      { kind: 'insight', text: '반복되는 화면 제작은 AI와 나누고, 업무 흐름과 사용성에 대한 판단에 더 집중했어요.', supporting: '요구사항부터 Figma 시안까지 하나의 흐름으로 연결하면서, 디자인 시스템을 더 일관되게 적용하고 수정 속도도 높일 수 있었어요.' },
    ],
  },
  {
    layout: 'reflection', title: '핵심 시사점', tone: 'base', spacing: 'narrative', reflectionSummary: true,
    heading: '업무 제품에서는, 예측할 수 있는 경험이 중요해요.',
    blocks: [{ kind: 'rows', items: [
      { title: '01', body: '역할과 상태의 차이를 이해해야 사용자가 할 일을 분명하게 보여줄 수 있었어요.' },
      { title: '02', body: '일괄 처리의 편리함만큼 처리 대상과 결과를 확인하는 과정도 중요했어요.' },
      { title: '03', body: '새로운 인터랙션보다 일관된 규칙이 반복 업무에 도움이 되었어요.' },
    ] }],
    process: ['상태를 읽고', '할 일을 찾고', '결과를 확인해요'],
    closing: '익숙한 규칙 안에서 일을 끝낼 수 있게 만드는 것이 업무 UX의 기준이 되었어요.',
  },
]
