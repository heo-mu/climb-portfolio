import { chromium, expect } from '@playwright/test'

const base = process.env.ASCENT_URL
if (!base) throw new Error('Set ASCENT_URL to the URL printed by the running local server.')
const browser = await chromium.launch({ channel: 'chrome' })
const errors: string[] = []
try {
  for (const width of process.env.ASCENT_WIDTHS?.split(',').map(Number) ?? [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
    await page.goto(base + '/design-system')
    await page.evaluate(() => document.fonts.ready)
    await expect(page.locator('.system-section')).toHaveCount(7)
    await expect(page.locator('.component-system-flow, .input-stage-header')).toHaveCount(0)
    const storybook = page.getByRole('link', { name: 'Storybook 보기 (새 탭에서 열기)' })
    await expect(storybook).toHaveAttribute('href', 'https://storybook-heo-mu.vercel.app/')
    await expect(storybook).toHaveAttribute('target', '_blank')
    await expect(storybook).toHaveAttribute('rel', 'noopener noreferrer')
    await expect(page.locator('.system-detail')).not.toContainText('준비 중')
    await expect(page.locator('.system-section-heading .case-content > p')).toHaveCount(6)
    await expect(page.locator('.glance-branch')).toHaveCount(2)
    await expect(page.locator('.detail-meta')).toHaveCount(0)
    await expect(page.locator('.system-ai-workflow, .system-detail .case-label')).toHaveCount(0)
    await expect(page.locator('.ai-connected-system')).toHaveCount(1)
    await expect(page.locator('.ai-reference-flow li > h4')).toHaveText(['Figma', 'Figma MCP', 'Claude'])
    await expect(page.locator('.ai-delivery-flow li > h4')).toHaveText(['버전 관리', 'npm 패키지', '프론트엔드 사용'])
    await expect(page.locator('.ai-human-review')).toContainText('최종 판단은 직접')
    await expect(page.locator('.ai-delivery > p')).toContainText('AI와 컴포넌트 구조·패키지 구성')
    await expect(page.locator('.glance-core > p')).toHaveText('Core')
    await expect(page.locator('.glance-platform > p')).toHaveText('Platform')
    await expect(page.locator('.glance-project > p')).toHaveText('Project')
    await expect(page.locator('.foundation-grid > div')).toHaveCount(6)
    await expect(page.locator('.propagation-chain li')).toHaveCount(4)
    const overviewBottom = await page.locator('.system-glance').evaluate(el => el.getBoundingClientRect().bottom)
    expect(overviewBottom).toBeLessThan(1800)
    await expect(page.locator('[data-specimen="Button"]')).toHaveCount(0)
    await expect(page.locator('.component-architecture-map')).toHaveCount(0)
    await expect(page.locator('.token-reference code')).toHaveText([
      '#004A38', 'colors/emerald/900', 'colors/brand/900',
      'colors/fill/primary/strong/default', 'colors/button/primary/solid/background/default',
    ])
    await expect(page.locator('.token-source-color')).toHaveCSS('background-color', 'rgb(0, 74, 56)')
    await expect(page.locator('.system-product-output')).toHaveCount(0)
    const input = page.locator('[data-specimen="Input"]')
    await expect(page.locator('[data-specimen="Badge"], .badge-compact')).toHaveCount(0)
    const controls = input.locator('.input-properties')
    expect(await controls.locator('.specimen-choices label').evaluateAll(elements => elements.every(el => {
      const box = el.getBoundingClientRect()
      return box.width >= 44 && box.height >= 44
    }))).toBe(true)
    const layout = await input.evaluate(root => {
      const variant = root.querySelector('.property-variant')!.getBoundingClientRect()
      const preview = root.querySelector('.input-preview')!.getBoundingClientRect()
      const content = root.querySelector('.property-content')!.getBoundingClientRect()
      return { variant: {x:variant.x,y:variant.y,width:variant.width,bottom:variant.bottom}, preview:{x:preview.x,y:preview.y,width:preview.width,bottom:preview.bottom},contentY:content.y }
    })
    await expect(input.locator('.input-preview')).toHaveCSS('position','static')
    if (width > 700) {
      expect(layout.preview.x).toBe(layout.variant.x + layout.variant.width)
      expect(layout.variant.width / (layout.variant.width + layout.preview.width)).toBeCloseTo(.36, 2)
      expect(await input.locator('.input-workspace').evaluate(el => el.getBoundingClientRect().height)).toBeLessThan(600)
    } else {
      expect(layout.preview.y).toBeGreaterThanOrEqual(layout.variant.bottom)
      expect(layout.contentY).toBeGreaterThanOrEqual(layout.preview.bottom)
    }
    const field = input.locator('.ds-input-shell input')
    const choose = async (name: string, option: string) => {
      if (name === 'State') return input.getByRole('combobox', { name, exact: true }).selectOption(option)
      if (['Label', 'Icon-eye', 'Alert'].includes(name)) {
        const control = input.getByRole('switch', { name, exact: true })
        if (await control.getAttribute('aria-checked') !== String(option === 'On')) await control.click()
        return
      }
      await input.getByRole('group', { name, exact: true }).getByRole('radio', { name: option, exact: true }).check()
    }
    await expect(input.getByRole('group')).toHaveCount(2)
    await expect(input.getByRole('switch')).toHaveCount(3)
    await expect(input.getByRole('combobox')).toHaveCount(1)
    await input.getByLabel('Label Text', { exact: true }).fill('이메일')
    await input.getByLabel('Input Text', { exact: true }).fill('example@email.com')
    await expect(field).toHaveValue('example@email.com')
    await expect(input.locator('.ds-field > label')).toHaveText('이메일')
    for (const [size, height, font, icon, gap, labelLine] of [['sm',36,14,16,4,16],['md',44,16,20,6,20],['lg',52,18,24,6,20]] as const) {
      await choose('Size', size)
      for (const state of ['Default','Hover','Focus','Completed','Error','Disabled','Read-only']) {
        await choose('State', state)
        await expect(input.locator('.ds-input-shell')).toHaveCSS('height', height + 'px')
        await expect(field).toHaveCSS('font-size', font + 'px')
        await expect(field).toHaveAttribute('aria-invalid', String(state === 'Error'))
        expect(await field.isDisabled()).toBe(state === 'Disabled')
        expect(await field.evaluate(el => (el as HTMLInputElement).readOnly)).toBe(state === 'Read-only')
        const hasAlert = ['Focus','Completed','Error'].includes(state)
        await expect(input.locator('.ds-input-helper')).toHaveCount(hasAlert ? 1 : 0)
        const eye = input.locator('.ds-field-action[aria-pressed]')
        await expect(eye).toHaveCount(state === 'Default' ? 0 : 1)
        if (state !== 'Default') await expect(eye.locator('svg')).toHaveAttribute('width', String(icon))
        for (const label of ['Off','On']) {
          await choose('Label', label)
          for (const alert of ['Off','On']) {
            await choose('Alert', alert)
            const expected = height + (label === 'On' ? labelLine + gap : 0) + (alert === 'On' && hasAlert ? 16 + gap : 0)
            await expect(input.locator('.ds-field')).toHaveCSS('height', expected + 'px')
            await choose('Icon-eye','Off')
            await expect(eye).toHaveCount(0)
            await choose('Icon-eye','On')
          }
        }
      }
    }
    await choose('State','Focus')
    await field.fill('preview edit')
    await expect(input.getByLabel('Input Text', { exact: true })).toHaveValue('preview edit')
    await input.getByRole('button', {name:'입력 내용 숨기기'}).click()
    await expect(field).toHaveAttribute('type','password')
    await input.getByRole('button', {name:'입력 내용 보기'}).click()
    await expect(field).toHaveAttribute('type','text')
    await input.getByRole('button', {name:'입력 내용 지우기'}).click()
    await expect(field).toHaveValue('')
    await input.getByRole('radio', {name:'sm',exact:true}).focus()
    await page.keyboard.press('ArrowRight')
    await expect(input.getByRole('radio', {name:'md',exact:true})).toBeChecked()
    const visibility = input.getByRole('switch', { name: 'Label', exact: true })
    await visibility.focus()
    const before = await visibility.getAttribute('aria-checked')
    await page.keyboard.press('Space')
    await expect(visibility).toHaveAttribute('aria-checked', before === 'true' ? 'false' : 'true')
    expect(await visibility.evaluate(el => el.matches(':focus-visible'))).toBe(true)
    expect(await page.locator('.system-detail').evaluate(root => [...root.querySelectorAll('*')].filter(el => {
      const style = getComputedStyle(el)
      return (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1) || (/(auto|scroll)/.test(style.overflowX) && el.scrollWidth > el.clientWidth + 1)
    }).map(el => el.className))).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(await page.locator('.system-detail').evaluate(root => [...root.querySelectorAll('*')].every(el => {
      const rect = el.getBoundingClientRect()
      return !rect.width || (rect.left >= -1 && rect.right <= innerWidth + 1)
    }))).toBe(true)
    console.log(`PASS remaining specimens and architecture: ${width}px`)
    await page.close()
  }
  expect(errors).toEqual([])
} finally { await browser.close() }
