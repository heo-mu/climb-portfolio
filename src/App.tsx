import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Expedition } from './experience/Expedition'
import { ProjectDetail } from './pages/ProjectDetail'
import { NotFound } from './pages/NotFound'

export function App() {
  return <BrowserRouter><Routes><Route path="/" element={<Expedition />} /><Route path="/project/:slug" element={<ProjectDetail />} /><Route path="*" element={<NotFound />} /></Routes></BrowserRouter>
}
