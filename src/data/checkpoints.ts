// Asset-free so tooling outside the bundler (the browser check) can share the journey.
export const checkpoints = [
  { id: 'base-camp', index: '00', navigation: 'Home', name: 'Base Camp', altitude: 1240, progress: 0, route: 0 },
  { id: 'about', index: '01', navigation: 'About', name: 'Approach', altitude: 1887, progress: 0.06, route: 0.1 },
  { id: 'camp-one', index: '02', navigation: 'AI Workflow', name: 'Camp I', altitude: 2858, progress: 0.29, route: 0.25 },
  { id: 'camp-two', index: '03', navigation: 'Tools', name: 'Camp II', altitude: 4321, progress: 0.52, route: 0.5 },
  { id: 'high-camp', index: '04', navigation: 'Projects', name: 'High Camp', altitude: 5824, progress: 0.75, route: 0.75 },
  { id: 'summit', index: '05', navigation: 'Contact', name: 'Summit', altitude: 6956, progress: 1, route: 1 },
] as const
