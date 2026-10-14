import type { CaseSection, ProjectDetailContent } from './caseStudy.ts'

// Editorial draft from the HR-platform brief; no unverified efficiency or adoption claims.
export const groupwareDetail: ProjectDetailContent = {
  presentation: 'editorial', summary: '구성원의 일상적인 인사 업무와 관리자의 운영 업무를 하나의 시스템에서 관리하는 사내 인사관리 서비스예요.',
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
    heading: '직원의 일상 업무와 조직 운영을 한곳에 담았어요.',
    body: '직원은 자신의 근태·신청·공지를 확인하고, 관리자는 구성원·조직·근태를 운영하는 기업용 업무 시스템이에요. 같은 인사 정보를 각자의 업무와 관리 범위에 맞게 볼 수 있도록 구성했어요.',
  },
  {
    layout: 'statement', title: 'The Problem', tone: 'focus', spacing: 'narrative',
    heading: '같은 인사 정보라도, 역할에 따라 필요한 화면이 달랐어요.',
    body: '직원은 자신의 업무를 처리하고, 관리자는 구성원과 조직 전체를 살펴봐야 했어요. 서로 다른 조회·관리 범위를 구분하면서 반복 업무의 사용 방식은 일관되게 맞췄어요.',
    blocks: [{ kind: 'problems', items: [
      { title: '사용자와 관리자의 업무가 달랐어요.', body: '직원에게는 자신의 근태와 신청이, 관리자에게는 조직 전체의 현황과 운영이 중요했어요.' },
      { title: '같은 데이터도 보는 범위가 달랐어요.', body: '개인은 자기 정보를 확인하지만, 관리자는 구성원과 조직 단위로 더 넓은 범위를 관리해야 했어요.' },
      { title: '반복되는 인사 업무가 많았어요.', body: '근태·신청·조직·회원 관리처럼 반복되는 업무를 일관된 방식으로 사용할 수 있어야 했어요.' },
    ] }, { kind: 'insight', text: '역할에 맞는 정보 범위를 나누고, 반복되는 업무는 같은 방식으로 사용하게 했어요.' }],
  },
  {
    layout: 'narrative', title: 'AI Workflow', tone: 'base', spacing: 'narrative',
    heading: '요구사항에서 실제 시안까지, AI를 제작 과정에 연결했어요.',
    body: '요구사항부터 와이어프레임, 실제 Figma 시안까지 하나의 제작 흐름으로 연결했어요. 직접 정의한 디자인 시스템을 기준으로 컴포넌트와 스타일을 일관되게 적용했어요.',
    blocks: [
      { kind: 'production-workflow', steps: [
        { title: '요구사항을 구조화했어요', body: '요구사항을 AI와 함께 화면·기능 단위로 정리했어요.' },
        { title: '화면 구조를 만들었어요', body: 'Claude로 사용자 흐름과 와이어프레임 방향을 빠르게 잡았어요.' },
        { title: 'Figma로 연결했어요', body: 'Figma MCP와 디자인 시스템을 연결해 실제 화면으로 옮겼어요.' },
        { title: '직접 검토하고 다듬었어요', body: '정보 위계·업무 흐름·상태를 직접 확인하며 최종 UI를 보정했어요.' },
      ] },
      { kind: 'supporting', text: '화면 구조를 정리하고 와이어프레임과 시안을 반복 제작하는 데 Claude와 Figma MCP를 활용했어요. 업무 흐름과 정보 위계, 상태와 최종 UI는 직접 검토했어요.' },
      { kind: 'insight', text: '반복되는 화면 제작은 AI와 나누고, 업무 흐름과 사용성에 대한 판단에 더 집중했어요.', supporting: '요구사항부터 Figma 시안까지 하나의 흐름으로 연결하면서, 디자인 시스템을 더 일관되게 적용하고 수정 속도도 높일 수 있었어요.' },
    ],
  },
  {
    layout: 'narrative', title: 'Structure', tone: 'elevated', spacing: 'narrative',
    heading: '직원은 내 업무를, 관리자는 조직의 업무를 살펴봐요.',
    body: '같은 인사 데이터를 사용하더라도 직원은 자기 정보 중심으로, 관리자는 구성원과 조직 단위로 조회·관리하도록 나눴어요.',
    blocks: [{ kind: 'rows', items: [
      { title: '사용자 → 내 업무', body: '내 근태 · 신청/요청 · 공지 · 내 정보' },
      { title: '관리자 → 조직 운영', body: '현황 · 회원 관리 · 조직 관리 · 조직 근태' },
    ] }],
  },
  {
    layout: 'narrative', title: 'Key Screens', tone: 'base', spacing: 'narrative',
    heading: '개인의 기록과 조직 현황을 각자의 업무에 맞게 보여줘요.',
    body: '직원 화면에서는 내 근태를 확인하고, 관리자 화면에서는 구성원들의 근태를 함께 살펴봐요. 확인해야 할 정보의 범위에 맞춰 화면을 구성했어요.',
    imageSlot: { label: '직원의 내 근태와 관리자의 조직 근태 비교', layout: 'role-comparison', panels: [
      { ...groupwareDetail.heroSlot!.panels![1], roleLabel: 'USER', label: '사용자 화면' },
      { ...groupwareDetail.heroSlot!.panels![5], roleLabel: 'ADMIN', label: '관리자 화면' },
    ] },
  },
  {
    layout: 'narrative', title: 'States', tone: 'elevated', spacing: 'narrative',
    heading: '업무가 어디까지 처리됐는지 바로 읽히게 했어요.',
    body: '신청 목록의 상태와 근태 현황을 이름과 위치로 구분했어요. 반복해서 확인하는 정보는 같은 표현을 유지해, 처리 여부를 빠르게 파악하도록 했어요.',
    blocks: [{ kind: 'rows', items: [
      { title: '신청 상태를 구분해요.', body: '대기·승인·반려·임시저장을 탭과 목록의 상태 표시에서 같은 이름으로 보여줘요.' },
      { title: '근태 현황에서 기록으로 이어져요.', body: '정상출근·미출근·지각 등 현황을 확인하고, 목록에서 구성원별 기록과 상태를 살펴봐요.' },
    ] }],
    imageSlot: groupwareDetail.heroSlot!.panels![2],
  },
  {
    layout: 'comparison', title: 'Design System', tone: 'focus', spacing: 'narrative',
    heading: '반복되는 업무 화면에 같은 UI 규칙을 적용했어요.',
    body: '테이블·폼·모달·상태·버튼·필터·내비게이션을 공통 기준으로 정리했어요. 직원과 관리자 화면에서도 익숙한 방식으로 정보를 찾고 입력하도록 구성했어요.',
    blocks: [{ kind: 'comparison', columns: [
      { title: '정보를 찾는 방식', items: ['내비게이션으로 업무 영역을 구분해요.', '필터와 테이블로 필요한 정보를 찾아요.', '상태는 같은 명칭과 표현으로 읽게 해요.'] },
      { title: '정보를 입력하고 확인하는 방식', items: ['폼과 버튼을 같은 기준으로 배치해요.', '모달 등 상세 정보를 확인하는 UI를 일관되게 사용해요.', '반복 화면에 공통 컴포넌트를 적용해요.'] },
    ] }],
  },
  {
    layout: 'reflection', title: 'Reflection', tone: 'base', spacing: 'narrative', reflectionSummary: true,
    heading: '역할에 맞는 범위와 익숙한 사용 방식이 중요했어요.',
    blocks: [{ kind: 'rows', items: [
      { title: '01', body: '역할이 다르면 우선순위도 달라졌어요. 직원은 자신의 업무 처리에, 관리자는 전체 현황 파악에 집중할 수 있어야 했어요.' },
      { title: '02', body: '반복되는 업무일수록 일관성이 중요했어요. 같은 패턴을 반복해 화면이 바뀌어도 업무를 익히기 쉽게 했어요.' },
      { title: '03', body: '관리 화면도 사용자의 업무 도구였어요. 많은 정보보다 실제 처리 순서와 관리 범위를 명확하게 했어요.' },
    ] }],
    process: ['내 업무를 찾고', '상태를 확인하고', '필요한 일을 처리해요'],
    closing: '각자의 업무 범위 안에서, 익숙한 방식으로 일을 이어가도록 설계했어요.',
  },
]
