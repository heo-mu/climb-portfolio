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
// 1280x600: a 1920x1080 laptop at 150% scaling, once the browser's own toolbars are taken off.
const viewports = [[1920, 1080], [1600, 900], [1440, 900], [1366, 768], [1280, 800], [1280, 600], [1200, 800], [1024, 768], [768, 1024], [430, 932], [390, 844]] as const
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
  if (process.env.ASCENT_CHECKS && !new RegExp(process.env.ASCENT_CHECKS, 'i').test(name)) return
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
    const location = document.querySelector('.current-location')!
    const header = (location as HTMLElement).style.visibility === 'hidden' ? undefined : location.querySelector('strong')!.textContent
    const trail = document.querySelector('.trail-checkpoint[aria-current]')?.getAttribute('aria-label')?.replace(/^\d+ /, '')
    sections.forEach(section => {
      const composition = section.querySelector<HTMLElement>('.spatial-panel, .home-layout')!
      const measured = section.querySelector<HTMLElement>('.panel-content') ?? composition
      const visible = getComputedStyle(section).visibility === 'visible' ? Number(getComputedStyle(composition).opacity) : 0
      const presence = measured.getBoundingClientRect().width / measured.offsetWidth
      const name = section.querySelector('.panel-kicker span:last-child')?.textContent ?? 'Home'
      const at = `${Math.round(now - start)}ms scroll=${(scrollY / range).toFixed(4)}`
      if (section.inert && visible > .5 && presence > .85 && !(section.id === 'high-camp' && visible < 1)) { seen.add(`ghost-${name}`); flag(`ghost-${name}`, `${at}: ${name} looks arrived (presence ${presence.toFixed(2)}, opacity ${visible.toFixed(2)}) but is inert`) }
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

/** Landscape screens show the selected project on its 3D structure: on view, clear of the panel and the HUD. */
async function exhibitIssues(page: Page, slug: string) {
  if (await page.locator('.expedition').getAttribute('data-showcase') !== '3d') return []
  await expect(page.locator('.expedition')).toHaveAttribute('data-showcase-project', slug)
  return page.evaluate(() => {
    const link = document.querySelector<HTMLElement>('.showcase-link')!, display = link.getBoundingClientRect()
    if (getComputedStyle(link).visibility !== 'visible') return ['exhibit not on view']
    const hit = (box: DOMRect) => display.left < box.right && display.right > box.left && display.top < box.bottom && display.bottom > box.top
    const issues: string[] = []
    if (hit(document.querySelector('#high-camp .panel-content')!.getBoundingClientRect())) issues.push('exhibit under the panel')
    if (['.altitude-hud', '.journey-home', '.current-location', '.trail-checkpoint .nav-label'].some(selector => Array.from(document.querySelectorAll(selector)).some(element => hit(element.getBoundingClientRect())))) issues.push('exhibit under the HUD')
    if (display.left < 0 || display.top < 0 || display.right > innerWidth || display.bottom > innerHeight) issues.push('exhibit cut by the viewport')
    return issues
  })
}

try {
  // ───────────────────────────── Journey (desktop) ─────────────────────────────
  {
    const { context, page } = await open()
    // Match both original dev URLs and fingerprinted production capture filenames.
    const captureRequests: string[] = []
    context.on('request', request => { if (projects.some(project => {
      const source = new URL(project.screen.desktop).pathname.split('/').at(-1)!
      const name = new URL(request.url()).pathname.split('/').at(-1)!
      const dot = source.lastIndexOf('.')
      return name === source || (name.startsWith(source.slice(0, dot) + '-') && name.endsWith(source.slice(dot)))
    })) captureRequests.push(request.url()) })
    await page.goto(base, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('#title-base-camp')).toBeVisible()
    await ready(page)
    // Compare against the settled title page, after its one-off entrance (the period ripple loops).
    await page.waitForFunction(() => document.getAnimations().every(animation => animation.effect?.getTiming().iterations === Infinity || animation.playState === 'finished'))
    const homeGeometry = () => page.evaluate(() => ['.home-identity', '#title-base-camp', '.home-intro', '.home-explore'].map(selector => { const r = document.querySelector(selector)!.getBoundingClientRect(); return [r.left, r.top, r.width, r.height] }))
    const initialHome = await homeGeometry()

    await step('first paint: Home settled, altitude and trail hidden, no internal scroll, no project captures', async () => {
      await expectArrived(page, 0)
      await expect(page.locator('.hud')).toHaveAttribute('data-home', 'true')
      expect(await page.evaluate(() => document.documentElement.scrollTop)).toBe(0)
      await page.waitForTimeout(1500)
      expect(captureRequests, 'captures requested at Home').toEqual([])
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
          // The first leg slows more strongly near About, so 5 metres span more scroll.
          for (let k = 1; k <= 40; k++) {
            await scrollToProgress(page, edge + direction * k * .002)
            await settle(page)
            const state = (await campStates(page))[camp.order]
            if (state.inert) {
              outside++
              expect(state.visibility === 'hidden' || Number(state.opacity) < .5 || state.presence < .85 || (camp.order === 4 && Number(state.opacity) < 1), `${camp.navigation} ${direction < 0 ? 'approach' : 'departure'} +${k}: inert but presence ${state.presence.toFixed(2)}`).toBe(true)
            } else {
              inside++
              expect(state, `${camp.navigation} docked at +${k}`).toMatchObject({ spatial: 'readable', transform: 'none', opacity: '1' })
            }
            if (outside >= 2) break
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

    await step('HOME control: hit target and full return from every camp, mid-gesture at the summit, keyboard', async () => {
      const homeCenter = async () => { const box = (await page.locator('.journey-home').boundingBox())!; return [box.x + box.width / 2, box.y + box.height / 2] as const }
      /** Panel exit, location, altitude and trail all follow one continuous descent to Home. */
      const expectReturn = async (from: number) => {
        const descent = await page.evaluate(from => new Promise<{ exitMs: number; homeMs: number; altitudes: number[]; dash: number[] }>(resolve => {
          const section = document.querySelector(`[data-checkpoint="${from}"]`)!, completed = document.querySelector('.trail-completed')!
          const start = performance.now(), altitudes: number[] = [], dash: number[] = []
          let exitMs = -1, homeMs = -1
          const tick = () => {
            const t = performance.now() - start
            if (exitMs < 0 && section.hasAttribute('inert')) exitMs = t
            if (homeMs < 0 && document.querySelector('.current-location strong')!.textContent === 'Home') homeMs = t
            altitudes.push(Number(document.querySelector('.altitude-number')!.textContent))
            dash.push(Number(completed.getAttribute('stroke-dashoffset')))
            if (t < 700) requestAnimationFrame(tick); else resolve({ exitMs, homeMs, altitudes, dash })
          }
          requestAnimationFrame(tick)
        }), from)
        const name = camps[from].navigation
        expect(descent.exitMs, `${name} panel leaves input at once`).toBeGreaterThanOrEqual(0)
        expect(descent.exitMs).toBeLessThan(100)
        expect(descent.homeMs, `${name}: location names Home at once`).toBeGreaterThanOrEqual(0)
        expect(descent.homeMs).toBeLessThan(200)
        expect(descent.altitudes.every((value, i) => !i || value <= descent.altitudes[i - 1]), `${name}: altitude only falls`).toBe(true)
        expect(descent.altitudes.at(-1)!, `${name}: altitude falls`).toBeLessThan(descent.altitudes[0])
        expect(descent.dash.every((value, i) => !i || value >= descent.dash[i - 1] - 1e-6), `${name}: trail only retracts`).toBe(true)
        await expectArrived(page, 0)
        await expect(page.locator('.journey-home')).toHaveAttribute('data-visible', 'false')
      }
      for (const camp of camps.slice(1)) {
        await goToCamp(page, camp.order)
        const [x, y] = await homeCenter()
        expect(await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest('.journey-home'), [x, y] as const), `HOME is the hit target at ${camp.navigation}`).toBe(true)
        await page.mouse.click(x, y)
        await expectReturn(camp.order)
      }
      // Reaching the summit with a fling: the page is pinned at the bottom while the
      // gesture keeps emitting wheel events. Pressing HOME then must still return.
      await goToCamp(page, 5)
      const [x, y] = await homeCenter()
      await page.mouse.move(900, 500)
      const trailing = (async () => { for (let i = 0; i < 30; i++) { await page.mouse.wheel(0, 30); await page.waitForTimeout(16) } })()
      await page.waitForTimeout(120)
      await page.mouse.click(x, y)
      await trailing
      await expect(page.locator('[data-checkpoint="0"]')).toHaveAttribute('aria-hidden', 'false', { timeout: 15000 })
      await expect(page.locator('.current-location strong')).toHaveText(camps[0].navigation)
      // Keyboard: Tab to the control, then Enter or Space.
      for (const key of ['Enter', ' ']) {
        await goToCamp(page, 5)
        for (let i = 0; i < 20 && !await page.evaluate(() => document.activeElement?.classList.contains('journey-home')); i++) await page.keyboard.press('Tab')
        await expect(page.locator('.journey-home')).toBeFocused()
        await page.keyboard.press(key)
        await expectReturn(5)
      }
    })

    await step('wheel over the Projects panel continues the journey (no scroll trap)', async () => {
      for (const [width, height] of [[1440, 900], [1366, 768]]) {
        await page.setViewportSize({ width, height })
        await goToCamp(page, 4)
        const box = (await page.locator('#high-camp .panel-content').boundingBox())!
        await page.mouse.move(box.x + box.width * .6, box.y + box.height * .5)
        const before = await page.evaluate(() => scrollY)
        for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(60) }
        await expect.poll(() => page.evaluate(() => scrollY), { timeout: 3000, message: `${width}x${height}: page moves on past Projects` }).toBeGreaterThan(before + 400)
      }
      await page.setViewportSize(desktop)
      await settle(page)
    })

    await step('Projects boundaries, responsive badges and Trail nodes', async () => {
      await goToCamp(page, 4)
      await page.locator('#high-camp button[aria-expanded]').nth(2).click()
      await expect(page.locator('.expedition')).toHaveAttribute('data-showcase-project', projects[2].slug)
      await goToCamp(page, 5)
      await goToCamp(page, 4)
      await expect(page.locator('#high-camp button[aria-expanded]').nth(2)).toHaveAttribute('aria-expanded', 'true')
      await expect(page.locator('.expedition')).toHaveAttribute('data-showcase-project', projects[2].slug)
      // Sample the whole reading dwell from both sides, not only the camp centre.
      for (const progress of [.75, .7715, .78, .8, .824, .8284, .85, .8284, .824, .8, .78, .7715, .75]) {
        await scrollToProgress(page, progress)
        await settle(page)
        const arrived = !await page.locator('#high-camp').evaluate((element: HTMLElement) => element.inert)
        if (arrived) {
          await expect(page.locator('.expedition')).toHaveAttribute('data-showcase-presence', '1')
          expect(await exhibitIssues(page, projects[2].slug)).toEqual([])
          await expect(page.locator('.trail-checkpoint').nth(4)).toHaveAttribute('aria-current', 'step')
        } else await expect(page.locator('.trail-checkpoint').nth(4)).not.toHaveAttribute('aria-current', 'step')
      }
      const sizes = [[1920, 1080], [1600, 900], [1440, 900], [1366, 768], [1280, 800], [1024, 768], [430, 932], [390, 844]]
      for (const [width, height] of sizes) {
        await page.setViewportSize({ width, height })
        await goToCamp(page, 4)
        const headingStyles = await page.locator('.portfolio-heading').evaluateAll(elements => elements.map(element => {
          const style = getComputedStyle(element)
          return [style.fontSize, style.fontWeight, style.lineHeight, style.letterSpacing, style.color, style.opacity, style.transform]
        }))
        headingStyles.forEach(style => expect(style, `shared heading system @${width}`).toEqual(headingStyles[0]))
        let indexBox: { x: number; y: number; width: number; height: number } | null = null
        for (const [index, project] of projects.entries()) {
          await page.locator('#high-camp button[aria-expanded]').nth(index).click()
          await expect(page.locator('#high-camp button[aria-expanded=true] .project-name-full')).toHaveText(project.name)
          await expect(page.locator('#high-camp [role=region][aria-hidden=false] .project-tags li')).toHaveText(project.tags.map(tag => `#${tag}`))
          expect(await layoutIssues(page, 4), `${width}: ${project.slug}`).toEqual([])
          expect(await exhibitIssues(page, project.slug), `${width}: ${project.slug}`).toEqual([])
          await page.locator('.project-index').evaluate(element => Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {}))))
          const box = (await page.locator('.project-index').boundingBox())!
          if (indexBox) for (const key of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(box[key] - indexBox[key]), `stable index ${key} @${width}`).toBeLessThan(1)
          indexBox = box
          if (width >= 1440) expect(await page.locator('#high-camp .panel-content').evaluate(element => element.scrollHeight <= element.clientHeight + 1)).toBe(true)
        }
        const nodes = await page.evaluate(() => {
          const svg = document.querySelector<SVGSVGElement>('.trail-map')!, path = svg.querySelector<SVGPathElement>('.trail-remaining')!
          const matrix = svg.getScreenCTM()!, length = path.getTotalLength()
          return Array.from(document.querySelectorAll<HTMLElement>('.trail-node')).map(node => {
            const rect = node.getBoundingClientRect(), style = getComputedStyle(node)
            let distance = Infinity
            for (let offset = 0; offset <= length; offset += .25) {
              const point = path.getPointAtLength(offset), screen = new DOMPoint(point.x, point.y).matrixTransform(matrix)
              distance = Math.min(distance, Math.hypot(screen.x - rect.x - rect.width / 2, screen.y - rect.y - rect.height / 2))
            }
            return { size: rect.width, active: !!node.closest('[aria-current]'), opacity: Number(style.opacity), distance }
          })
        })
        for (const node of nodes) {
          expect(node.size).toBe(node.active ? 6 : 4)
          expect(node.opacity).toBeGreaterThanOrEqual(.4)
          expect(node.distance, `node on path @${width}`).toBeLessThan(.3)
        }
        expect(await page.locator('#high-camp [role=region][aria-hidden=false] .project-tags li').first().evaluate(element => getComputedStyle(element).fontSize)).toBe('11px')
      }
      await page.setViewportSize(desktop)
      await settle(page)
      await goToCamp(page, 0)
      await goToCamp(page, 4)
      await expect(page.locator('#high-camp button[aria-expanded=true] .project-name-full')).toHaveText(projects[4].name)
      await page.locator('#high-camp button[aria-expanded]').first().click()
    })

    await step('project exhibit: each original capture lit on the shared display, clear of the text and the HUD', async () => {
      await goToCamp(page, 4)
      await expect(page.locator('.expedition')).toHaveAttribute('data-showcase', '3d')
      // Worker textures and the responsive DOM preview share source URLs, but
      // each consumer can emit a request event even when the HTTP cache serves it.
      await expect.poll(() => new Set(captureRequests).size, { message: 'all original captures requested on approach' }).toBe(projects.length)
      for (const [index, project] of projects.entries()) {
        await page.locator('#high-camp button[aria-expanded]').nth(index).click()
        await expect(page.locator('.expedition')).toHaveAttribute('data-showcase-project', project.slug)
        await expect(page.locator('.expedition')).toHaveAttribute('data-showcase-lit', 'true', { timeout: 15000 })
        await expect(page.locator('.showcase-link')).toHaveAttribute('href', `/project/${project.slug}`)
        const layout = await page.evaluate(() => {
          const rect = (selector: string) => document.querySelector(selector)!.getBoundingClientRect()
          const hit = (a: DOMRect, b: DOMRect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
          const display = rect('.showcase-link'), labels = Array.from(document.querySelectorAll('.trail-checkpoint .nav-label')).map(label => label.getBoundingClientRect())
          return {
            shown: getComputedStyle(document.querySelector('.showcase-link')!).visibility, share: display.width / innerWidth,
            text: ['#high-camp .project-index', '#high-camp .portfolio-heading'].some(selector => hit(display, rect(selector))),
            hud: ['.altitude-hud', '.journey-home', '.current-location'].some(selector => hit(display, rect(selector))) || labels.some(label => hit(display, label)),
            inside: display.left >= 0 && display.top >= 0 && display.right <= innerWidth && display.bottom <= innerHeight,
          }
        })
        expect(layout, project.slug).toMatchObject({ shown: 'visible', text: false, hud: false, inside: true })
        expect(layout.share, `${project.slug}: a hero, not a thumbnail`).toBeGreaterThan(.35)
      }
    })

    await step('Projects: selection, detail round trip and restored selection', async () => {
      await goToCamp(page, 4)
      await page.locator('#high-camp button[aria-expanded]').first().click()
      await expect(page.locator('#high-camp button[aria-expanded=true] .project-name-full')).toHaveText(projects[0].name)
      await expect(page.locator('#high-camp button[aria-expanded]').first()).toHaveAttribute('aria-expanded', 'true')
      await expect(page.locator('.expedition')).toHaveAttribute('data-showcase-project', projects[0].slug)
      for (const [index, project] of projects.entries()) {
        await page.locator('#high-camp button[aria-expanded]').nth(index).click()
        await expect(page.locator('#high-camp button[aria-expanded]').nth(index)).toHaveAttribute('aria-expanded', 'true')
        await expect(page.locator('#high-camp button[aria-expanded=true] .project-name-full')).toHaveText(project.name)
        await expect(page.getByRole('link', { name: '프로젝트 보기', exact: true })).toHaveAttribute('href', `/project/${project.slug}`)
      }
      const pick = projects[2]
      await page.locator('#high-camp button[aria-expanded]').nth(2).click()
      // The exhibit itself opens the project too.
      await expect(page.locator('.expedition')).toHaveAttribute('data-showcase-project', pick.slug)
      await page.locator('.showcase-link').click()
      await expect(page).toHaveURL(`${base}/project/${pick.slug}`)
      await page.goBack()
      await ready(page)
      await expectArrived(page, 4)
      await expect(page.locator('.expedition')).toHaveAttribute('data-showcase-project', pick.slug)
      await page.getByRole('link', { name: '프로젝트 보기', exact: true }).click()
      await expect(page).toHaveURL(`${base}/project/${pick.slug}`)
      await expect(page.locator('.detail-title')).toHaveText(pick.name)
      await expect(page.locator('.detail-title')).toBeFocused()
      await expect(page.locator('canvas')).toHaveCount(0)
      await page.locator('.back-link').click()
      await expect(page).toHaveURL(`${base}/#high-camp`)
      await ready(page)
      await expectArrived(page, 4)
      await expect(page.locator('#high-camp button[aria-expanded]').nth(2)).toHaveAttribute('aria-expanded', 'true')
      // Browser back from a project page returns to the same camp and selection.
      await page.getByRole('link', { name: '프로젝트 보기', exact: true }).click()
      await expect(page.locator('.detail-title')).toHaveText(pick.name)
      await page.goBack()
      await ready(page)
      await expectArrived(page, 4)
      await expect(page.locator('#high-camp button[aria-expanded]').nth(2)).toHaveAttribute('aria-expanded', 'true')
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
    await expect(page.locator('#high-camp button[aria-expanded]').first()).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: '프로젝트 보기', exact: true })).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    const projectsScroll = await page.evaluate(() => scrollY)
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('#high-camp button[aria-expanded]').nth(1)).toBeFocused()
    await expect(page.locator('#high-camp button[aria-expanded]').nth(1)).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('End')
    await expect(page.locator('#high-camp button[aria-expanded]').last()).toBeFocused()
    await page.keyboard.press('Home')
    await expect(page.locator('#high-camp button[aria-expanded]').first()).toBeFocused()
    await expect(page.locator('#high-camp button[aria-expanded]').first()).toHaveAttribute('aria-expanded', 'true')
    expect(await page.evaluate(() => scrollY)).toBe(projectsScroll)
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
        if (camp.id === 'high-camp') for (let i = 0; i < projects.length; i++) {
          await page.locator('#high-camp button[aria-expanded]').nth(i).click()
          issues.push(...[...await layoutIssues(page, camp.order), ...await exhibitIssues(page, projects[i].slug)].map(issue => `${projects[i].slug}: ${issue}`))
        }
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
  await step('Projects capture readiness: a fast visit never activates an empty exhibit', async () => {
    const { context, page } = await open({ reducedMotion: 'reduce' })
    let release = () => {}
    const captureGate = new Promise<void>(resolve => { release = resolve })
    await context.route(/deurim.*\.png/, async route => { await captureGate; await route.continue() })
    try {
      await page.goto(base)
      await ready(page)
      await scrollToProgress(page, checkpoints[4].progress)
      await settle(page)
      await expect(page.locator('#high-camp')).toHaveAttribute('aria-hidden', 'true')
      await expect(page.locator('.trail-checkpoint').nth(4)).not.toHaveAttribute('aria-current', 'step')
      release()
      await expectArrived(page, 4)
      await expect(page.locator('.expedition')).toHaveAttribute('data-showcase-presence', '1')
      await expect(page.locator('.expedition')).toHaveAttribute('data-showcase-project', projects[0].slug)
    } finally { release(); await context.close() }
  })

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
    // Phones show the capture itself, flat and whole, instead of the 3D exhibit.
    await expect(page.locator('.expedition')).toHaveAttribute('data-showcase', '2d')
    await page.locator('#high-camp button[aria-expanded]').nth(1).tap()
    await expect.poll(() => page.evaluate(() => { const img = document.querySelector<HTMLImageElement>('#high-camp .project-screen img[data-active="true"]'); return img ? img.complete && img.naturalWidth > 0 && /bees[-.]/.test(img.currentSrc) : false })).toBe(true)
    await page.getByRole('link', { name: '프로젝트 보기', exact: true }).tap()
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
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'reading route scrolls horizontally').toBe(true)
    // The notice explaining the reading route is not covered by Home.
    expect(await page.evaluate(() => { const note = document.querySelector('.fallback-note')!, r = note.getBoundingClientRect(); return note.contains(document.elementFromPoint(r.left + 4, r.top + r.height / 2)) }), 'fallback notice visible').toBe(true)
    // The trail joins once Home has scrolled away, as in the 3D journey.
    await page.locator('#about').scrollIntoViewIfNeeded()
    await expect(page.locator('.hud')).toHaveAttribute('data-home', 'false')
    const overlaps = await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('.trail-checkpoint .nav-label')).map(label => label.getBoundingClientRect()).filter(r => r.width)
      return Array.from(document.querySelectorAll('.panel-content')).filter(content => { const c = content.getBoundingClientRect(); return labels.some(l => c.right > l.left && c.left < l.right) }).map(content => content.closest('section')!.id)
    })
    expect(overlaps, 'sections running under the fixed trail').toEqual([])
    await page.locator('.trail-checkpoint').nth(4).click()
    await expect(page.locator('#high-camp')).toBeInViewport()
    await expect(page.locator('#high-camp .project-screen img[data-active="true"]')).toBeVisible()
    await page.getByRole('link', { name: '프로젝트 보기', exact: true }).click()
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

  await step('Projects slow drift: rendered camera, altitude and trail advance and reverse together', async () => {
    const { context, page } = await open({}, [], () => {
      // Inspect the view matrix actually uploaded to WebGL, not a duplicate route calculation.
      const probe = window as unknown as { renderedEye: number[] }
      probe.renderedEye = []
      const names = new WeakMap<WebGLUniformLocation, string>()
      const gl = WebGL2RenderingContext.prototype
      const location = gl.getUniformLocation, matrix = gl.uniformMatrix4fv
      gl.getUniformLocation = function (program, name) {
        const result = location.call(this, program, name)
        if (result) names.set(result, name)
        return result
      }
      gl.uniformMatrix4fv = function (location, transpose, data, ...offsets) {
        if (location && names.get(location) === 'viewMatrix') {
          const m = data as Float32Array
          probe.renderedEye = [0, 4, 8].map(i => -(m[i] * m[12] + m[i + 1] * m[13] + m[i + 2] * m[14]))
        }
        return matrix.call(this, location, transpose, data, ...offsets)
      }
    })
    await page.goto(base!)
    await ready(page)
    const settleCamera = () => page.evaluate(() => new Promise<void>((resolve, reject) => {
      let last = '', stable = 0, frames = 0
      const tick = () => {
        const value = (window as unknown as { renderedEye: number[] }).renderedEye.join(',')
        stable = value && value === last ? stable + 1 : 0
        last = value
        if (stable >= 5) resolve()
        else if (++frames > 300) reject(new Error('Rendered camera did not settle'))
        else requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }))
    const read = () => page.evaluate(() => ({
      eye: (window as unknown as { renderedEye: number[] }).renderedEye,
      altitude: Number(document.querySelector('.altitude-number')!.textContent),
      trail: Number(document.querySelector('.trail-completed')!.getAttribute('stroke-dashoffset')),
      marker: ['cx', 'cy'].map(axis => Number(document.querySelector('.trail-current')!.getAttribute(axis))),
      scroll: scrollY,
    }))
    for (const [width, height] of [[1440, 900], [1366, 768]]) {
      await page.setViewportSize({ width, height })
      const samples = []
      for (const progress of [.772, .785, .8, .815, .828]) {
        await scrollToProgress(page, progress)
        await expectArrived(page, 4, { atCenter: false })
        await settleCamera()
        expect(await exhibitIssues(page, projects[0].slug)).toEqual([])
        samples.push(await read())
      }
      for (let i = 1; i < samples.length; i++) {
        const previous = samples[i - 1], next = samples[i]
        expect(next.eye).toHaveLength(3)
        expect(Math.hypot(...next.eye.map((value, axis) => value - previous.eye[axis]))).toBeGreaterThan(.7)
        expect(next.eye[1]).toBeGreaterThan(previous.eye[1])
        expect(next.eye[2]).toBeLessThan(previous.eye[2])
        expect(next.altitude).toBeGreaterThan(previous.altitude)
        expect(next.trail).toBeLessThan(previous.trail)
        expect(Math.hypot(...next.marker.map((value, axis) => value - previous.marker[axis]))).toBeGreaterThan(.1)
      }
      for (const index of [3, 2, 1, 0]) {
        await scrollToProgress(page, [.772, .785, .8, .815, .828][index])
        await expectArrived(page, 4, { atCenter: false })
        await settleCamera()
        const back = await read(), outward = samples[index]
        expect(back.altitude).toBe(outward.altitude)
        expect(Math.abs(back.trail - outward.trail)).toBeLessThan(.01)
        expect(Math.hypot(...back.eye.map((value, axis) => value - outward.eye[axis]))).toBeLessThan(.01)
      }
      const beforeSelection = await read()
      for (const index of [1, 2, 3, 4, 0]) {
        await page.locator('#high-camp button[aria-expanded]').nth(index).click()
        await settle(page)
        expect(await read()).toEqual(beforeSelection)
      }
      console.log('Projects drift', width, samples.map(({ eye, altitude, trail }) => ({ eye, altitude, trail })))
    }
    await context.close()
  })

  await step('Projects performance: cached rapid selection and reversible journey', async () => {
    type Probe = { counts: Record<string, number>; tasks: number[] }
    const { context, page } = await open({}, [], () => {
      const probe: Probe = { counts: {}, tasks: [] }
      Object.assign(window, { projectProbe: probe })
      const gl = WebGL2RenderingContext.prototype as unknown as Record<string, (...args: unknown[]) => unknown>
      for (const name of ['createTexture', 'texImage2D', 'texSubImage2D', 'createBuffer', 'bufferData', 'createProgram']) {
        const original = gl[name]
        gl[name] = function (...args: unknown[]) { probe.counts[name] = (probe.counts[name] ?? 0) + 1; return Reflect.apply(original, this, args) }
      }
      new PerformanceObserver(list => { probe.tasks.push(...list.getEntries().map(entry => entry.duration)) }).observe({ type: 'longtask' })
    })
    const read = () => page.evaluate(() => (window as unknown as { projectProbe: Probe }).projectProbe)
    await page.goto(base)
    await ready(page)
    await goToCamp(page, 3)
    // Decode and upload the full originals on approach, not during selection.
    await page.waitForTimeout(1800)
    const approachStart = await read()
    await sweep(page, camps[3].progress, camps[4].progress, 1800)
    await expectArrived(page, 4, { atCenter: false })
    await expect(page.locator('#high-camp button[aria-expanded=true]')).toHaveAttribute('aria-label', '01 들임')
    const cdp = await context.newCDPSession(page)
    await cdp.send('Performance.enable')
    await cdp.send('HeapProfiler.collectGarbage')
    const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m: { name: string; value: number }) => [m.name, m.value]))
    const before = await read(), start = await metrics()
    const displayBefore = await page.locator('.showcase-link').boundingBox()
    const indexBefore = await page.locator('.project-index').boundingBox()
    const frames = await page.evaluate(async () => {
      const gaps: number[] = [], controls = Array.from(document.querySelectorAll<HTMLButtonElement>('#high-camp button[aria-expanded]'))
      let running = true, last = performance.now()
      const tick = (now: number) => { gaps.push(now - last); last = now; if (running) requestAnimationFrame(tick) }
      requestAnimationFrame(tick)
      for (let cycle = 0; cycle < 3; cycle++) for (const index of [0, 1, 2, 3, 4, 3, 2, 1, 0]) {
        controls[index].click()
        await new Promise(resolve => setTimeout(resolve, 90))
      }
      await new Promise(resolve => setTimeout(resolve, 400))
      running = false
      return gaps.sort((a, b) => a - b)
    })
    await expect(page.locator('#high-camp button[aria-expanded=true]')).toHaveAttribute('aria-label', '01 들임')
    await expect(page.locator('.expedition')).toHaveAttribute('data-showcase-project', 'deurim')
    const after = await read()
    expect(after.counts, 'no texture uploads, geometry buffers or programs created on click').toEqual(before.counts)
    expect(await page.locator('.showcase-link').boundingBox(), 'monitor remains fixed').toEqual(displayBefore)
    expect(await page.locator('.project-index').boundingBox(), 'index returns to its stable box').toEqual(indexBefore)
    await cdp.send('HeapProfiler.collectGarbage')
    const end = await metrics()
    expect(end.JSHeapUsedSize - start.JSHeapUsedSize, 'bounded heap after 27 selections').toBeLessThan(4 * 1024 * 1024)
    await sweep(page, camps[4].progress, camps[5].progress, 1600)
    await expectArrived(page, 5, { atCenter: false })
    await sweep(page, camps[5].progress, camps[4].progress, 1600)
    await expectArrived(page, 4, { atCenter: false })
    await expect(page.locator('.expedition')).toHaveAttribute('data-showcase-project', 'deurim')
    const finish = await read()
    console.log('Projects profile', JSON.stringify({
      approachLongTasks: before.tasks.slice(approachStart.tasks.length), selectionLongTasks: after.tasks.slice(before.tasks.length),
      journeyLongTasks: finish.tasks.slice(after.tasks.length), frameP95: frames[Math.floor(frames.length * .95)], maxFrame: frames.at(-1),
      heapGrowth: end.JSHeapUsedSize - start.JSHeapUsedSize, layouts: end.LayoutCount - start.LayoutCount,
      uploadsDuringSelection: (after.counts.texSubImage2D ?? 0) - (before.counts.texSubImage2D ?? 0),
    }))
    await context.close()
  })

  await step('Full ascent performance: cold captures across all five legs and four desktop sizes', async () => {
    type JourneyProbe = { tasks: { at: number; duration: number }[]; gpu: { at: number; name: string }[] }
    for (const [width, height] of [[1920, 1080], [1600, 900], [1440, 900], [1366, 768]]) {
      const { context, page } = await open({ viewport: { width, height }, reducedMotion: 'no-preference' }, [], () => {
        const probe: JourneyProbe = { tasks: [], gpu: [] }
        Object.assign(window, { journeyProbe: probe })
        new PerformanceObserver(list => {
          probe.tasks.push(...list.getEntries().map(e => ({ at: e.startTime, duration: e.duration })))
        }).observe({ type: 'longtask' })
        const gl = WebGL2RenderingContext.prototype as unknown as Record<string, (...args: unknown[]) => unknown>
        for (const name of ['texSubImage2D', 'compileShader', 'bufferData']) {
          const original = gl[name]
          gl[name] = function (...args: unknown[]) { probe.gpu.push({ at: performance.now(), name }); return Reflect.apply(original, this, args) }
        }
      })
      await page.goto(base)
      await ready(page)
      await page.waitForTimeout(1200)
      const cdp = await context.newCDPSession(page)
      await cdp.send('Performance.enable')
      const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m: { name: string; value: number }) => [m.name, m.value]))
      const before = await metrics()
      const timing = await page.evaluate(() => new Promise<{ start: number; frames: number[][] }>(resolve => {
        const start = performance.now(), range = document.documentElement.scrollHeight - innerHeight, frames: number[][] = [[], [], [], [], []]
        let last = start
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / 15000)
          frames[Math.min(4, Math.floor(progress * 5))].push(now - last)
          last = now
          scrollTo({ top: range * progress, behavior: 'instant' })
          if (progress < 1) requestAnimationFrame(tick)
          else resolve({ start, frames })
        }
        requestAnimationFrame(tick)
      }))
      await expectArrived(page, 5, { atCenter: false })
      const after = await metrics()
      const probe = await page.evaluate(() => (window as unknown as { journeyProbe: JourneyProbe }).journeyProbe)
      const report = timing.frames.map((frames, leg) => {
        frames.sort((a, b) => a - b)
        const inLeg = (at: number) => at >= timing.start + leg * 3000 && at < timing.start + (leg + 1) * 3000
        return { leg: `${camps[leg].navigation} → ${camps[leg + 1].navigation}`, p95: frames[Math.floor(frames.length * .95)], max: frames.at(-1), longTasks: probe.tasks.filter(task => inLeg(task.at)).map(task => task.duration), uploads: probe.gpu.filter(event => inLeg(event.at) && event.name === 'texSubImage2D').length, shaders: probe.gpu.filter(event => inLeg(event.at) && event.name === 'compileShader').length }
      })
      console.log('Full ascent profile', JSON.stringify({ viewport: `${width}x${height}`, legs: report, layoutMs: (after.LayoutDuration - before.LayoutDuration) * 1000, styleMs: (after.RecalcStyleDuration - before.RecalcStyleDuration) * 1000, scriptMs: (after.ScriptDuration - before.ScriptDuration) * 1000 }))
      for (const leg of report) {
        expect(leg.p95, `${width}: ${leg.leg} frame budget`).toBeLessThan(35)
        expect(Math.max(0, ...leg.longTasks), `${width}: ${leg.leg} perceptible main-thread stall`).toBeLessThan(100)
        expect(leg.shaders, `${width}: ${leg.leg} shaders prepared before travel`).toBe(0)
      }
      await sweep(page, 1, 0, 4000)
      await scrollToProgress(page, 0)
      await expectArrived(page, 0, { atCenter: false })
      await context.close()
    }
  })

  expect(errors, 'browser errors').toEqual([])
  console.log(`\n${passed.length} browser checks passed against ${base}`)
} finally {
  await browser.close()
  await closeServer()
}
