import { useLayoutEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { legacyProjectSlugs, processCaseStudy, projects } from '../data/projects'
import { NotFound } from './NotFound'
import { CaseImageSlot, CaseStudy } from '../components/CaseStudy'

export function ProjectDetail() {
  const { slug = '' } = useParams()
  const index = projects.findIndex(project => project.slug === slug)
  const project = projects[index]
  const next = projects[(index + 1) % projects.length]
  useLayoutEffect(() => {
    if (!project) return
    window.scrollTo({ top: 0, behavior: 'instant' })
    document.title = 'Heo Chang Mu - Portfolio'
    document.querySelector<HTMLElement>('.detail-title')?.focus({ preventScroll: true })
  }, [project])
  if (legacyProjectSlugs[slug]) return <Navigate to={`/project/${legacyProjectSlugs[slug]}`} replace />
  if (!project) return <NotFound />
  const meta = project.detail?.metadata ?? [['Role', project.role], ['Period', project.period], ['Type', project.type], ...project.status ? [['Status', project.status]] : []]
  return <main className="project-detail">
    <header className="detail-header">
      {/* Returns to the Projects camp with this project selected, without a reload. */}
      <Link to="/#high-camp" state={{ project: project.slug }} className="back-link">
        <svg className="back-link-arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
          <path d="M13.5 8.5h-11m4-4-4 4 4 4" vectorEffect="non-scaling-stroke" />
        </svg>
        <span>Back to Projects</span>
      </Link>
    </header>
    <div className="detail-wrap"><div className="detail-kicker"><span>Project {project.number}</span></div>
      <h1 className="detail-title" tabIndex={-1}>{project.name}</h1><p className="detail-summary">{project.detail?.summary ?? project.summary}</p><ul className="project-tags" aria-label="프로젝트 키워드">{project.tags.map(tag => <li key={tag}>#{tag}</li>)}</ul>
      <dl className={`detail-meta${project.detail ? ' detail-meta-editorial' : ''}`}>{meta.map(([term, value]) => <div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}</dl>
      {project.detail?.heroSlot ? <CaseImageSlot slot={project.detail.heroSlot} hero /> : <div className="detail-hero" style={{ aspectRatio: `${project.screen.width} / ${project.screen.height}` }}>
        <img src={project.screen.desktop} width={project.screen.width} height={project.screen.height} alt={`${project.name} 프로젝트 화면`} loading="eager" decoding="async" fetchPriority="high" />
      </div>}
      <CaseStudy sections={project.caseStudy ?? processCaseStudy} />
      <Link className="next-project" to={`/project/${next.slug}`}><span className="mono">Next Project / {next.number}</span><span>{next.name}<i aria-hidden="true">↗</i></span></Link>
    </div>
  </main>
}
