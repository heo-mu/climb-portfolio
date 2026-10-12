/**
 * Korean UI strings - the one place user-facing text lives.
 *
 * LANGUAGE POLICY (PROJECT_SPEC.md section 19):
 *   Korean  everything a shopper reads on screen
 *   English every identifier in the code - variables, functions, types, files,
 *           check ids, data keys, enum members - and the debug overlay, which
 *           is a developer tool
 *
 * Product names, model codes, units (mm, °) and brand names stay as they are.
 *
 * No i18n library is used. This is a single-locale product; a plain typed
 * module keeps the strings together without adding a dependency.
 */
import { formatCmWithUnit } from '../utils/consumerUnits';
import type { DataStatus, DoorId } from '../types/product';
import type { CheckStatus, InstallationVerdict } from '../types/result';
import type { WallId } from '../types/space';

/** Static labels, grouped by the screen area they belong to. */
export const UI = {
  appTitle: '3D 설치 가능 여부 확인',
  appSubtitle: '제품이 실제 설치 공간에 들어가는지 3D로 확인합니다',

  product: {
    section: '제품 선택',
    testGroup: '테스트 제품',
    realGroup: '실제 제품',
    dimensions: '제품 크기',
    doorType: '도어 방식',
    maxAngle: '최대 열림 각도',
    dataSource: '데이터 출처',
    verifiedAt: '확인일',
    unknownValue: '확인 필요',
    dimensionsIncomplete: '제품 치수 정보가 부족합니다',
    mockWarning: '테스트용 임의 데이터입니다. 제조사 공식 사양이 아닙니다.',
    realWarning:
      '치수와 설치 기준은 제조사 공식 자료 기준입니다. 3D 도어 형태는 실제 제품을 참고한 근사 표현입니다.',
    /**
     * The MAKER's own material, whoever the maker is.
     *
     * This used to be a fixed '삼성전자 공식 자료' chosen by a
     * `manufacturer === 'Samsung'` test in the panel - which would have said
     * the wrong brand's name about an LG record the moment a second
     * manufacturer arrived. The brand is data; the sentence is not.
     */
    officialSourceOf: (manufacturer: string) => `${manufacturer} 공식 자료`,
    mockSource: '테스트용 임의 데이터',
  },

  space: {
    section: '설치 공간',
    leftWall: '왼쪽 벽',
    rightWall: '오른쪽 벽',
  },

  placement: {
    section: '제품 배치',
    horizontalPosition: '제품 좌우 위치',
    clamped: '(공간 범위에 맞게 조정됨)',
    hint: '음수는 왼쪽 벽 쪽, 양수는 오른쪽 벽 쪽으로 이동합니다.',
  },

  door: {
    section: '도어 열림 각도',
    noDoorData: '이 제품에는 사용할 수 있는 도어 정보가 없습니다.',
    assumedLimit: (limitDeg: number) => `(최대 ${limitDeg}° 가정)`,
  },

  fixtures: {
    section: '렌더링 확인용 상태',
    hint:
      '실제 판정으로는 나오지 않는 오버레이 상태를 강제로 그려서 화면을 확인하는 개발용 기능입니다. '
      + '여기의 값은 제품 사양이 아니며 판정에 사용되지 않습니다. 소비자 화면에는 나타나지 않습니다.',
    label: '강제 표시',
    none: '사용 안 함',
  },

  view: {
    section: '화면 표시',
    showClearance: '설치 여유 공간 표시',
    showDoorSwing: '도어 열림 범위 표시 (근사)',
    swingRange: '표시 범위',
    swingCurrent: '현재 각도까지',
    swingMaximum: '최대 각도까지',
    showEnvelope: '제조사 권장 설치 공간 표시',
    noEnvelope: '이 제품은 제조사 권장 설치 공간 정보가 없어 표시할 내용이 없습니다.',
    debugGeometry: '개발용 형상 표시 (Debug)',
    resetCamera: '카메라 초기화',
  },

  margin: {
    section: '충돌 안전 여유',
    label: '여유값',
    hint: '손잡이·시공 오차를 감안한 서비스 자체 보수값입니다. 제조사 기준이 아니며 기본값은 0mm입니다.',
  },

  scenario: {
    section: '테스트 시나리오',
  },

  result: {
    section: '설치 가능 여부',
    physicalFit: '제품 수납 가능 여부',
    installationRequirements: '설치 공간 요구사항',
    doorUsability: '도어 사용 가능 여부',
    required: '필요',
    available: '확보',
    shortage: '부족',
    source: '출처',
    unbounded: '벽 없음 (제한 없음)',
    advisory: '참고',
    simulation: '시뮬레이션',
    blocked: '입력 데이터에 오류가 있어 계산을 중단했습니다. 아래 오류를 확인하세요.',
    simulationNote:
      '3D 도어 충돌 결과는 근사 형상 기준입니다. 제조사가 도어 여유 공간을 공개한 제품은 공식 기준으로 판정하며, 시뮬레이션 결과는 참고용입니다.',
    productIssues: '제품 데이터 오류',
    spaceIssues: '입력값 오류',
    severityError: '오류',
    severityWarning: '주의',
  },
} as const;

/** Final verdict wording. */
export const VERDICT_LABEL: Record<InstallationVerdict, string> = {
  INSTALLABLE: '설치 가능',
  NOT_INSTALLABLE: '설치 불가',
  PARTIALLY_VERIFIED: '일부 확인 필요',
};

export const VERDICT_NOTE: Record<InstallationVerdict, string> = {
  INSTALLABLE: '확인한 모든 항목이 기준을 충족합니다.',
  NOT_INSTALLABLE: '기준을 충족하지 못한 항목이 있습니다.',
  PARTIALLY_VERIFIED: '기준에 미달한 항목은 없지만, 자료가 부족해 확인하지 못한 항목이 있습니다.',
};

/** Per-check status wording. */
export const STATUS_LABEL: Record<CheckStatus, string> = {
  pass: '충족',
  fail: '부족',
  unknown: '확인 필요',
  info: '참고',
};

/** Door collision uses its own wording for the same three states. */
export const DOOR_STATUS_LABEL: Record<CheckStatus, string> = {
  pass: '이상 없음',
  fail: '간섭',
  unknown: '확인 필요',
  info: '참고',
};

/** How trustworthy a value is. */
export const DATA_STATUS_LABEL: Record<DataStatus, string> = {
  unknown: '확인 불가',
  official: '공식',
  derived: '계산값',
  estimated: '추정값',
  mock: '테스트값',
};

export const DOOR_TYPE_LABEL: Record<string, string> = {
  topBottomHinged: '상하 독립 회전 2도어',
  topBottom: '상냉장·하냉동 2도어',
  frenchBottomDrawer: '상단 양문 · 하단 냉동 서랍',
  single: '1도어',
  french: '프렌치 도어',
  sideBySide: '양문형',
  fourDoor: '4도어',
};

export const DOOR_LABEL: Record<DoorId, string> = {
  upper: '상단 도어',
  lower: '하단 도어',
  single: '도어',
  left: '왼쪽 도어',
  right: '오른쪽 도어',
};

export const WALL_LABEL: Record<WallId, string> = {
  leftWall: '왼쪽 벽',
  rightWall: '오른쪽 벽',
};

/** Labels for every check the engine can produce. Ids stay English. */
export const CHECK_LABEL = {
  bodyWidth: '제품 너비',
  bodyHeight: '제품 높이',
  bodyDepth: '제품 깊이',
  frontProjection: '제품이 앞으로 나오는 정도',
  requiredInstallationHeight: '설치 필요 높이',
  leftClearance: '왼쪽 본체 여유 공간',
  rightClearance: '오른쪽 본체 여유 공간',
  rearClearance: '후면 여유 공간',
  doorSideClearance: '도어 여유 공간',
  doorCollision: '3D 도어 충돌 시뮬레이션',
  doorClearanceFor: (doorId: DoorId) => `${DOOR_LABEL[doorId]} 여유 공간`,
  doorCollisionFor: (doorId: DoorId) => `${DOOR_LABEL[doorId]} 3D 충돌`,
} as const;

const mm = (value: number) => `${Math.round(value)}mm`;

/** Sentences the engine writes into `Check.reason`. */
export const MSG = {
  fits: (requiredMm: number, availableMm: number) =>
    `필요 ${mm(requiredMm)}, 확보 ${mm(availableMm)}.`,
  short: (requiredMm: number, availableMm: number, shortageMm: number) =>
    `필요 ${mm(requiredMm)}, 확보 ${mm(availableMm)} — ${mm(shortageMm)} 부족합니다.`,
  unbounded: '이 방향에는 벽이 없어 여유 공간에 제한이 없습니다.',

  widthUnavailable: '제품 너비 정보가 없습니다.',
  heightUnavailable: '제품 높이 정보가 없습니다.',
  depthUnavailable: '제품 깊이 정보가 없습니다.',
  rearClearanceUnavailable: '후면 여유 공간 기준이 없어 전체 깊이를 확인할 수 없습니다.',
  clearanceUnavailable: '필요한 여유 공간 기준이 없습니다.',
  rearRequirementUnavailable: '후면 여유 공간 기준이 없습니다.',
  /**
   * CONSUMER-FACING, unlike its neighbours. The guidance list renders
   * `check.reason` for an instruction that carries no figure of its own, so
   * this sentence reaches a shopper and speaks their unit.
   */
  rearInstruction: (gapMm: number) =>
    `설치할 때 뒷벽에서 ${formatCmWithUnit(gapMm)} 띄워 주세요. 환기를 위해 필요한 간격입니다.`,
  projects: (projectionMm: number) =>
    `제품이 설치 자리보다 약 ${mm(projectionMm)} 앞으로 나옵니다. 설치가 안 되는 것은 아니지만, 앞이 막힌 붙박이장이라면 들어가지 않습니다.`,
  doesNotProject: '제품이 설치 자리 안에 들어갑니다.',
  doorClearanceUnavailable: '제조사가 도어에 필요한 좌우 여유 공간을 공개하지 않았습니다.',
  installHeightUnusable: '설치 필요 높이 값을 사용할 수 없습니다.',
  noDoorGeometry: '이 제품 정보로는 도어 형상을 만들 수 없습니다.',
  /** The requirement is published and one side meets it, but not the other. */
  doorSideUnknownHingeSide:
    '한쪽은 기준을 만족하고 다른 쪽은 만족하지 않습니다. 제조사가 도어 힌지 방향을 공개하지 않아 어느 쪽에 필요한지 확정할 수 없습니다.',

  collision: (angleDeg: number, walls: WallId[]) =>
    `${Math.round(angleDeg)}°에서 ${walls.map((wall) => WALL_LABEL[wall]).join(', ')}과(와) 겹칩니다.`,
  clear: (angleDeg: number) => `${Math.round(angleDeg)}°에서 간섭이 없습니다.`,
  marginApplied: (marginMm: number) => ` (안전 여유 ${mm(marginMm)} 적용)`,
  advisoryNote: ' 제조사 공식 기준으로 판정하며 이 결과는 참고용입니다.',
  /**
   * The other reason a simulation is advisory, and it is not the same reason.
   *
   * `advisoryNote` says "the maker's own figure decided this instead". Where
   * the maker published NO door figure that sentence would be false, and the
   * honest one has to say why the 3D cannot settle it on its own: the hinge
   * inset and pivot depth it would need are not published by anybody.
   */
  simulationOnlyNote:
    ' 제조사가 도어 여유 기준을 공개하지 않았고 경첩 위치도 공개 자료에 없어, 이 3D 결과는 참고용이며 단독으로 설치 불가를 뜻하지 않습니다.',
  maxSafeAngle: (angleDeg: number) => `최대 ${Math.round(angleDeg)}°까지 안전`,
  noSafeAngle: '안전하게 열 수 있는 각도가 없음',

  blockedProduct: '제품 데이터가 올바르지 않아 확인할 수 없습니다.',
  blockedSpace: '입력한 설치 공간 값이 올바르지 않아 확인할 수 없습니다.',
  blockedNoGeometry: '제품의 너비·높이·깊이 정보가 없어 확인할 수 없습니다.',
} as const;

/** Validation messages. Field paths stay English; the explanation is Korean. */
export const VALIDATION = {
  required: (label: string) => `${label}은(는) 필수 항목입니다.`,
  notFinite: (label: string) => `${label} 값이 올바른 숫자가 아닙니다.`,
  mustBePositive: (label: string, value: number) =>
    `${label}은(는) 0mm보다 커야 합니다 (입력값 ${value}).`,
  cannotBeNegative: (label: string, value: number) =>
    `${label}은(는) 음수일 수 없습니다 (입력값 ${value}).`,
  missingForGeometry: (label: string) => `${label} 정보가 없어 관련 항목을 확인할 수 없습니다.`,
  missingForCheck: (label: string) => `${label} 정보가 없어 해당 항목은 "확인 필요"로 처리됩니다.`,
  doorTypeMissing: '도어 방식 정보가 없어 도어 형상을 만들 수 없습니다.',
  maxAngleMissing: (fallbackDeg: number) =>
    `최대 열림 각도 정보가 없어 ${fallbackDeg}°를 가정합니다. 전체 개방 여부는 확인할 수 없습니다.`,
  maxAngleTooLarge: (limitDeg: number, value: number) =>
    `최대 열림 각도는 ${limitDeg}°를 넘을 수 없습니다 (입력값 ${value}).`,
  sourceRequired: '테스트 데이터가 아닌 제품은 공식 출처(URL 또는 문서명)를 반드시 기록해야 합니다.',
  depthExcludingDoorTooLarge: (bodyDepthMm: number, value: number) =>
    `도어 제외 깊이(${value}mm)는 제품 전체 깊이(${bodyDepthMm}mm)보다 클 수 없습니다.`,
  doorLeafUnknownSide: (leafId: string) =>
    `도어 "${leafId}"는 이 제품의 도어 방식에 없는 도어입니다.`,
  doorLeafDuplicate: (leafId: string) => `도어 "${leafId}"가 두 번 정의되어 있습니다.`,
  doorLeafHingeMismatch: (leafId: string, expected: string, actual: string) =>
    `도어 "${leafId}"의 경첩 방향이 ${expected}이어야 하는데 ${actual}로 되어 있습니다.`,
  doorLeafAngleBelowProduct: (leafId: string, leafDeg: number, productDeg: number) =>
    `도어 "${leafId}"의 최대 열림 각도(${leafDeg}°)가 제품 대표값(${productDeg}°)보다 작습니다. 제품 대표값은 가장 좁은 도어 기준이어야 합니다.`,

  measurementNotNumber: (label: string) => `${label}: 숫자를 입력하세요.`,
  measurementTooSmall: (label: string, minMm: number, value: number) =>
    `${label}: ${minMm}mm 이상이어야 합니다 (입력값 ${value}).`,
  measurementTooLarge: (label: string, maxMm: number, value: number) =>
    `${label}: ${maxMm}mm 이하여야 합니다 (입력값 ${value}).`,
} as const;

/** Field labels used inside validation messages. */
export const FIELD_LABEL = {
  id: '제품 ID',
  brand: '브랜드',
  modelName: '모델명',
  bodyWidth: '제품 너비',
  bodyHeight: '제품 높이',
  bodyDepth: '제품 깊이',
  bodyDepthExcludingDoor: '도어 제외 깊이',
  rearClearance: '후면 여유 공간',
  leftClearance: '왼쪽 본체 여유 공간',
  rightClearance: '오른쪽 본체 여유 공간',
  requiredInstallationHeight: '설치 필요 높이',
  maxDoorAngle: '최대 열림 각도',
  depthAt90: '도어 90° 개방 시 깊이',
  maxOpenOverallWidth: '도어 최대 개방 시 전체 너비',
  doorSideClearance: '도어에 필요한 좌우 여유 공간',
} as const;
