import type { CaseSection, ProjectDetailContent } from './caseStudy.ts'

// Portfolio draft: describes UX decisions, not measured AI accuracy or public-service outcomes.
export const axDetail: ProjectDetailContent = {
  presentation: 'editorial', summary: 'AI로 노동 관련 서류와 현장 사진을 분석해 문제와 대응 방향을 안내하는 공공 서비스',
  metadata: [['TYPE', 'AI 기반 공공 서비스'], ['PERIOD', '2026.01 — 2026.06'], ['ROLE', 'UX 기획 · UI/UX 디자인']],
  heroSlot: { label: '고용노동부 AX 대표 화면', layout: 'wide', panels: [
    { label: '메인 홈', image: { src: new URL('../../img/projects/ax/ax_main01.webp', import.meta.url).href, alt: '고용노동부 AX 메인 홈 화면', width: 1920, height: 1080 } },
    { label: '시작 전 안내', image: { src: new URL('../../img/projects/ax/ax_main02.webp', import.meta.url).href, alt: '고용노동부 AX 시작 전 안내 화면', width: 1920, height: 1080 } },
    { label: '인식 결과', image: { src: new URL('../../img/projects/ax/ax_main03.webp', import.meta.url).href, alt: '고용노동부 AX OCR 인식 결과 확인 화면', width: 1920, height: 1080 } },
    { label: '진단 결과', image: { src: new URL('../../img/projects/ax/ax_main04.webp', import.meta.url).href, alt: '고용노동부 AX 진단 결과 화면', width: 1920, height: 1080 } },
    { label: '교육 자료', image: { src: new URL('../../img/projects/ax/ax_main06.webp', import.meta.url).href, alt: '고용노동부 AX 후속 교육 자료 화면', width: 1920, height: 1080 } },
    { label: '모바일 시안', image: { src: new URL('../../img/projects/ax/ax_main07.png', import.meta.url).href, alt: '고용노동부 AX 모바일 시안 화면', width: 1118, height: 629 } },
  ] },
}

export const axCaseStudy: readonly CaseSection[] = [
  {
    layout: 'overview', title: 'Overview', tone: 'base',
    heading: '복잡한 서류와 현장 위험을 이해하도록 도와요.',
    body: '근로계약서 등 서류를 올리면 AI가 문제가 될 수 있는 부분과 필요한 대응을 안내해요. 산업 현장 사진에서는 위험 요소와 개선 방향을 알려줘, 전문 지식이 없는 사용자도 다음 행동을 판단하도록 도와요.',
  },
  {
    layout: 'statement', title: 'The Problem', tone: 'focus', spacing: 'narrative',
    heading: '잘 모르는 사람도, 문제를 스스로 확인할 수 있어야 했어요.',
    body: '근로계약서의 문제나 현장의 위험 요소는 전문 지식이 없으면 판단하기 어려워요.\n사용자가 자료를 올리는 것만으로 문제를 확인하고, 다음 행동까지 이해할 수 있는 구조가 필요했어요.',
    blocks: [{ kind: 'problems', items: [
      { title: '서류를 봐도 무엇이 문제인지 어려워요.', body: '근로계약서를 가지고 있어도 어떤 조항을 확인해야 하는지 모르면 문제를 스스로 판단하기 어려워요.' },
      { title: '결과만 알려줘서는 행동하기 어려워요.', body: '문제가 있다는 사실뿐 아니라, 어떤 부분이 왜 문제이고 무엇을 확인해야 하는지 함께 안내해야 했어요.' },
      { title: '현장의 위험도 전문 지식이 필요해요.', body: '작업 현장 사진만으로 위험 요소를 판단하기 어려워, 위험 위치와 개선 방향을 쉽게 이해할 수 있어야 했어요.' },
    ] }, { kind: 'insight', text: '전문 지식을 대신 설명하는 것보다, 사용자가 문제를 이해하고 다음 행동을 판단하게 만드는 것이 중요했어요.' }],
  },
  {
    layout: 'hierarchy', title: 'Structure', tone: 'base', spacing: 'narrative',
    heading: '자료는 달라도, 문제 확인에서 안내까지 이어져요.',
    body: '서류와 현장 사진의 분석 흐름을 나누고, 각각의 결과가 대응과 개선 가이드로 이어지도록 정리했어요.',
    blocks: [{ kind: 'flows', items: [
      { title: '서류 분석', steps: ['근로계약서 등 업로드', 'AI 분석', '문제 확인', '가이드 확인'] },
      { title: '현장 분석', steps: ['현장 사진 업로드', 'AI 분석', '위험 요소 확인', '개선 방향 확인'] },
    ] }],
  },
  {
    layout: 'narrative', title: 'AI Scenario Review', tone: 'focus', spacing: 'narrative',
    draftNote: '콘텐츠 구성 시안 · 실제 수행 경험 확인 전',
    heading: 'AI로 다양한 상황을 먼저 펼쳐보고, 화면에서 놓치는 경우를 찾았어요.',
    body: '근로계약서나 현장 진단처럼 입력에 따라 결과가 달라지는 서비스라, AI로 다양한 사용자 상황과 질문을 빠르게 확장해봤어요.\n그 결과를 바탕으로 사용자가 무엇을 문제로 느끼고, 어떤 설명과 다음 행동이 필요한지 화면 구조를 다시 점검했어요.',
    blocks: [{ kind: 'production-workflow', label: 'UX 상황 확장과 화면 검토 과정의 구성 시안', steps: [
      { title: '상황을 확장했어요', body: '근로계약 조건, 사용자 질문, 현장 위험 상황을 AI로 다양하게 펼쳐봤어요.' },
      { title: '놓치는 경우를 찾았어요', body: '결과를 이해하기 어렵거나 다음 행동이 모호해지는 상황을 비교했어요.' },
      { title: '화면에 다시 반영했어요', body: '문제 → 이유 → 다음 행동이 자연스럽게 읽히는지 검토하고 화면 구조를 보완했어요.' },
    ], example: {
      label: '예시',
      title: '근무시간은 입력됐지만 휴게시간이 빠진 계약서',
      body: '이 흐름을 기준으로 결과 화면에서 사용자가 무엇을 먼저 보고, 어떤 설명이 필요한지 점검했어요.',
      sequence: ['문제 발견', '왜 확인해야 하는지', '다음 행동'],
    } }],
    supporting: 'AI를 정답을 만드는 도구보다, 다양한 상황을 빠르게 펼쳐보는 검토 도구로 활용했어요. 여러 케이스를 비교하면서 화면에서 놓칠 수 있는 설명과 예외를 찾고, 최종 UX 판단은 직접 했어요.',
  },
  {
    layout: 'narrative', title: 'AI Workflow', tone: 'elevated', spacing: 'narrative',
    heading: '위험 상황을 설명할 이미지는 AI로 제작했어요.',
    body: '서비스의 사진 분석 기능과 별개로, 설명용 작업 환경과 위험 상황 이미지를 만드는 데 AI를 활용했어요.\n전달할 위험 요소를 직접 정하고, 장면에서 명확하게 읽히는지 검토했어요.',
    blocks: [{ kind: 'image-workflow', steps: [
      { title: '위험 상황을 정했어요', body: '어떤 작업 환경과 위험 요소를 보여줄지 직접 정했어요.' },
      { title: '장면을 구체화했어요', body: 'AI가 이해할 수 있도록 작업 상황과 위험 요소를 구체적으로 정리했어요.' },
      { title: 'AI로 이미지를 만들었어요', body: '정리한 상황을 바탕으로 여러 작업 환경 이미지를 생성했어요.' },
      { title: '직접 검토했어요', body: '위험 요소가 명확하게 보이는지 확인하고 사용할 이미지를 골랐어요.' },
    ], images: [
      { label: '작업 환경 및 위험 상황 01', image: { src: new URL('../../img/projects/ax/workflow_01.png', import.meta.url).href, alt: '지게차 주변에서 상자가 떨어지는 위험 상황 생성 이미지', width: 502, height: 282 } },
      { label: '작업 환경 및 위험 상황 02', image: { src: new URL('../../img/projects/ax/workflow_02.png', import.meta.url).href, alt: '컨베이어와 로봇 팔 주변의 작업 위험을 표현한 생성 이미지', width: 502, height: 282 } },
      { label: '작업 환경 및 위험 상황 03', image: { src: new URL('../../img/projects/ax/workflow_03.png', import.meta.url).href, alt: '선반의 상자가 작업자 쪽으로 떨어지는 위험 상황 생성 이미지', width: 502, height: 282 } },
      { label: '작업 환경 및 위험 상황 04', image: { src: new URL('../../img/projects/ax/workflow_04.png', import.meta.url).href, alt: '컨베이어에서 상자를 취급하는 작업 환경 생성 이미지', width: 502, height: 277 } },
      { label: '작업 환경 및 위험 상황 05', image: { src: new URL('../../img/projects/ax/workflow_05.png', import.meta.url).href, alt: '건설 현장에서 벽돌을 쌓는 작업 환경 생성 이미지', width: 502, height: 289 } },
      { label: '작업 환경 및 위험 상황 06', image: { src: new URL('../../img/projects/ax/workflow_06.png', import.meta.url).href, alt: '산업 설비 옆에서 점검하는 작업 환경 생성 이미지', width: 502, height: 289 } },
    ] }, { kind: 'supporting', text: '직접 정의한 위험 상황을 장면으로 구체화하고 이미지를 반복 제작하는 데 AI를 활용했어요. 설명 목적에 맞는지 직접 검토하며 프롬프트와 결과를 다듬었어요.' }],
  },
  {
    layout: 'split', title: 'Working Conditions', tone: 'elevated',
    heading: '복잡한 근로 조건도, 항목을 따라 입력할 수 있게 했어요.',
    body: '요일별 근무시간과 휴게시간을 단계적으로 입력하도록 구성했어요.\n선택한 조건에 필요한 항목만 보여줘, 쉽게 정보를 채울 수 있게 했어요.',
    blocks: [{ kind: 'rows', items: [
      { title: '요일별로 나눠 입력해요', body: '근무 여부와 시간을 요일별로 설정해 복잡한 조건을 한 번에 다루지 않게 했어요.' },
      { title: '선택한 조건만 보여줘요', body: '휴게시간 포함 여부처럼 선택에 따라 필요한 입력 항목만 이어서 보여줘요.' },
      { title: '필요한 서류까지 함께 확인해요', body: '근무 조건 입력과 함께 준비해야 할 서류도 빠뜨리지 않도록 확인할 수 있게 했어요.' },
    ] }],
    imageSlot: { label: '요일별 근무 여부·근로시간·업무 시작과 종료·휴게시간·관련 서류 구비 여부를 입력하는 화면', layout: 'wide', image: {
      src: new URL('../../img/projects/ax/conditions_01.png', import.meta.url).href,
      alt: '요일별 근무 여부와 근로시간, 업무 시작·종료, 휴게시간, 관련 서류 구비 여부를 입력하는 화면',
      width: 1032,
      height: 1126,
    } },
  },
  {
    layout: 'split', title: 'Risk Analysis', tone: 'base',
    heading: '현장의 위험과 개선 방향을 함께 읽게 했어요.',
    body: '산업 현장 사진을 올리면 AI가 위험 요소를 분석해요. 사용자가 사진 속 어느 부분이 위험한지 이해하고, 무엇을 개선해야 하는지 확인하도록 안내를 구성했어요.',
    imageSlot: { label: '산업 현장 사진의 위험 요소와 개선 방향 안내 화면', layout: 'split' },
  },
  {
    layout: 'reflection', title: 'Reflection', tone: 'base', spacing: 'narrative', reflectionSummary: true,
    heading: '분석의 끝은, 사용자가 다음 행동을 이해하는 지점이에요.',
    blocks: [{ kind: 'rows', items: [
      { title: '01', body: '서류에서는 확인할 조항을, 현장 사진에서는 위험 요소를 이해하도록 돕는 것이 출발점이었어요.' },
      { title: '02', body: '문제 확인과 대응·개선 안내를 연결해야 다음 행동을 판단할 수 있어요.' },
      { title: '03', body: 'AI 분석을 사용자가 이해할 수 있는 안내로 정리하는 것이 화면 설계의 기준이었어요.' },
    ] }],
    process: ['자료를 올리고', '문제를 확인하고', '가이드를 읽어요'],
    closing: 'AI의 분석이 사용자의 이해와 판단으로 이어지도록 설계했어요.',
  },
]
