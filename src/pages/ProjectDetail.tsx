import { useLayoutEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { legacyProjectSlugs, processCaseStudy, projects } from '../data/projects'
import { NotFound } from './NotFound'
import { CaseImageSlot, CaseStudy, CaseText } from '../components/CaseStudy'
import { ArrowUpRight } from '../components/ArrowUpRight'

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
  const editorial = project.detail?.presentation === 'editorial'
  const deurim = project.slug === 'deurim'
  const keywords = project.detail?.keywords ?? project.tags
  const liveLink = project.detail?.liveUrl && <a className="detail-live-link" href={project.detail.liveUrl} target="_blank" rel="noopener noreferrer" aria-label={`${project.name} 서비스 보러가기 (새 창에서 열기)`}>{project.detail.liveLabel ?? '서비스 보러가기'}<ArrowUpRight className="detail-live-arrow" /></a>
  return <main className={`project-detail${editorial ? ' project-detail-editorial' : ''}${deurim ? ' project-detail-deurim' : ''}`}>
    <header className="detail-header">
      {/* Returns to the Projects camp with this project selected, without a reload. */}
      <Link to="/#high-camp" state={{ project: project.slug }} className="back-link">
        <svg className="back-link-arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
          <path d="M13.5 8.5h-11m4-4-4 4 4 4" vectorEffect="non-scaling-stroke" />
        </svg>
        <span>Back to Projects</span>
      </Link>
    </header>
    <div className="detail-wrap">
      {deurim ? <div className="detail-heading-row"><h1 className="detail-title" tabIndex={-1}>{project.name}</h1>{liveLink && <div className="detail-heading-action">{liveLink}</div>}</div> : <h1 className="detail-title" tabIndex={-1}>{project.name}</h1>}
      <p className="detail-summary"><CaseText text={project.detail?.summary ?? project.summary} /></p>{keywords.length > 0 && <ul className="project-tags" aria-label="프로젝트 키워드">{keywords.map(tag => <li key={tag}>#{tag}</li>)}</ul>}
      <dl className={`detail-meta${project.detail ? ' detail-meta-editorial' : ''}`}>{meta.map(([term, value]) => <div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}
        {!deurim && project.detail?.liveUrl && <div><dt>Live</dt><dd>{liveLink}</dd></div>}
      </dl>
      {!editorial && (project.detail?.heroSlot ? <CaseImageSlot slot={project.detail.heroSlot} hero /> : <div className="detail-hero" style={{ aspectRatio: `${project.screen.width} / ${project.screen.height}` }}>
        <img src={project.screen.desktop} width={project.screen.width} height={project.screen.height} alt={`${project.name} 프로젝트 화면`} loading="eager" decoding="async" fetchPriority="high" />
      </div>)}
    </div>
    <CaseStudy sections={project.caseStudy ?? processCaseStudy} heroSlot={editorial ? project.detail?.heroSlot : undefined} />
    <footer className="detail-closing"><div className="detail-closing-inner">
      <Link className="next-project" to={`/project/${next.slug}`}><span className="mono">Next Project / {next.number}</span><span>{next.name}<i aria-hidden="true">↗</i></span></Link>
    </div></footer>
  </main>
}
