/**
 * Measurement definitions.
 *
 * Every number the user is asked to measure is described once, here: what it is
 * called, what exactly to measure, and what range is plausible. The control
 * panel renders its inputs from this list and `utils/validation.ts` reads its
 * limits from it, so there is exactly ONE place where "how wide may a space be"
 * is decided - no magic numbers scattered through the code.
 *
 * This is the data layer for a future measuring-guidance UX. No guidance
 * artwork or dedicated screen is built yet.
 */
import type { InstallationSpace } from '../types/space';

export type MeasurementId = 'SPACE_WIDTH' | 'SPACE_HEIGHT' | 'SPACE_DEPTH';

/** The space fields a measurement can write to. */
export type MeasurementField = 'widthMm' | 'heightMm' | 'depthMm';

export interface MeasurementDefinition {
  id: MeasurementId;
  /** Field of `InstallationSpace` this measurement fills in. */
  field: MeasurementField;
  /** Short label shown next to the input. */
  label: string;
  /** One line describing what the number means. */
  description: string;
  unit: 'cm';
  required: boolean;
  /** Practical instruction for taking the measurement. */
  measurementGuide: string;
  /** Smallest plausible value. Below this the input is rejected. */
  /**
   * How much one nudge moves the value - arrow key, or mouse wheel over the
   * focused field. Both go through the same commit path as typing, so there is
   * exactly one place a measurement can be clamped.
   */
  stepMm: number;
  minMm: number;
  /** Largest plausible value. Above this the input is rejected. */
  maxMm: number;
}

export const MEASUREMENT_DEFINITIONS: MeasurementDefinition[] = [
  {
    id: 'SPACE_WIDTH',
    field: 'widthMm',
    label: '설치 공간 너비',
    description: '냉장고가 들어갈 공간의 가장 좁은 좌우 너비',
    unit: 'cm',
    required: true,
    measurementGuide:
      '바닥, 중간, 위쪽 세 군데를 재고 그중 가장 좁은 값을 입력하세요. 걸레받이나 몰딩이 있으면 그것까지 포함해 좁아진 폭을 기준으로 합니다.',
    stepMm: 10,
    minMm: 300,
    maxMm: 4000,
  },
  {
    id: 'SPACE_HEIGHT',
    field: 'heightMm',
    label: '설치 공간 높이',
    description: '바닥에서 위쪽 장애물(상부장·천장)까지의 높이',
    unit: 'cm',
    required: true,
    measurementGuide:
      '바닥에서 위쪽을 막고 있는 것까지 재세요. 상부장이 있으면 천장이 아니라 상부장 아랫면까지가 기준입니다.',
    stepMm: 10,
    minMm: 500,
    maxMm: 4000,
  },
  {
    id: 'SPACE_DEPTH',
    field: 'depthMm',
    label: '설치 공간 깊이',
    description: '뒷벽 마감면에서 공간 앞쪽 끝(방으로 열리는 면)까지의 깊이',
    unit: 'cm',
    required: true,
    /**
     * The rear clearance is subtracted separately by the depth rule
     * (product.depth + rearClearance <= space.depth), so this measurement must
     * NOT already have a ventilation gap taken off it. A protruding socket is
     * what the rear clearance is for; asking the user to measure to the front of
     * it would double-count the gap. See PROJECT_SPEC.md section 6.2.
     */
    measurementGuide:
      '뒷벽 마감면에서 공간 앞쪽 끝까지 그대로 재세요. 환기용 뒷면 여유는 제품 요구값으로 따로 계산하므로 미리 빼지 마세요. 콘센트·배관처럼 뒷벽에서 튀어나온 것도 빼지 말고 재되, 튀어나온 깊이가 제품의 요구 뒷면 여유보다 크면 현재 계산은 그 상황을 반영하지 못합니다.',
    stepMm: 10,
    minMm: 300,
    maxMm: 4000,
  },
];

export function measurementByField(field: MeasurementField): MeasurementDefinition {
  const found = MEASUREMENT_DEFINITIONS.find((definition) => definition.field === field);
  if (!found) throw new Error(`No measurement definition for field "${field}"`);
  return found;
}

/** Type guard helper so the definition list stays in step with the space type. */
export type MeasuredSpaceFields = Pick<InstallationSpace, MeasurementField>;
