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
    document.title = 'Heo Chang Mu - Portfolio'
    document.querySelector<HTMLElement>('.detail-title')?.focus({ preventScroll: true })
  }, [project])
  if (!project) return <NotFound />
  return <main className="project-detail">
    <header className="detail-header"><Link to="/#high-camp" className="back-link">↙ Projects</Link></header>
    <div className="detail-wrap"><div className="detail-kicker"><span>Project {project.number}</span></div>
      <h1 className="detail-title" tabIndex={-1}>{project.name}</h1><p className="detail-summary">{project.summary}</p><ul className="project-tags" aria-label="프로젝트 키워드">{project.tags.map(tag => <li key={tag}>#{tag}</li>)}</ul>
      <dl className="detail-meta"><div><dt>Role</dt><dd>{project.role}</dd></div><div><dt>Period</dt><dd>{project.period}</dd></div><div><dt>Type</dt><dd>{project.type}</dd></div><div><dt>Status</dt><dd>Concept</dd></div></dl>
      <div className="detail-hero media-surface" role="img" aria-label="프로젝트 미디어"><span>{project.number}</span></div>
      <div className="case-study">{caseStudy.map((section, sectionIndex) => <section className="case-section" key={section.title}><div className="case-label mono"><span>{String(sectionIndex + 1).padStart(2, '0')}</span>{section.title}</div><div><h2>{section.heading}</h2><p>{section.body}</p>{sectionIndex === 3 && <div className="process-line mono"><span>Discover</span><i>→</i><span>Define</span><i>→</i><span>Explore</span><i>→</i><span>Validate</span></div>}{sectionIndex === 4 && <div className="case-media media-surface" role="img" aria-label="디자인 시스템 미디어" />}</div></section>)}</div>
      <Link className="next-project" to={`/project/${next.slug}`}><span className="mono">Next Project / {next.number}</span><span>{next.name}<i aria-hidden="true">↗</i></span></Link>
    </div>
  </main>
}
