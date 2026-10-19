import { chromium, expect } from '@playwright/test'

const base = process.env.ASCENT_URL
if (!base) throw new Error('Set ASCENT_URL to the local server URL.')
const browser = await chromium.launch({ channel: 'chrome' })
const errors: string[] = []
try {
  for (const [width, height] of [[1920,1080],[1440,900],[1280,800],[1200,800]]) {
    const page = await browser.newPage({ viewport: { width, height } })
    page.on('pageerror', e => errors.push(e.message))
    page.on('console', m => { if(m.type() === 'error') errors.push(m.text()) })
    page.on('response', r => { if(r.status() >= 400) errors.push(`${r.status()} ${r.url()}`) })
    await page.goto(base + '/#systems')
    const root = page.locator('.expedition'), link = page.locator('.system-showcase-link')
    await expect(root).toHaveAttribute('data-system-showcase-presence','1',{timeout:30000})
    await expect(link).toHaveCSS('visibility','visible')
    await expect(root).toHaveAttribute('data-showcase-presence','0')
    await expect(link).toHaveAttribute('href','/design-system')
    const bounds = await link.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.width / width).toBeGreaterThan(.30)
    expect(bounds!.x + bounds!.width).toBeLessThan(width)
    expect(bounds!.y).toBeGreaterThan(0)
    expect(bounds!.y + bounds!.height).toBeLessThan(height)
    const overlap = await page.evaluate(() => {
      const d=document.querySelector('.system-showcase-link')!.getBoundingClientRect()
      return ['#systems .panel-content','.trail-navigation','.altitude-hud'].some(selector => {
        const e=document.querySelector(selector)
        if(!e) return false
        const b=e.getBoundingClientRect()
        return b.width && b.height && d.left<b.right && d.right>b.left && d.top<b.bottom && d.bottom>b.top
      })
    })
    expect(overlap).toBe(false)
    await link.hover()
    await expect.poll(async()=> (await link.boundingBox())!.width).toBeGreaterThan(bounds!.width)
    await expect(link).toHaveCSS('cursor','pointer')
    await link.click()
    await expect(page).toHaveURL(/\/design-system$/)
    await page.goBack()
    await expect(root).toHaveAttribute('data-system-showcase-presence','1')
    await page.locator('.systems-case-link').click()
    await expect(page).toHaveURL(/\/design-system$/)
    await page.goBack()
    await expect(root).toHaveAttribute('data-system-showcase-presence','1')
    // Walk through every remaining checkpoint, then back to the system camp.
    for (const [index, name] of [[4,'Tools'],[5,'Projects'],[6,'Contact'],[3,'Design System']] as const) {
      await page.locator('.trail-checkpoint').nth(index).click()
      await expect(page.locator('.current-location strong')).toHaveText(name,{timeout:20000})
      await expect(page.locator(`[data-checkpoint="${index}"]`)).toHaveAttribute('aria-hidden','false')
      if(index===5) {
        await expect(root).toHaveAttribute('data-showcase-presence','1',{timeout:20000})
        await expect(link).toHaveCSS('visibility','hidden')
        const project = page.locator('.showcase-link')
        await expect(project).toHaveCSS('visibility','visible')
        const projectBounds = await project.boundingBox()
        console.log(JSON.stringify({width,system:bounds,projects:projectBounds}))
      }
    }
    await expect(root).toHaveAttribute('data-system-showcase-presence','1')
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
    console.log(`PASS System Showcase ${width}px: texture, framing, hover, both links, journey`)
    await page.close()
  }
  expect(errors).toEqual([])
} finally { await browser.close() }
