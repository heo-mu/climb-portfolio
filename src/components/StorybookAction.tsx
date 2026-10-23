import { ArrowUpRight } from './ArrowUpRight'
import './StorybookAction.css'

export const STORYBOOK_URL = 'https://storybook-heo-mu.vercel.app/'

export function StorybookAction() {
  return <a className="storybook-action" href={STORYBOOK_URL} target="_blank" rel="noopener noreferrer" aria-label="Storybook 보기 (새 탭에서 열기)">
    <span>Storybook 보기</span><ArrowUpRight className="storybook-action-arrow" />
  </a>
}
