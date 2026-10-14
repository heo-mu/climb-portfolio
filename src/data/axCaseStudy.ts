import type { CaseSection, ProjectDetailContent } from './caseStudy.ts'

// Describes UX decisions, not measured AI accuracy or public-service outcomes.
export const axDetail: ProjectDetailContent = {
  presentation: 'editorial', summary: '사진과 서류를 올리면, AI가 위험 요소와 노동법 준수 여부를 확인해주는 자율점검 서비스예요.',
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
    heading: '현장 사진과 노동 서류로,\n두 가지 자율점검을 시작해요.',
    body: '산재위험요소 자율점검은 현장 사진에서 위험요소를 찾아 리포트와 관련 사고 사례 영상을 제공해요.\n기초노동질서 자율점검은 근로계약서 등 서류의 노동법 준수 여부를 확인하고 참고 가이드를 안내해요.',
  },
  {
    layout: 'hierarchy', title: 'Structure', tone: 'elevated', spacing: 'narrative',
    heading: '사진은 사고 사례로, 서류는 참고 가이드로 이어져요.',
    body: '위험요소 리포트에는 관련 실제 사고 사례 영상을 추천해, 발견된 위험이 어떤 사고로 이어질 수 있는지 이해하도록 했어요.\n서류는 개인정보 노출을 최소화한 상태에서 최신 노동법 기준으로 자동 판독해요. 진단 결과는 개별 사건의 법률 자문이 아닌 자율점검용 참고 가이드로 안내해요.',
    blocks: [{ kind: 'flows', items: [
      { title: '산재위험요소 자율점검', steps: ['현장 사진 업로드', 'AI 위험요소 식별', '위험요소 리포트', '관련 사고 사례 영상'] },
      { title: '기초노동질서 자율점검', steps: ['근로 관련 서류 업로드', 'AI 자동 판독', '노동법 준수 여부 확인', '참고 가이드'] },
    ] }],
  },
  {
    layout: 'statement', title: 'The Problem', tone: 'focus', spacing: 'narrative',
    heading: '전문 지식이 없어도, 스스로 문제를 확인할 수 있어야 했어요.',
    body: '현장의 위험 요소와 노동법 준수 여부는 전문 지식이 없으면 판단하기 어려워요.\n사진이나 서류를 올리는 것만으로 문제를 찾고, 무엇을 확인해야 하는지 이해할 수 있게 설계했어요.',
    blocks: [{ kind: 'problems', items: [
      { title: '무엇이 위험한지 판단하기 어려워요.', body: '현장 사진을 봐도 어떤 요소가 사고로 이어질 수 있는지 일반 사용자가 직접 찾기는 어려워요.' },
      { title: '서류가 있어도 잘못된 부분을 알기 어려워요.', body: '근로계약서를 가지고 있어도 노동법 기준으로 어떤 항목을 확인해야 하는지 알기 어려워요.' },
      { title: '결과 다음의 행동까지 필요해요.', body: '문제 여부뿐 아니라 관련 사고 사례와 확인할 내용, 개선 방향까지 함께 안내해야 했어요.' },
    ] }, { kind: 'insight', text: '문제를 찾는 데서 끝내지 않고, 왜 확인해야 하는지와 다음 행동까지 이해하도록 돕는 것이 중요했어요.' }],
  },
  {
    layout: 'narrative', title: 'AI Review', tone: 'elevated', spacing: 'narrative',
    heading: 'AI로 다양한 상황을 먼저 펼쳐보고, 놓치는 경우를 점검했어요.',
    body: '입력 조건에 따라 결과가 달라지는 서비스라, AI로 다양한 사용자 상황을 빠르게 확장했어요.\n그 과정에서 필요한 설명과 다음 행동이 빠지지 않았는지 화면 흐름을 점검했어요.',
    blocks: [{ kind: 'production-workflow', label: 'AI를 활용한 UX 상황 확장과 화면 검토 과정', steps: [
      { title: '상황 확장', body: '입력 조건에 따른 사용자 상황과 질문을 AI로 확장했어요.' },
      { title: '예외 확인', body: '누락된 조건이나 결과를 이해하기 어려운 경우를 확인했어요.' },
      { title: '화면 반영', body: '필요한 설명과 다음 행동이 이어지도록 화면 흐름을 정리했어요.' },
    ], example: {
      label: '예시',
      title: '근무시간은 입력됐지만 휴게시간이 빠진 계약서',
      body: '이 사례를 기준으로 사용자가 문제를 발견한 뒤 무엇을 확인하고, 다음에 무엇을 해야 하는지 자연스럽게 이어지는지 점검했어요.',
      sequence: ['문제 발견', '확인 이유', '다음 행동'],
    } }],
    supporting: 'AI를 정답을 만드는 도구보다, 다양한 상황과 예외를 빠르게 펼쳐보는 검토 도구로 활용했어요. 최종 UX 판단은 직접 했어요.',
  },
  {
    layout: 'narrative', title: 'AI Workflow', tone: 'base', spacing: 'narrative',
    heading: '위험 상황을 설명할 이미지는 AI로 제작했어요.',
    body: '서비스가 제공하는 위험요소 식별·노동법 판독과 별개로, 제작 과정에서 설명용 위험 상황 이미지를 만드는 데 AI를 활용했어요.\n실제 사고 사례 영상과도 구분되는 생성 이미지로, 전달할 위험 요소를 직접 정하고 장면에서 명확하게 읽히는지 검토했어요.',
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
    body: '기초노동질서 자율점검에 필요한 근무시간과 휴게시간을 요일별로 입력하게 했어요.\n선택한 조건에 필요한 항목만 보여줘, AI 판독에 필요한 정보를 빠뜨리지 않도록 했어요.',
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
    layout: 'reflection', title: 'Reflection', tone: 'base', spacing: 'narrative', reflectionSummary: true,
    heading: '분석의 끝은, 사용자가 다음 행동을 이해하는 지점이에요.',
    blocks: [{ kind: 'rows', items: [
      { title: '01', body: '위험요소 리포트에 실제 사고 사례를 연결해, 왜 위험한지 이해하도록 돕는 것이 중요했어요.' },
      { title: '02', body: '노동법 판독 결과는 법률 자문이 아닌 참고 가이드로 전달하고, 사용자가 확인할 내용을 분명히 해야 했어요.' },
      { title: '03', body: '서비스의 AI 분석과 제작 과정의 AI 활용을 구분하고, 각 결과를 어떤 안내로 보여줄지 직접 판단했어요.' },
    ] }],
    process: ['사진·서류를 올리고', '위험·문제를 확인하고', '사례·가이드를 살펴봐요'],
    closing: '분석 결과를 알려주는 데서 끝내지 않고, 이유와 다음 행동을 이해하도록 설계했어요.',
  },
]
