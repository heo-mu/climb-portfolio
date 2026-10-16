// Asset-free so tooling outside the bundler (the browser check) can share the journey.
const routeStops = [
  { id: 'base-camp', navigation: 'Home', name: 'Base Camp', altitude: 1240 },
  { id: 'about', navigation: 'About', name: 'Approach', altitude: 1887 },
  { id: 'camp-one', navigation: 'AI Workflow', name: 'Camp I', altitude: 2858 },
  { id: 'systems', navigation: 'Systems', name: 'Systems Camp', altitude: 3560 },
  { id: 'camp-two', navigation: 'Tools', name: 'Camp II', altitude: 4321 },
  { id: 'high-camp', navigation: 'Projects', name: 'High Camp', altitude: 5824 },
  { id: 'summit', navigation: 'Contact', name: 'Summit', altitude: 6956 },
] as const

export type CheckpointId = typeof routeStops[number]['id']
// Progress is normalized cumulative camera distance, not the spline parameter.
export const checkpoints = routeStops.map((stop, index) => ({
  ...stop, index: String(index).padStart(2, '0'), progress: index / (routeStops.length - 1),
}))
export const checkpointIndex = (id: CheckpointId) => checkpoints.findIndex(camp => camp.id === id)
export const checkpointAt = (id: CheckpointId) => checkpoints[checkpointIndex(id)]
export const PROJECTS_CHECKPOINT = checkpointIndex('high-camp')
