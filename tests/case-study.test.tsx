import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CaseImageSlot } from '../src/components/CaseStudy'

describe('editorial image handoff', () => {
  it('keeps editing instructions out of the accessibility tree and omits captions', () => {
    const html = renderToStaticMarkup(<CaseImageSlot slot={{ label: '너비·높이·깊이를 입력하는 화면' }} />)
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain('IMAGE — 너비·높이·깊이를 입력하는 화면')
    expect(html).not.toContain('figcaption')
  })

  it('replaces the guide with an accessible source image through data alone', () => {
    const html = renderToStaticMarkup(<CaseImageSlot slot={{ label: '편집용 가이드', image: { src: '/space.png', alt: '공간 입력 화면', width: 1200, height: 900 } }} />)
    expect(html).toContain('src="/space.png"')
    expect(html).toContain('alt="공간 입력 화면"')
    expect(html).toContain('aspect-ratio:1200 / 900')
    expect(html).not.toContain('편집용 가이드')
    expect(html).not.toContain('aria-hidden')
  })

  it('does not hide a supplied image while its paired image is still a placeholder', () => {
    const html = renderToStaticMarkup(<CaseImageSlot slot={{ label: '모바일 비교', layout: 'mobile-pair', panels: [
      { label: '조작 화면', image: { src: '/mobile.png', alt: '모바일 공간 조작 화면', width: 390, height: 844 } },
      { label: '설치 결과 화면' },
    ] }} />)
    expect(html.split('>')[0]).not.toContain('aria-hidden')
    expect(html).toContain('alt="모바일 공간 조작 화면"')
    expect(html).toContain('IMAGE — 설치 결과 화면')
  })
})
