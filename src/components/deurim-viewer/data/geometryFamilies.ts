/**
 * GEOMETRY FAMILY REGISTRY (F-025).
 *
 * A geometry family is a SHAPE of appliance that this service knows how to
 * build procedurally - "a Samsung Bespoke four-door", not "RF85DB90B2AP". One
 * family serves every SKU that shares that shape; the SKU supplies its own
 * dimensions, its own official installation figures and its own cosmetic
 * parameters.
 *
 * WHY THIS EXISTS
 *
 * The alternative is a React component per SKU - `RF85DB90B2AP.tsx`,
 * `RF90XXXXX.tsx` - which makes every new product an engineering task and
 * guarantees the visual code drifts from the data. Product data and visual
 * implementation are separate concerns:
 *
 *     Product Data -> Geometry Family -> Visual Template -> Visual Parameters
 *
 * A family is only listed here if the renderer can actually build it. An
 * static product data must never name a shape the service cannot draw.
 *
 * Adding a family is a deliberate engineering change: a new visual template,
 * its parameters, and an entry here. It is NOT something product registration
 * can do on its own.
 */
import type { DoorType, VisualTemplateId } from '../types/product';

export interface GeometryFamily {
  /** Stable key. This is what a product record stores in `visual.template`. */
  id: VisualTemplateId;
  /** Human-readable family label. Korean, like the rest of the UI. */
  label: string;
  /** What shape this actually builds, in plain words. */
  description: string;
  /** Door layout the template draws. Informational for the operator. */
  doorLayout: string;
  /** Product data a reviewer must confirm before relying on this family. */
  requiredParameters: string[];
  /**
   * The VALIDATION door topology this family requires. Null imposes no motion
   * topology: generic fallback and closed-only likenesses may have none.
   *
   * It lives here rather than in the form because the family and the door type
   * must never disagree - a template that draws two hinged leaves against a
   * record that says `single` would put the visual model and the collision
   * geometry on different appliances. The registry answers this once instead
   * of spreading per-family conditionals through product consumers.
   */
  validationDoorType: DoorType | null;
  /**
   * False for the generic fallback: it renders a plain box, which is honest but
   * is not a product likeness. Source data should not use it accidentally.
   */
  isProductLikeness: boolean;
}

export const GEOMETRY_FAMILIES: GeometryFamily[] = [
  {
    id: 'closed-four-door', label: '상냉장·하냉동 4도어 (닫힌 외형)',
    description: '상하 두 쌍의 도어와 수평 매립 손잡이를 표현합니다. 외형만으로 회전 기하를 생성하지 않습니다.',
    doorLayout: '상단 좌우 냉장 도어 + 하단 좌우 냉동 도어',
    requiredParameters: ['본체 폭·높이·깊이', '공식 외형 근거', '시각 전용 분할·손잡이·패널 간격'],
    validationDoorType: null, isProductLikeness: true,
  },
  {
    id: 'stacked-hinged-2door', label: '상하 독립 회전문',
    description: '상하 문이 각각 회전하며 냉동실 위치에 따라 분할을 표현합니다. 공식 힌지 방향과 각도를 사용하며 분할·두께·축은 공통 보조 기하입니다.',
    doorLayout: '상하 전체 너비 회전문 2개 — 냉동실 위치에 따른 공통 분할',
    requiredParameters: ['본체 폭·높이·깊이', '상하 문별 힌지 방향·공식 최대 각도', '설치 개구부 최소 치수'],
    validationDoorType: 'topBottomHinged', isProductLikeness: true,
  },
  {
    id: 'single-door-glazed', label: '유리문 단일 도어',
    description: '단열 유리문 프레임과 열린 내부 공간·선반을 표현합니다. 공식 힌지 방향과 최대 각도를 사용하며 프레임·유리·회전축은 시각적 근사입니다.',
    doorLayout: '프레임과 유리로 구성된 회전문 1개',
    requiredParameters: ['본체 폭·높이·깊이', '단일 문 힌지 방향·최대 각도', '설치 개구부 또는 여유 조건'],
    validationDoorType: 'single', isProductLikeness: true,
  },
  {
    id: 'single-door-tall', label: '빌트인 단일 도어',
    description: '전체 높이 단일 문과 빌트인 본체입니다. 키 큰 제품부터 언더카운터까지 본체 비율과 하부 파라미터로 표현합니다. 공식 힌지 방향·최대 각도를 사용하며 회전축과 두께는 공통 근사 기하입니다.',
    doorLayout: '전체 높이 회전문 1개',
    requiredParameters: ['본체 너비 · 높이 · 깊이', '단일 leaf 힌지 방향 · 최대 각도', '설치 개구부 최소 치수'],
    validationDoorType: 'single', isProductLikeness: true,
  },
  {
    id: 'french-door-bottom-drawer',
    label: '프렌치 도어 · 하단 냉동 서랍',
    description: '상단 좌우 회전문과 하단 냉동 서랍입니다. 공식 문별 각도·경첩이 있는 제품만 상단 회전을 지원합니다. 서랍은 닫힌 외형이며 창·디스펜서·손잡이는 시각 전용입니다.',
    doorLayout: '상단 회전문 2개 + 하단 냉동 서랍 1개',
    requiredParameters: ['본체 너비 · 높이 · 깊이', '회전문 + 서랍 topology', 'visual panel proportions'],
    validationDoorType: 'frenchBottomDrawer',
    isProductLikeness: true,
  },
  {
    id: 'samsung-bespoke-4door',
    label: 'Samsung Bespoke 4도어',
    description:
      '상단 2도어 + 하단 2도어 구성의 프렌치도어형 본체입니다. 제품의 실제 치수와 도어 비율을 입력받아 그 비율대로 생성합니다.',
    doorLayout: '4도어 (상단 2 · 하단 2)',
    requiredParameters: ['본체 너비 · 높이 · 깊이', '도어 topology', 'visual panel proportions'],
    validationDoorType: 'fourDoor',
    isProductLikeness: true,
  },
  {
    /**
     * SIDE-BY-SIDE, TWO FULL-HEIGHT LEAVES.
     *
     * The second real geometry family, and the reason it exists is that the
     * first one could not be stretched to cover it. A Bespoke 4-door and a
     * side-by-side share a validation topology - two hinge columns, one on
     * each vertical edge - but nothing else a shopper looks at: the 4-door has
     * a horizontal division at mid height with a signature dark handle band,
     * where the side-by-side has one uninterrupted vertical seam from the top
     * of the base to the top of the cabinet. Driving the 4-door template with
     * `upperDoorHeightRatio: 1` would collapse the handle band and the lower
     * row into degenerate zero-height slabs and still leave a mid rail in the
     * cabinet frame. That is a different shape, not a parameter value.
     *
     * What it takes from the record: the three body dimensions, the hinge axes
     * the layout computed, and its own cosmetic parameters. No SKU appears in
     * the template.
     */
    id: 'side-by-side-2door',
    label: '양문형 2도어',
    description:
      '좌우 2개의 전체 높이 도어가 가운데 세로 이음선에서 만나는 본체입니다. 제품의 실제 치수와 도어 비율을 입력받아 그 비율대로 생성합니다.',
    doorLayout: '양문형 2도어 (좌 · 우)',
    requiredParameters: ['본체 너비 · 높이 · 깊이', '좌우 leaf topology', 'visual centre seam'],
    validationDoorType: 'sideBySide',
    isProductLikeness: true,
  },
  {
    id: 'top-bottom-2door',
    label: '상냉장·하냉동 2도어',
    description: '상·하단에 전체 너비 패널을 하나씩 갖는 냉장고입니다. 외형과 도어 개폐 기하는 별개이며, 이 family는 아직 실행 가능한 힌지 기하를 제공하지 않습니다.',
    doorLayout: '2도어 (상단 냉장 · 하단 냉동)',
    requiredParameters: ['본체 너비 · 높이 · 깊이', '상하 door topology', 'visual door split'],
    validationDoorType: 'topBottom',
    isProductLikeness: true,
  },
  {
    id: 'box',
    label: '기본 형상 (근사 박스)',
    description:
      '제품 외형을 단순한 박스로만 표현합니다. 치수와 도어 개폐 판정은 정상이지만 실제 제품과 닮은 형상은 아닙니다.',
    doorLayout: '제품 데이터의 도어 방식을 따름',
    requiredParameters: ['본체 너비 · 높이 · 깊이'],
    validationDoorType: null,
    isProductLikeness: false,
  },
];

export function geometryFamilyById(id: string): GeometryFamily | null {
  return GEOMETRY_FAMILIES.find((family) => family.id === id) ?? null;
}

/** True when the renderer can actually build this family. */
export function isSupportedGeometryFamily(id: string): boolean {
  return geometryFamilyById(id) !== null;
}
