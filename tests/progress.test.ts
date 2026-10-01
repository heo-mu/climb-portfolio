import { describe, expect, it } from 'vitest'
import { activeCheckpoint, advanceSectionUI, altitudeAt, readableCheckpoint, routeProgress, visibilityAt } from '../src/experience/progress'
import type { SectionUIState } from '../src/experience/progress'
import { checkpoints } from '../src/data/expedition'
import { cameraPose, groundHeight, routeCurve, terrainGeometry } from '../src/experience/terrain'
import { experienceConfig } from '../src/config/experience'
import { Vector3 } from 'three'

describe('expedition progression', () => {
  it('enables entering content immediately and completes animation without further scrolling', () => {
    let state: SectionUIState = { phase: 'hidden', amount: 0, interactive: false }
    state = advanceSectionUI(state, true, .01)
    expect(state.phase).toBe('entering')
    expect(state.interactive).toBe(true)
    for (let i = 0; i < 50; i++) state = advanceSectionUI(state, true, .01)
    expect(state).toEqual({ phase: 'active', amount: 1, interactive: true })
    state = advanceSectionUI(state, false, 0)
    expect(state.phase).toBe('exiting')
    expect(state.interactive).toBe(false)
    for (let i = 0; i < 30; i++) state = advanceSectionUI(state, false, .01)
    expect(state).toEqual({ phase: 'hidden', amount: 0, interactive: false })
    expect(advanceSectionUI(state, true, 0, true).phase).toBe('active')
  })
  it('keeps approach content completely hidden, including stopping before Projects', () => {
    expect(visibilityAt(.72, 4)).toBe(0)
    expect(readableCheckpoint(.72)).toBe(-1)
    const hidden: SectionUIState = { phase: 'hidden', amount: 0, interactive: false }
    expect(advanceSectionUI(hidden, false, 10)).toEqual(hidden)
  })
  it('retains the last arrived section between camps in either direction', () => {
    for (let index = 1; index < checkpoints.length; index++) {
      const midpoint = (checkpoints[index - 1].progress + checkpoints[index].progress) / 2
      expect(activeCheckpoint(midpoint, index - 1)).toBe(index - 1)
      expect(activeCheckpoint(midpoint, index)).toBe(index)
    }
  })
  it('activates navigation and readable content on the same spatial entry in both directions', () => {
    for (let index = 1; index < checkpoints.length; index++) {
      for (const direction of [-1, 1]) {
        const edge = checkpoints[index].progress + direction * experienceConfig.content.readableRange
        if (edge > 1) continue
        const previous = direction < 0 ? index - 1 : Math.min(index + 1, checkpoints.length - 1)
        expect(readableCheckpoint(edge + direction * 0.0001)).toBe(-1)
        expect(activeCheckpoint(edge + direction * 0.0001, previous)).toBe(previous)
        expect(readableCheckpoint(edge)).toBe(index)
        expect(activeCheckpoint(edge, previous)).toBe(index)
        expect(visibilityAt(edge, index)).toBe(1)
        // Jitter back out of the entered zone does not reactivate a neighbour.
        expect(activeCheckpoint(edge + direction * 0.0001, index)).toBe(index)
      }
    }
    expect(activeCheckpoint(1, 1)).toBe(5)
    expect(activeCheckpoint(0, 5)).toBe(0)
  })
  it('climbs smoothly from 1240 m to the 6956 m summit without a display-only override', () => {
    expect(altitudeAt(0)).toBe(1240)
    expect(altitudeAt(1)).toBe(6956)
    let previous = altitudeAt(0)
    for (let i = 1; i <= 2000; i++) {
      const altitude = altitudeAt(i / 2000)
      expect(altitude).toBeGreaterThanOrEqual(previous)
      expect(altitude - previous).toBeLessThan(10)
      previous = altitude
    }
  })
  it('starts exiting Home on the first scroll and reveals About after the overlay clears', () => {
    const exit = experienceConfig.home.exitRange
    expect(visibilityAt(0, 0)).toBe(1)
    expect(visibilityAt(0.00001, 0)).toBeLessThan(1)
    expect(visibilityAt(exit / 2, 0)).toBeGreaterThan(0)
    expect(visibilityAt(exit / 2, 0)).toBeLessThan(1)
    expect(visibilityAt(exit, 0)).toBe(0)
    expect(visibilityAt(exit, 1)).toBe(0)
    expect(visibilityAt((exit + checkpoints[1].progress - experienceConfig.content.readableRange) / 2, 1)).toBe(0)
    expect(visibilityAt(checkpoints[1].progress, 1)).toBe(1)
  })
  it('keeps navigation, altitude and camera rail aligned at every camp', () => {
    checkpoints.forEach((camp, index) => {
      expect(routeProgress(camp.progress)).toBeCloseTo(camp.route)
      expect(altitudeAt(camp.progress)).toBe(camp.altitude)
      expect(activeCheckpoint(camp.progress)).toBe(index)
      expect(visibilityAt(camp.progress, index)).toBe(1)
    })
  })
  it('is continuous and strictly ascends in both time directions', () => {
    let previous = -1
    for (let i = 0; i <= 2000; i++) {
      const value = routeProgress(i / 2000)
      expect(value).toBeGreaterThan(previous)
      if (previous >= 0) expect(value - previous).toBeLessThan(0.002)
      previous = value
    }
    expect(routeProgress(-1)).toBe(0)
    expect(routeProgress(2)).toBe(1)
  })
  it('slows near a camp without a scroll snap or a dead zone', () => {
    const camp = checkpoints[2].progress
    const midpoint = (checkpoints[1].progress + camp) / 2
    const approach = routeProgress(camp) - routeProgress(camp - 0.001)
    const travel = routeProgress(midpoint) - routeProgress(midpoint - 0.001)
    expect(approach).toBeGreaterThan(0)
    expect(approach).toBeLessThan(travel / 4)
  })
})

describe('first-person route', () => {
  it('stays at eye height, moves forward and turns continuously through the terrain', () => {
    const position = new Vector3(), target = new Vector3(), previous = new Vector3(), heading = new Vector3(), lastHeading = new Vector3()
    expect(routeCurve.points.length).toBeGreaterThan(20)
    let sideways = 0
    for (let i = 0; i <= 2000; i++) {
      cameraPose(i / 2000, position, target)
      expect(position.y - groundHeight(position.x, position.z)).toBeCloseTo(experienceConfig.camera.eyeHeight)
      expect(target.z).toBeLessThan(position.z)
      expect(position.toArray().every(Number.isFinite)).toBe(true)
      heading.copy(target).sub(position).normalize()
      if (i) {
        expect(position.z).toBeLessThan(previous.z)
        expect(position.distanceTo(previous)).toBeLessThan(1)
        expect(heading.angleTo(lastHeading)).toBeLessThan(0.035)
        sideways += Math.abs(position.x - previous.x)
      }
      previous.copy(position); lastHeading.copy(heading)
    }
    expect(sideways).toBeGreaterThan(250)
    expect(position.y).toBeGreaterThan(300)
  })
  it('retraces the same physical pose when descending', () => {
    const up = new Vector3(), upTarget = new Vector3(), down = new Vector3(), downTarget = new Vector3()
    for (const t of [0, 0.12, 0.25, 0.49, 0.73, 0.9, 1]) {
      cameraPose(routeProgress(t), up, upTarget)
      cameraPose(1, down, downTarget)
      cameraPose(routeProgress(t), down, downTarget)
      expect(down.equals(up)).toBe(true)
      expect(downTarget.equals(upTarget)).toBe(true)
    }
  })
  it('builds a finite, upward-facing continuous terrain instead of an exterior cone', () => {
    const geometry = terrainGeometry()
    const positions = geometry.getAttribute('position'), normals = geometry.getAttribute('normal')
    for (let i = 0; i < positions.count; i++) {
      expect(Number.isFinite(positions.getY(i))).toBe(true)
      expect(normals.getY(i)).toBeGreaterThan(0)
    }
    geometry.dispose()
  })
})
