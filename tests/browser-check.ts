import { chromium, expect } from '@playwright/test'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const errors: string[] = []
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
const base = process.env.ASCENT_URL || 'http://127.0.0.1:5173'
const camps = [0, .25, .49, .73, 1]
const altitudes = ['1240', '2080', '2840', '3620', '4208']

async function goToCamp(index: number) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  await page.evaluate(progress => window.scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) * progress, behavior: 'instant' }), camps[index])
  await expect(page.locator('.altitude-number')).toHaveText(altitudes[index], { timeout: 15000 })
  await expect(page.locator(`[data-checkpoint="${index}"]`)).toHaveAttribute('aria-hidden', 'false')
}

try {
  await page.goto(base, { waitUntil: 'domcontentloaded' })
  await expect(page.locator('canvas')).toBeVisible()
  await expect(page.locator('.route-loader')).toHaveCount(0, { timeout: 30000 })
  for (const index of [0, 1, 2, 3, 4, 0]) await goToCamp(index)
  console.log('PASS WebGL initialization, five checkpoints, ascent and reverse scroll')

  await page.emulateMedia({ reducedMotion: 'reduce' })
  const dimensions = [[1920,1080],[1600,900],[1440,900],[1366,768],[1280,800],[1200,800],[1024,768],[768,1024],[430,932],[390,844]]
  const layoutIssues: string[] = []
  for (const [width, height] of dimensions) {
    await page.setViewportSize({ width, height })
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    const bounds: number[] = []
    for (let index = 0; index < 5; index++) {
      await goToCamp(index)
      const result = await page.locator(`[data-checkpoint="${index}"]`).evaluate(section => {
        const rect = section.getBoundingClientRect()
        const hud = document.querySelector('.altitude-hud')!.getBoundingClientRect()
        return { bottom: rect.bottom, top: rect.top, right: rect.right, hudTop: hud.top, width: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth }
      })
      bounds.push(Math.round(result.hudTop - result.bottom))
      if (result.bottom > result.hudTop - 8 || result.right > width || result.top < 70 || result.overflow) layoutIssues.push(`${width}x${height} camp ${index}: ${JSON.stringify(result)}`)
    }
    console.log(`${width}x${height} content/HUD gaps: ${bounds.join(', ')}`)
  }
  console.log('LAYOUT ISSUES', JSON.stringify(layoutIssues))

  await page.setViewportSize({ width: 1440, height: 900 })
  await goToCamp(2)
  await page.getByRole('button', { name: /ChatGPT/ }).click()
  await expect(page.locator('.inventory-active h3')).toHaveText('ChatGPT')
  await goToCamp(3)
  await page.getByRole('link', { name: /PROJECT ALPHA/ }).click()
  await expect(page.locator('.detail-title')).toHaveText('PROJECT ALPHA')
  await expect(page.locator('canvas')).toHaveCount(0)
  await page.goBack()
  await expect(page.locator('.altitude-number')).toHaveText('3620')
  await page.getByRole('link', { name: /PROJECT BETA/ }).click()
  await page.reload()
  await expect(page.locator('.detail-title')).toHaveText('PROJECT BETA')
  await page.getByRole('link', { name: '↙ BACK TO PROJECTS' }).first().click()
  await expect(page.locator('.altitude-number')).toHaveText('3620')
  await page.reload()
  await expect(page.locator('.altitude-number')).toHaveText('3620')
  await page.getByRole('button', { name: '04 SUMMIT — CONTACT' }).click()
  await expect(page.locator('.altitude-number')).toHaveText('4208')
  await page.getByRole('button', { name: /DESCEND/ }).click()
  await expect(page.locator('.altitude-number')).toHaveText('1240')
  console.log('PASS tools, project navigation, browser back, explicit return, refresh and descend')

  await page.goto(base)
  await expect(page.locator('.route-loader')).toHaveCount(0, { timeout: 30000 })
  await page.keyboard.press('Tab')
  await expect(page.locator('.skip-link')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#title-high-camp')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.locator('.project-row').first()).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('.detail-title')).toHaveText('PROJECT ALPHA')
  console.log('PASS keyboard skip link, project focus and keyboard navigation')

  for (const slug of ['project-alpha','project-beta','project-gamma','project-delta','project-epsilon']) {
    await page.goto(`${base}/project/${slug}`)
    await expect(page.locator('.case-section')).toHaveCount(8)
    await expect(page.locator('.next-project')).toHaveAttribute('href', /\/project\//)
  }
  await page.goto(`${base}/project/missing-project`)
  await expect(page.getByText('잠시, 경로를 벗어났어요.')).toBeVisible()
  console.log('PASS all five deep links and missing route')

  await page.goto(`${base}/?view=text`)
  await expect(page.locator('.reading-mode')).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
  await expect(page.locator('[data-checkpoint]')).toHaveCount(5)
  await page.getByRole('link', { name: /PROJECT GAMMA/ }).click()
  await expect(page.locator('.detail-title')).toHaveText('PROJECT GAMMA')
  console.log('PASS reading route and accessible project links')

  await page.goto(base)
  await expect(page.locator('.route-loader')).toHaveCount(0, { timeout: 30000 })
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas')!
    canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext()
  })
  await expect(page.locator('.reading-mode')).toBeVisible()
  await expect(page.locator('[data-checkpoint][inert]')).toHaveCount(0)
  console.log('PASS WebGL context loss fallback')

  const unavailable = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await unavailable.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null
      return Reflect.apply(original, this, [type, ...args])
    } as typeof original
  })
  const fallbackPage = await unavailable.newPage()
  await fallbackPage.goto(base)
  await expect(fallbackPage.locator('.reading-mode')).toBeVisible()
  await expect(fallbackPage.locator('canvas')).toHaveCount(0)
  await expect(fallbackPage.locator('[data-checkpoint]')).toHaveCount(5)
  await unavailable.close()
  console.log('PASS WebGL unavailable fallback at mobile width')

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3, reducedMotion: 'reduce' })
  const touchPage = await mobile.newPage()
  await touchPage.goto(base)
  await expect(touchPage.locator('.route-loader')).toHaveCount(0, { timeout: 30000 })
  await touchPage.getByRole('button', { name: '03 HIGH CAMP — PROJECTS' }).tap()
  await expect(touchPage.locator('.altitude-number')).toHaveText('3620')
  await touchPage.getByRole('link', { name: /PROJECT ALPHA/ }).tap()
  await expect(touchPage.locator('.detail-title')).toHaveText('PROJECT ALPHA')
  await mobile.close()
  console.log('PASS touch navigation on mobile at DPR 3')
  console.log('BROWSER ERRORS', JSON.stringify(errors))
  expect(layoutIssues).toEqual([])
  expect(errors).toEqual([])
} finally {
  await browser.close()
}
