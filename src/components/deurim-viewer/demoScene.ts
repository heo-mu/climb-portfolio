import { DEMO_PRODUCT } from './data/demoProduct'
import { buildLayout } from './utils/layout'
import { buildInstallationReport } from './utils/fitCalculator'
import { buildIssueHighlights } from './utils/issueGeometry'
import { cameraSubject } from './utils/cameraPolicy'
import type { InstallationSpace } from './types/space'

// The same RF85DB90B2AP / 150cm setup shown in the original result rows.
export const product = DEMO_PRODUCT
export const space: InstallationSpace = {
  widthMm: 1500, heightMm: 2000, depthMm: 1000, hasLeftWall: true, hasRightWall: true,
}
const placement = { offsetXMm: 0, offsetZMm: 0 }
export const doorAnglesDeg = {}
export const layout = buildLayout(product, space, placement)
export const report = buildInstallationReport({ product, space, placement, layout, doorAnglesDeg, collisionSafetyMarginMm: 0 })
export const highlights = buildIssueHighlights(report.doorClearance, layout.product!, space)
export const subject = cameraSubject(space, layout.product!.body)
export const issueFor = (side: 'left' | 'right') => highlights.find(issue => issue.region === side)!
