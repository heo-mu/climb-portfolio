import { describe, expect, it } from 'vitest'
import { projectsPresentation, activeCheckpoint, altitudeAt, campZones, readableCheckpoint, sectionUIAt } from '../src/experience/progress'
import { checkpoints } from '../src/data/expedition'
import { routeEyeAt, curveParameterAt, journeyLength, journeyAtCurveParameter } from '../src/data/ascentRoute'
import { cameraPose, groundHeight, routeCurve, terrainGeometry } from '../src/experience/terrain'
import { experienceConfig } from '../src/config/experience'
import { Vector3 } from 'three'

const eye = (progress: number) => new Vector3(...routeEyeAt(curveParameterAt(progress)))

describe('spatial arrival', () => {
  it('uses a reversible presentation envelope', () => {
    for (const edge of campZones[4].arrival) expect(projectsPresentation(edge).presence).toBeCloseTo(1)
  })
  it('waits for the first Projects capture without enabling empty content', () => {
    for (const progress of campZones[4].arrival) {
      expect(sectionUIAt(progress, false, false)[4].interactive).toBe(false)
      expect(sectionUIAt(progress, false, true)[4].interactive).toBe(true)
    }
    expect(sectionUIAt(checkpoints[3].progress, false, false)[3].interactive).toBe(true)
  })
  it('derives every arrival zone from the walker’s real distance to its reading plateau', () => {
    const { arrivalDistance, homeDockDistance } = experienceConfig.content
    campZones.forEach(({ plateau, arrival, dock }, index) => {
      expect(arrival[0]).toBeLessThanOrEqual(plateau[0])
      expect(arrival[1]).toBeGreaterThanOrEqual(plateau[1])
      if (index) expect(eye(arrival[0]).distanceTo(eye(plateau[0]))).toBeCloseTo(arrivalDistance, 3)
      if (plateau[1] < 1) expect(eye(arrival[1]).distanceTo(eye(plateau[1]))).toBeCloseTo(arrivalDistance, 3)
      if (index) expect(arrival[0]).toBeGreaterThan(campZones[index - 1].arrival[1])
      // Camps dock wherever they are arrived; Home docks closer, so one wheel step departs.
      if (index) expect(dock).toEqual(arrival)
      else {
        expect(eye(dock[1]).distanceTo(eye(0))).toBeCloseTo(homeDockDistance, 3)
        expect(dock[1]).toBeLessThan(arrival[1])
      }
    })
  })
  it('enables content, input and trail position on one boundary in both directions', () => {
    campZones.forEach(({ arrival }, index) => {
      for (const [edge, outside] of [[arrival[0], arrival[0] - .0001], [arrival[1], arrival[1] + .0001]]) {
        if (outside < 0 || outside > 1) continue
        expect(readableCheckpoint(edge)).toBe(index)
        expect(sectionUIAt(edge)[index]).toEqual({ phase: 'active', interactive: true })
        expect(readableCheckpoint(outside)).toBe(-1)
        expect(sectionUIAt(outside).some(state => state.interactive)).toBe(false)
        // Latch the last arrival: jitter out of the zone cannot select a neighbour.
        expect(activeCheckpoint(outside, index)).toBe(index)
        expect(activeCheckpoint(edge, index ? index - 1 : 1)).toBe(index)
      }
    })
  })
  it('keeps the reading dwell longer than the plateau and Home short', () => {
    const range = (experienceConfig.route.scrollScreens - 1) * 900
    const dwell = campZones.map(({ arrival }) => (arrival[1] - arrival[0]) * range)
    expect(dwell[0]).toBeLessThan(120)
    // A single ~100px wheel step from Home lands beyond its dock on common heights.
    for (const height of [768, 900, 1080]) expect(campZones[0].dock[1] * (experienceConfig.route.scrollScreens - 1) * height).toBeLessThan(95)
    // Every camp keeps at least its full plateau; the summit sits at the end of the rail.
    dwell.slice(1, -1).forEach(px => expect(px).toBeGreaterThan(2 * experienceConfig.content.readableRange * range))
    expect(dwell.at(-1)).toBeGreaterThan(experienceConfig.content.readableRange * range)
  })
  it('shares immutable section states, so frames can skip unchanged DOM work', () => {
    expect(sectionUIAt(checkpoints[2].progress)).toBe(sectionUIAt(checkpoints[2].progress + .001))
    expect(sectionUIAt(checkpoints[2].progress)).not.toBe(sectionUIAt(checkpoints[3].progress))
    // A Home return passes camps without activating them; Home itself still arrives.
    expect(sectionUIAt(checkpoints[3].progress, true).every(state => !state.interactive)).toBe(true)
    expect(sectionUIAt(0, true)[0].interactive).toBe(true)
  })
  it('retains the last arrived section between camps in either direction', () => {
    for (let index = 1; index < checkpoints.length; index++) {
      const midpoint = (checkpoints[index - 1].progress + checkpoints[index].progress) / 2
      expect(activeCheckpoint(midpoint, index - 1)).toBe(index - 1)
      expect(activeCheckpoint(midpoint, index)).toBe(index)
      // Without a history (a restored position), name the camp last passed uphill.
      expect(activeCheckpoint(midpoint)).toBe(index - 1)
    }
    expect(activeCheckpoint(1, 1)).toBe(5)
    expect(activeCheckpoint(0, 5)).toBe(0)
  })
})

describe('expedition progression', () => {
  it('gives every journey a comparable scroll span, including Home to About', () => {
    const spans = checkpoints.slice(1).map((camp, index) => camp.progress - checkpoints[index].progress)
    expect(Math.max(...spans) / Math.min(...spans)).toBeLessThan(1.2)
    const travel = campZones.slice(1).map((zone, index) => zone.arrival[0] - campZones[index].arrival[1])
    expect(Math.min(...travel)).toBeGreaterThan(.08)
    expect(Math.max(...travel) / Math.min(...travel)).toBeLessThan(1.8)
  })
  it('climbs smoothly from 1240 m to the 6956 m summit without a display-only override', () => {
    expect(altitudeAt(0)).toBe(1240)
    expect(altitudeAt(1)).toBe(6956)
    let previous = altitudeAt(0)
    for (let i = 1; i <= 2000; i++) {
      const altitude = altitudeAt(i / 2000)
      expect(altitude).toBeGreaterThanOrEqual(previous)
      expect(altitude - previous).toBeLessThanOrEqual(10)
      previous = altitude
    }
  })
  it('keeps navigation, altitude and camera rail aligned at every camp', () => {
    checkpoints.forEach((camp, index) => {
      expect(journeyAtCurveParameter(curveParameterAt(camp.progress))).toBeCloseTo(camp.progress, 10)
      expect(altitudeAt(camp.progress)).toBe(camp.altitude)
      expect(activeCheckpoint(camp.progress)).toBe(index)
      expect(sectionUIAt(camp.progress)[index].interactive).toBe(true)
    })
  })
  it('is continuous and strictly ascends in both time directions', () => {
    let previous = -1
    for (let i = 0; i <= 2000; i++) {
      const value = curveParameterAt(i / 2000)
      expect(value).toBeGreaterThan(previous)
      if (previous >= 0) expect(value - previous).toBeLessThan(0.002)
      previous = value
    }
    expect(curveParameterAt(-1)).toBe(0)
    expect(curveParameterAt(2)).toBe(1)
  })
  it('normalizes equal scroll intervals to equal physical distances', () => {
    const a = new Vector3(), b = new Vector3(), target = new Vector3()
    const distances: number[] = []
    cameraPose(0, a, target)
    for (let i = 1; i <= 2000; i++) {
      cameraPose(i / 2000, b, target)
      distances.push(a.distanceTo(b)); a.copy(b)
    }
    expect(Math.max(...distances) / Math.min(...distances)).toBeLessThan(1.005)
    expect(distances.reduce((sum, d) => sum + d, 0)).toBeCloseTo(journeyLength, 1)
    const gaps = checkpoints.slice(1).map((camp, i) => (camp.progress - checkpoints[i].progress) * journeyLength)
    expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThan(1e-9)
  })
})

describe('first-person route', () => {
  it('never freezes or reverses longitudinal motion in either direction', () => {
    const position = new Vector3(), target = new Vector3(), previous = new Vector3()
    for (const direction of [1, -1]) {
      cameraPose(direction === 1 ? 0 : 1, previous, target)
      for (let i = 1; i <= 4000; i++) {
        const progress = direction === 1 ? i / 4000 : 1 - i / 4000
        cameraPose(progress, position, target)
        expect((previous.z - position.z) * direction).toBeGreaterThan(0)
        expect(position.distanceTo(previous)).toBeCloseTo(journeyLength / 4000, 3)
        previous.copy(position)
      }
    }
  })
  it('keeps full travel and increasing altitude throughout the reading dwell', () => {
    const positions = [.773, .785, .8, .815, .827].map(progress => {
      const position = new Vector3()
      cameraPose((progress), position, new Vector3())
      expect(sectionUIAt(progress)[4].interactive).toBe(true)
      return { position, altitude: altitudeAt(progress) }
    })
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i].position.distanceTo(positions[i - 1].position)).toBeGreaterThan(.7)
      expect(positions[i].altitude).toBeGreaterThan(positions[i - 1].altitude)
    }
  })
  it('stays at eye height, moves forward and turns continuously through the terrain', () => {
    const position = new Vector3(), target = new Vector3(), previous = new Vector3(), heading = new Vector3(), lastHeading = new Vector3()
    expect(routeCurve.points.length).toBeGreaterThan(20)
    let sideways = 0
    for (let i = 0; i <= 2000; i++) {
      cameraPose(i / 2000, position, target)
      expect(position.y - groundHeight(position.x, position.z)).toBeGreaterThan(1)
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
  it('computes the same eye without three.js for arrival and the trail map', () => {
    const position = new Vector3(), target = new Vector3()
    for (let i = 0; i <= 2000; i++) {
      cameraPose(i / 2000, position, target)
      const [x, y, z] = routeEyeAt(curveParameterAt(i / 2000))
      expect(Math.abs(position.x - x) + Math.abs(position.y - y) + Math.abs(position.z - z)).toBeLessThan(1e-9)
    }
  })
  it('retraces the same physical pose when descending', () => {
    const up = new Vector3(), upTarget = new Vector3(), down = new Vector3(), downTarget = new Vector3()
    for (const t of [0, 0.12, 0.25, 0.49, 0.73, 0.9, 1]) {
      cameraPose((t), up, upTarget)
      cameraPose(1, down, downTarget)
      cameraPose((t), down, downTarget)
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
