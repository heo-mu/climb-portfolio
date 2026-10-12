import { describe, expect, it } from 'vitest'
import { issueFor, layout, product, report, subject } from '../src/components/deurim-viewer/demoScene'
import { focusPose } from '../src/components/deurim-viewer/focusPose'

describe('Deurim validation demo source geometry', () => {
  it('keeps both displayed 0.1cm shortages consistent with the original calculator', () => {
    expect(product.identity.modelCode).toBe('RF85DB90B2AP')
    expect(layout.product?.body.size.x).toBe(912)
    expect(report.blocked).toBe(false)
    for (const side of ['left', 'right'] as const) {
      const issue = issueFor(side)
      const check = report.doorClearance.find(check => check.id === issue.checkId)!
      expect(check.status).toBe('fail')
      expect(check.availableMm).toBe(294)
      expect(check.requiredMm).toBe(295)
      expect(check.shortageMm).toBe(1)
      expect(issue.shortageVolumes.length).toBeGreaterThan(0)
    }
  })

  it('focuses opposite physical regions, without rotating the product', () => {
    const left = focusPose(issueFor('left'), subject, { width: 320, height: 267 })!
    const right = focusPose(issueFor('right'), subject, { width: 320, height: 267 })!
    expect(left.position.x).toBeLessThan(left.target.x)
    expect(right.position.x).toBeGreaterThan(right.target.x)
    expect(left.target.x).toBeLessThan(0)
    expect(right.target.x).toBeGreaterThan(0)
    expect(left.position.x).toBeCloseTo(-right.position.x)
    expect(left.position.y).toBeCloseTo(right.position.y)
  })

  it('retains the original narrow viewport focus correction', () => {
    const wide = focusPose(issueFor('left'), subject, { width: 320, height: 267 })!
    const narrow = focusPose(issueFor('left'), subject, { width: 240, height: 320 })!
    expect(narrow.target.toArray()).toEqual(wide.target.toArray())
    expect(narrow.position.distanceTo(narrow.target)).toBeGreaterThan(wide.position.distanceTo(wide.target))
  })
})
