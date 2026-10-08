import { useState } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Expedition } from './experience/Expedition'
import { ProjectDetail } from './pages/ProjectDetail'
import { NotFound } from './pages/NotFound'

export function App() {
  return <BrowserRouter><JourneyRoutes /></BrowserRouter>
}

function JourneyRoutes() {
  const location = useLocation()
  const active = location.pathname === '/'
  // Only create the journey after it is visited. Deep-linked detail pages pay
  // no WebGL cost. Freeze its route context while the reading route is open.
  const [journeyLocation, setJourneyLocation] = useState(active ? location : null)
  if (active && journeyLocation !== location) setJourneyLocation(location)
  return <>
    {journeyLocation && <div className="journey-layer" data-active={active} inert={!active} aria-hidden={!active}>
      <Routes location={journeyLocation}><Route path="/" element={<Expedition active={active} />} /></Routes>
    </div>}
    {!active && <Routes><Route path="/project/:slug" element={<ProjectDetail />} /><Route path="*" element={<NotFound />} /></Routes>}
  </>
}
