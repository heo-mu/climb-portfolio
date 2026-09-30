import { useLayoutEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { caseStudy, projects } from '../data/projects'
import { NotFound } from './NotFound'

export function ProjectDetail() {
  const { slug } = useParams()
  const index = projects.findIndex(project => project.slug === slug)
  const project = projects[index]
  const next = projects[(index + 1) % projects.length]
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    document.title = project ? `${project.name} — ASCENT` : '경로를 찾지 못했어요 — ASCENT'
    document.querySelector<HTMLElement>('.detail-title')?.focus({ preventScroll: true })
  }, [project])
  if (!project) return <NotFound />
  return <main className="project-detail">
    <header className="detail-header"><Link to="/#high-camp" className="back-link">↙ PROJECTS</Link></header>
    <div className="detail-wrap"><div className="detail-kicker"><span>PROJECT {project.number}</span></div>
      <h1 className="detail-title" tabIndex={-1}>{project.name}</h1><p className="detail-summary">{project.summary}</p>
      <dl className="detail-meta"><div><dt>ROLE</dt><dd>{project.role}</dd></div><div><dt>YEAR</dt><dd>{project.year}</dd></div><div><dt>TYPE</dt><dd>{project.type}</dd></div><div><dt>STATUS</dt><dd>Concept / 예시 프로젝트</dd></div></dl>
      <div className="detail-hero media-surface" role="img" aria-label="실제 프로젝트 이미지가 들어갈 빈 미디어 영역"><span>{project.number}</span><small className="mono">PROJECT MEDIA / 16:10</small></div>
      <div className="case-study">{caseStudy.map((section, sectionIndex) => <section className="case-section" key={section.title}><div className="case-label mono"><span>{String(sectionIndex + 1).padStart(2, '0')}</span>{section.title}</div><div><h2>{section.heading}</h2><p>{section.body}</p>{sectionIndex === 3 && <div className="process-line mono"><span>DISCOVER</span><i>→</i><span>DEFINE</span><i>→</i><span>EXPLORE</span><i>→</i><span>VALIDATE</span></div>}{sectionIndex === 4 && <div className="case-media media-surface" role="img" aria-label="디자인 시스템 이미지가 들어갈 빈 미디어 영역"><small className="mono">DESIGN SYSTEM / MEDIA</small></div>}</div></section>)}</div>
      <Link className="next-project" to={`/project/${next.slug}`}><span className="mono">NEXT PROJECT / {next.number}</span><span>{next.name}<i aria-hidden="true">↗</i></span></Link>
    </div>
  </main>
}
