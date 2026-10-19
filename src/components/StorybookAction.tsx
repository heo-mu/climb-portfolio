import { ArrowUpRight } from './ArrowUpRight'
import './StorybookAction.css'

// Set the public Storybook URL here after it is supplied by the project owner.
export const STORYBOOK_URL: string | null = null

export function StorybookAction() {
  return STORYBOOK_URL
    ? <a className="storybook-action" href={STORYBOOK_URL} target="_blank" rel="noopener noreferrer"><span>Storybook 보기</span><ArrowUpRight className="storybook-action-arrow" /></a>
    : <button className="storybook-action" type="button" disabled><span>Storybook 보기</span><small>준비 중</small></button>
}
