/**
 * End-to-end browser QA for the current journey.
 *
 *   npm run build && npm run test:browser          (production preview from dist/)
 *   ASCENT_URL=https://… npm run test:browser       (any running deployment)
 *
 * Expectations come from the same source data the UI renders (checkpoints,
 * projects, profile), never from hard-coded copy.
 */
import { chromium, expect, type Browser, type BrowserContextOptions, type Page } from '@playwright/test'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { checkpoints } from '../src/data/checkpoints.ts'
import { legacyProjectSlugs, processCaseStudy, projects } from '../src/data/projects.ts'
import { profile } from '../src/data/profile.ts'
import { experienceConfig } from '../src/config/experience.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
let base = process.env.ASCENT_URL?.replace(/\/$/, '')
let closeServer = async () => {}
if (!base) {
  if (!existsSync(new URL('../dist/index.html', import.meta.url))) throw new Error('No dist/ build. Run `npm run build` first, or set ASCENT_URL.')
  const { preview } = await import('vite')
  const server = await preview({ root, logLevel: 'error', preview: { host: '127.0.0.1', port: 4319, strictPort: false } })
  base = server.resolvedUrls!.local[0].replace(/\/$/, '')
  closeServer = () => server.close()
}

const desktop = { width: 1440, height: 900 }
const viewports = [[1920, 1080], [1600, 900], [1440, 900], [1366, 768], [1280, 800], [1200, 800], [1024, 768], [768, 1024], [430, 932], [390, 844]] as const
const camps = checkpoints.map((camp, order) => ({ ...camp, order }))
const errors: string[] = []
const passed: string[] = []

let browser: Browser
try { browser = await chromium.launch({ channel: 'chrome' }) } catch { browser = await chromium.launch() }

async function open(options: BrowserContextOptions = {}, allow: RegExp[] = [], init?: () => void) {
  const context = await browser.newContext({ viewport: desktop, ...options })
  if (init) await context.addInitScript(init)
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(`[${options.viewport?.width ?? 1440}] pageerror ${error.message}`))
  page.on('console', message => {
    if (message.type() === 'error' && !allow.some(pattern => pattern.test(message.text()))) errors.push(`[${options.viewport?.width ?? 1440}] console ${message.text()}`)
  })
  return { context, page }
}

async function step(name: string, run: () => Promise<void>) {
  const start = Date.now()
  await run()
  passed.push(name)
  console.log(`PASS ${name} (${((Date.now() - start) / 1000).toFixed(1)}s)`)
}

const ready = async (page: Page) => {
  await page.waitForSelector('.scene[data-ready=true]', { timeout: 30000 })
  await page.waitForSelector('.expedition[data-spatial-ready]', { timeout: 30000 })
}

const scrollToProgress = (page: Page, progress: number) =>
  page.evaluate(p => window.scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) * p, behavior: 'instant' }), progress)

/** Waits until the damped camera, the altitude and every composition stop changing. */
const settle = (page: Page) => page.evaluate(() => new Promise<void>(resolve => {
  let last = '', stable = 0, count = 0
  const read = () => [document.querySelector('.altitude-number')?.textContent, scrollY, ...Array.from(document.querySelectorAll<HTMLElement>('.spatial-panel, .home-layout')).map(e => e.style.transform + e.style.opacity)].join('|')
  const tick = () => {
    const now = read()
    stable = now === last ? stable + 1 : 0
    last = now
    if (stable > 10 || ++count > 900) resolve(); else requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}))

type CampState = { index: number; inert: boolean; ariaHidden: string | null; spatial?: string; visibility: string; transform: string; opacity: string; presence: number }
const campStates = (page: Page) => page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>('[data-checkpoint]')).map(section => {
  const composition = section.querySelector<HTMLElement>('.spatial-panel, .home-layout')!
  const measured = section.querySelector<HTMLElement>('.panel-content') ?? composition
  const style = getComputedStyle(composition)
  return { index: Number(section.dataset.checkpoint), inert: section.inert, ariaHidden: section.getAttribute('aria-hidden'), spatial: section.dataset.spatial, visibility: getComputedStyle(section).visibility, transform: style.transform, opacity: style.opacity, presence: measured.getBoundingClientRect().width / measured.offsetWidth }
}) as CampState[])

/** At a camp: its composition is parked crisp and interactive, every other camp is inert, HUD agrees. */
async function expectArrived(page: Page, index: number, { atCenter = true } = {}) {
  const camp = camps[index]
  await expect(page.locator(`[data-checkpoint="${index}"]`)).toHaveAttribute('aria-hidden', 'false', { timeout: 15000 })
  if (index > 0 && atCenter) await expect(page.locator('.altitude-number')).toHaveText(String(camp.altitude), { timeout: 15000 })
  await settle(page)
  for (const state of await campStates(page)) {
    if (state.index === index) expect(state, `${camp.navigation} parked`).toMatchObject({ inert: false, spatial: 'readable', visibility: 'visible', transform: 'none', opacity: '1' })
    else expect(state.inert, `${camps[state.index].navigation} inert at ${camp.navigation}`).toBe(true)
  }
  await expect(page.locator('.current-location strong')).toHaveText(camp.navigation)
  await expect(page.locator('.trail-checkpoint[aria-current="step"]')).toHaveAttribute('aria-label', `${camp.index} ${camp.navigation}`)
  await expect(page.locator('.altitude-hud')).toHaveAttribute('data-visible', String(index > 0))
}

async function goToCamp(page: Page, index: number) {
  await scrollToProgress(page, camps[index].progress)
  await expectArrived(page, index)
}

/** Scripted scroll with a per-frame audit of the arrival invariants. */
const sweep = (page: Page, from: number, to: number, ms: number) => page.evaluate(({ from, to, ms }) => new Promise<{ violations: string[]; projectOverflowFlips: number; frames: number }>(resolve => {
  const range = document.documentElement.scrollHeight - innerHeight
  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-checkpoint]'))
  const projectsPanel = document.querySelector<HTMLElement>('#high-camp .panel-content')!
  const restOverflow = projectsPanel.scrollHeight > projectsPanel.clientHeight
  const persist = new Map<string, number>()
  const violations: string[] = []
  let flips = 0, lastOverflow = restOverflow, frames = 0
  const flag = (key: string, detail: string) => {
    const count = (persist.get(key) ?? 0) + 1
    persist.set(key, count)
    // Same-frame React text updates may trail the DOM attributes by a frame.
    if (count === 3) violations.push(detail)
  }
  const start = performance.now()
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / ms)
    if (t < 1) window.scrollTo({ top: (from + (to - from) * t) * range, behavior: 'instant' })
    frames++
    const seen = new Set<string>()
    const header = document.querySelector('.current-location strong')!.textContent
    const trail = document.querySelector('.trail-checkpoint[aria-current]')?.getAttribute('aria-label')?.replace(/^\d+ /, '')
    sections.forEach(section => {
      const composition = section.querySelector<HTMLElement>('.spatial-panel, .home-layout')!
      const measured = section.querySelector<HTMLElement>('.panel-content') ?? composition
      const visible = getComputedStyle(section).visibility === 'visible' ? Number(getComputedStyle(composition).opacity) : 0
      const presence = measured.getBoundingClientRect().width / measured.offsetWidth
      const name = section.querySelector('.panel-kicker span:last-child')?.textContent ?? 'Home'
      const at = `${Math.round(now - start)}ms scroll=${(scrollY / range).toFixed(4)}`
      if (section.inert && visible > .5 && presence > .85) { seen.add(`ghost-${name}`); flag(`ghost-${name}`, `${at}: ${name} looks arrived (presence ${presence.toFixed(2)}, opacity ${visible.toFixed(2)}) but is inert`) }
      if (!section.inert && visible < .5) { seen.add(`blind-${name}`); flag(`blind-${name}`, `${at}: ${name} is interactive while invisible`) }
      if (!section.inert && header !== name) { seen.add(`hud-${name}`); flag(`hud-${name}`, `${at}: ${name} arrived but the location reads ${header}`) }
    })
    if (header !== trail) { seen.add('trail'); flag('trail', `location ${header} and trail ${trail} disagree`) }
    persist.forEach((_, key) => { if (!seen.has(key)) persist.delete(key) })
    const overflow = projectsPanel.scrollHeight > projectsPanel.clientHeight
    if (!restOverflow && overflow !== lastOverflow) flips++
    lastOverflow = overflow
    if (now - start < ms + 600) requestAnimationFrame(tick)
    else resolve({ violations, projectOverflowFlips: flips, frames })
  }
  requestAnimationFrame(tick)
}), { from, to, ms })

/** Panels other than Projects must fit without internal scroll and keep clear of the HUD. */
const layoutIssues = (page: Page, index: number) => page.evaluate(index => {
  const issues: string[] = []
  const section = document.querySelector<HTMLElement>(`[data-checkpoint="${index}"]`)!
  const content = section.querySelector<HTMLElement>('.panel-content')!
  const box = content.getBoundingClientRect()
  const intersects = (a: DOMRect, b: DOMRect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
  if (document.documentElement.scrollWidth > innerWidth) issues.push('page scrolls horizontally')
  if (section.id !== 'high-camp' && content.scrollHeight > content.clientHeight + 1) issues.push(`internal scroll ${content.scrollHeight}/${content.clientHeight}`)
  if (box.left < 0 || box.right > innerWidth + .5) issues.push(`outside viewport horizontally ${Math.round(box.left)}..${Math.round(box.right)}`)
  if (box.bottom > innerHeight - 4) issues.push(`below viewport ${Math.round(box.bottom)} > ${innerHeight}`)
  const location = document.querySelector('.current-location')!.getBoundingClientRect()
  if (box.top < location.bottom + 4) issues.push(`under the location label ${Math.round(box.top)}`)
  const altitude = document.querySelector('.altitude-hud')!.getBoundingClientRect()
  if (intersects(box, altitude)) issues.push(`overlaps altitude ${JSON.stringify([box.right, box.bottom, altitude.left, altitude.top].map(Math.round))}`)
  for (const target of document.querySelectorAll<HTMLElement>('.trail-checkpoint .nav-label, .trail-node, .trail-mobile-label')) {
    const rect = target.getBoundingClientRect()
    if (rect.width && getComputedStyle(target).display !== 'none' && intersects(box, rect)) { issues.push(`overlaps trail ${target.className}`); break }
  }
  const heading = section.querySelector<HTMLElement>('.portfolio-heading')!
  if (heading.getBoundingClientRect().height > parseFloat(getComputedStyle(heading).lineHeight) * 1.5) issues.push('heading wraps')
  if (!Number.isInteger(box.left) || !Number.isInteger(box.top)) issues.push(`fractional settled position ${box.left},${box.top}`)
  return issues
}, index)

try {
  // ───────────────────────────── Journey (desktop) ─────────────────────────────
  {
    const { context, page } = await open()
    await page.goto(base, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('#title-base-camp')).toBeVisible()
    await ready(page)
    // Compare against the settled title page, after its one-off entrance (the period ripple loops).
    await page.waitForFunction(() => document.getAnimations().every(animation => animation.effect?.getTiming().iterations === Infinity || animation.playState === 'finished'))
    const homeGeometry = () => page.evaluate(() => ['.home-identity', '#title-base-camp', '.home-intro', '.home-explore'].map(selector => { const r = document.querySelector(selector)!.getBoundingClientRect(); return [r.left, r.top, r.width, r.height] }))
    const initialHome = await homeGeometry()

    await step('first paint: Home settled, altitude and trail hidden, no internal scroll', async () => {
      await expectArrived(page, 0)
      await expect(page.locator('.hud')).toHaveAttribute('data-home', 'true')
      expect(await page.evaluate(() => document.documentElement.scrollTop)).toBe(0)
    })

    await step('ascent and descent: every camp parks crisp, interactive and current', async () => {
      for (const index of [1, 2, 3, 4, 5, 4, 3, 2, 1, 0]) await goToCamp(page, index)
    })

    await step('motion audit: never visible-but-inert, never interactive-but-invisible, HUD in sync', async () => {
      for (const [from, to] of [[0, 1], [1, 0]]) {
        const result = await sweep(page, from, to, 14000)
        expect(result.frames).toBeGreaterThan(200)
        expect(result.violations, `${from}→${to}`).toEqual([])
        expect(result.projectOverflowFlips, 'Projects scrollbar flash').toBe(0)
        await settle(page)
      }
    })

    await step('arrival boundaries: standing just inside docks, just outside reads as distant', async () => {
      const { readableRange } = experienceConfig.content
      for (const camp of camps.slice(1)) {
        for (const direction of [-1, 1]) {
          const edge = camp.progress + direction * readableRange
          if (edge >= 1) continue
          let inside = 0, outside = 0
          for (let k = 1; k <= 5; k++) {
            await scrollToProgress(page, edge + direction * k * .002)
            await settle(page)
            const state = (await campStates(page))[camp.order]
            if (state.inert) {
              outside++
              expect(state.visibility === 'hidden' || Number(state.opacity) < .5 || state.presence < .85, `${camp.navigation} ${direction < 0 ? 'approach' : 'departure'} +${k}: inert but presence ${state.presence.toFixed(2)}`).toBe(true)
            } else {
              inside++
              expect(state, `${camp.navigation} docked at +${k}`).toMatchObject({ spatial: 'readable', transform: 'none', opacity: '1' })
            }
          }
          expect(outside, `${camp.navigation} ${direction < 0 ? 'approach' : 'departure'} leaves the zone`).toBeGreaterThan(0)
          if (camp.order > 1 || direction > 0) expect(inside, `${camp.navigation} ${direction < 0 ? 'approach' : 'departure'} fringe`).toBeGreaterThan(0)
        }
      }
    })

    await step('ASCEND, trail checkpoints and the HOME return', async () => {
      await goToCamp(page, 0)
      await page.locator('.home-explore').click()
      await expectArrived(page, 1)
      for (const index of [3, 5, 2, 4, 1]) {
        await page.locator('.trail-checkpoint').nth(index).click()
        await expectArrived(page, index)
      }
      await page.locator('.trail-checkpoint').nth(5).click()
      await expectArrived(page, 5)
      await page.locator('.journey-home').click()
      // The destination is named at once; the descent shows on the marker.
      await expect(page.locator('.current-location strong')).toHaveText(camps[0].navigation, { timeout: 500 })
      await expectArrived(page, 0)
      expect(await homeGeometry(), 'Home restores to its first-paint pixels').toEqual(initialHome)
      // A return taken over without wheel/touch/key input (dragging the scrollbar) hands control back.
      await page.locator('.home-explore').click()
      await expectArrived(page, 1)
      await page.locator('.trail-checkpoint').nth(5).click()
      await expectArrived(page, 5)
      await page.locator('.journey-home').click()
      await page.waitForTimeout(250)
      await scrollToProgress(page, camps[3].progress)
      // Chrome finishes the interrupted smooth step, so the walker stands near (not at) the camp center.
      await expectArrived(page, 3, { atCenter: false })
    })

    await step('Projects: selection, detail round trip and restored selection', async () => {
      await goToCamp(page, 4)
      for (const [index, project] of projects.entries()) {
        await page.locator('.project-row').nth(index).click()
        await expect(page.locator('.project-row').nth(index)).toHaveAttribute('aria-pressed', 'true')
        await expect(page.locator('.project-preview h2')).toHaveText(project.name)
        await expect(page.locator('.project-open')).toHaveAttribute('href', `/project/${project.slug}`)
      }
      const pick = projects[2]
      await page.locator('.project-row').nth(2).click()
      await page.locator('.project-open').click()
      await expect(page).toHaveURL(`${base}/project/${pick.slug}`)
      await expect(page.locator('.detail-title')).toHaveText(pick.name)
      await expect(page.locator('.detail-title')).toBeFocused()
      await expect(page.locator('canvas')).toHaveCount(0)
      await page.locator('.back-link').click()
      await expect(page).toHaveURL(`${base}/#high-camp`)
      await ready(page)
      await expectArrived(page, 4)
      await expect(page.locator('.project-row').nth(2)).toHaveAttribute('aria-pressed', 'true')
      // Browser back from a project page returns to the same camp and selection.
      await page.locator('.project-open').click()
      await expect(page.locator('.detail-title')).toHaveText(pick.name)
      await page.goBack()
      await ready(page)
      await expectArrived(page, 4)
      await expect(page.locator('.project-row').nth(2)).toHaveAttribute('aria-pressed', 'true')
    })

    await step('contact links come from profile data', async () => {
      await goToCamp(page, 5)
      await expect(page.locator(`a.contact-item[href="mailto:${profile.email}"] .contact-address`)).toHaveText(profile.email)
      await expect(page.locator(`a.contact-item[href="tel:${profile.phone.replaceAll('-', '')}"] .contact-address`)).toHaveText(profile.phone)
    })

    await step('a new document always starts at Home', async () => {
      await goToCamp(page, 4)
      await page.reload()
      await ready(page)
      await expectArrived(page, 0)
      // A new tab on a shared camp link still begins the journey at Home.
      const fresh = await context.newPage()
      await fresh.goto(`${base}/#high-camp`)
      await ready(fresh)
      await expectArrived(fresh, 0)
      expect(new URL(fresh.url()).hash).toBe('')
      await fresh.close()
    })
    await context.close()
  }

  // ──────────────────────────── Keyboard and focus ────────────────────────────
  await step('keyboard: skip link, focus order, inert camps never receive focus', async () => {
    const { context, page } = await open()
    await page.goto(base)
    await ready(page)
    await page.keyboard.press('Tab')
    await expect(page.locator('.skip-link')).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#title-high-camp')).toBeFocused()
    await expectArrived(page, 4)
    await page.keyboard.press('Tab')
    await expect(page.locator('.project-row').first()).toBeFocused()
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab')
      const leaked = await page.evaluate(() => { const active = document.activeElement; return active?.closest('[inert]') ? active.outerHTML.slice(0, 80) : null })
      expect(leaked, 'focus entered an inert camp').toBeNull()
    }
    await goToCamp(page, 2)
    const steps = page.locator('.workflow-step')
    for (let i = 0; i < await steps.count(); i++) {
      await steps.nth(i).click()
      await expect(steps.nth(i)).toHaveAttribute('aria-expanded', 'true')
      await expect(page.locator('.workflow-step[aria-expanded="true"]')).toHaveCount(1)
    }
    await context.close()
  })

  // ─────────────────────────────── Project pages ───────────────────────────────
  await step('project deep links, legacy slugs and the missing route', async () => {
    const { context, page } = await open()
    for (const [width, height] of [[1440, 900], [390, 844]]) {
      await page.setViewportSize({ width, height })
      for (const [index, project] of projects.entries()) {
        await page.goto(`${base}/project/${project.slug}`)
        await expect(page.locator('.detail-title')).toHaveText(project.name)
        await expect(page.locator('.case-section')).toHaveCount((project.caseStudy ?? processCaseStudy).length)
        await expect(page.locator('.detail-meta dt')).toHaveText(['Role', 'Period', 'Type', ...project.status ? ['Status'] : []])
        await expect(page.locator('.detail-meta dd').first()).toHaveText(project.role)
        await expect(page.locator('.next-project')).toHaveAttribute('href', `/project/${projects[(index + 1) % projects.length].slug}`)
        await expect(page.locator('.back-link')).toHaveAttribute('href', '/#high-camp')
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${project.slug} @${width}`).toBe(true)
      }
    }
    for (const [legacy, slug] of Object.entries(legacyProjectSlugs)) {
      await page.goto(`${base}/project/${legacy}`)
      await expect(page).toHaveURL(`${base}/project/${slug}`)
    }
    await page.goto(`${base}/project/not-a-project`)
    await expect(page.locator('.not-found h1')).toBeVisible()
    await context.close()
  })

  // ───────────────────────────── Responsive layout ─────────────────────────────
  await step(`layout at ${viewports.length} viewports: fits, clear of the HUD, Projects-only scroll`, async () => {
    const report: string[] = []
    const { context, page } = await open({ reducedMotion: 'reduce' })
    await page.goto(base)
    await ready(page)
    for (const [width, height] of viewports) {
      await page.setViewportSize({ width, height })
      await settle(page)
      for (const camp of camps.slice(1)) {
        await goToCamp(page, camp.order)
        const issues = await layoutIssues(page, camp.order)
        if (camp.id === 'camp-one') {
          const steps = page.locator('#camp-one .workflow-step')
          for (let i = 0; i < await steps.count(); i++) { await steps.nth(i).click(); await page.waitForTimeout(400); issues.push(...(await layoutIssues(page, camp.order)).map(issue => `step ${i + 1}: ${issue}`)) }
          await steps.first().click()
        }
        if (camp.id === 'high-camp') for (let i = 0; i < projects.length; i++) { await page.locator('.project-row').nth(i).click(); issues.push(...(await layoutIssues(page, camp.order)).map(issue => `${projects[i].slug}: ${issue}`)) }
        if (issues.length) report.push(`${width}x${height} ${camp.navigation}: ${[...new Set(issues)].join('; ')}`)
      }
      await goToCamp(page, 0)
      const home = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, title: document.querySelector('#title-base-camp')!.getBoundingClientRect().right <= innerWidth, ascend: document.querySelector('.home-explore')!.getBoundingClientRect().bottom <= innerHeight }))
      if (home.overflow || !home.title || !home.ascend) report.push(`${width}x${height} Home: ${JSON.stringify(home)}`)
    }
    await context.close()
    expect(report).toEqual([])
  })

  // ───────────────────────── Reduced motion, touch, DPR 3 ─────────────────────────
  await step('reduced motion: no spatial transforms, no ripple, instant arrival', async () => {
    const { context, page } = await open({ reducedMotion: 'reduce' })
    await page.goto(base)
    await ready(page)
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('.hero-period')!, '::after').animationName)).toBe('none')
    await page.locator('.home-explore').click()
    await expectArrived(page, 1)
    await scrollToProgress(page, (camps[1].progress + camps[2].progress) / 2)
    await settle(page)
    expect((await campStates(page)).every(state => state.transform === 'none'), 'no transformed compositions').toBe(true)
    await context.close()
  })

  await step('mobile touch at DPR 3: trail tap, project tap', async () => {
    const { context, page } = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 })
    await page.goto(base)
    await ready(page)
    await page.locator('.home-explore').tap()
    await expectArrived(page, 1)
    await page.locator('.trail-checkpoint').nth(4).tap()
    await expectArrived(page, 4)
    await expect(page.locator('.trail-mobile-label')).toHaveText(camps[4].navigation)
    await page.locator('.project-row').nth(1).tap()
    await page.locator('.project-open').tap()
    await expect(page.locator('.detail-title')).toHaveText(projects[1].name)
    await context.close()
  })

  // ─────────────────────────────── WebGL fallback ───────────────────────────────
  const expectReadingRoute = async (page: Page) => {
    await expect(page.locator('.reading-mode')).toBeVisible({ timeout: 30000 })
    await expect(page.locator('canvas')).toHaveCount(0)
    await expect(page.locator('[data-checkpoint]')).toHaveCount(camps.length)
    await expect(page.locator('[data-checkpoint][inert]')).toHaveCount(0)
    await expect(page.locator('[data-checkpoint][aria-hidden="true"]')).toHaveCount(0)
    for (const camp of camps) await expect(page.locator(`#title-${camp.id}`)).toBeVisible()
    // The trail joins once Home has scrolled away, as in the 3D journey.
    await page.locator('#about').scrollIntoViewIfNeeded()
    await expect(page.locator('.hud')).toHaveAttribute('data-home', 'false')
    await page.locator('.trail-checkpoint').nth(4).click()
    await expect(page.locator('#high-camp')).toBeInViewport()
    await page.locator('.project-open').click()
    await expect(page.locator('.detail-title')).toHaveText(projects[0].name)
  }

  for (const viewport of [desktop, { width: 390, height: 844 }]) {
    await step(`WebGL unavailable at ${viewport.width}px: full reading route`, async () => {
      const { context, page } = await open({ viewport }, [/WebGL/i], () => {
        const original = HTMLCanvasElement.prototype.getContext
        HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
          if (/webgl/i.test(type)) return null
          return Reflect.apply(original, this, [type, ...args])
        } as typeof original
      })
      await page.goto(base)
      await expectReadingRoute(page)
      await context.close()
    })
  }

  await step('WebGL context loss: reading route without inert content', async () => {
    const { context, page } = await open({}, [/WebGL/i, /context lost/i])
    await page.goto(base)
    await ready(page)
    await page.evaluate(() => {
      const canvas = document.querySelector('canvas')!
      ;(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))?.getExtension('WEBGL_lose_context')?.loseContext()
    })
    await expectReadingRoute(page)
    await context.close()
  })

  expect(errors, 'browser errors').toEqual([])
  console.log(`\n${passed.length} browser checks passed against ${base}`)
} finally {
  await browser.close()
  await closeServer()
}
