import { parseCmToMm } from './consumerUnits'

export interface MeasurementDefinition {
  id: string
  field: string
  label: string
  unit: 'cm'
  minMm: number
  maxMm: number
  stepMm: number
}
export const SPACE_WIDTH: MeasurementDefinition = {
  id: 'SPACE_WIDTH', field: 'widthMm', label: '설치 공간 너비', unit: 'cm',
  minMm: 300, maxMm: 4000, stepMm: 10,
}
export interface SpecValue { value: number | null }
export const isManufacturerBacked = (spec: SpecValue) => spec.value !== null
export const CONSUMER_UI = {
  measurementEmpty: '—',
  productDimensionByAxis: { width: '제품 너비', height: '제품 높이', depth: '제품 깊이' },
  productDimensionUnavailable: '제품 크기 정보 없음',
}
export function setupMeasurementError(_field: string, draft: string) {
  const value = parseCmToMm(draft)
  if (value === null || !Number.isFinite(value)) return '크기를 숫자로 입력해 주세요.'
  if (value < SPACE_WIDTH.minMm || value > SPACE_WIDTH.maxMm) return '30~400cm 사이로 입력해 주세요.'
  return null
}
