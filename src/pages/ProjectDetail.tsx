import { useLayoutEffect, useRef, type CSSProperties } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { legacyProjectSlugs, processCaseStudy, projects } from '../data/projects'
import { NotFound } from './NotFound'
import { CaseStudy, CaseText } from '../components/CaseStudy'
import { ArrowUpRight } from '../components/ArrowUpRight'
import { DetailReturnTrail } from '../components/DetailReturnTrail'
import { ProjectRouteGate } from '../components/ProjectRouteGate'
import { ServiceDock } from '../components/ServiceDock'

export function ProjectDetail() {
  const { slug = '' } = useParams()
  const backLinkRef = useRef<HTMLAnchorElement>(null)
  const liveLinkRef = useRef<HTMLAnchorElement>(null)
  const index = projects.findIndex(project => project.slug === slug)
  const project = projects[index]
  const next = projects[(index + 1) % projects.length]
  const previous = projects[(index - 1 + projects.length) % projects.length]
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
  const liveLink = project.detail?.liveUrl && <a ref={liveLinkRef} className="detail-live-link" href={project.detail.liveUrl} target="_blank" rel="noopener noreferrer" aria-label={`${project.name} 서비스 보러가기 (새 창에서 열기)`}>{project.detail.liveLabel ?? '서비스 보러가기'}<ArrowUpRight className="detail-live-arrow" /></a>
  return <main className={`project-detail${editorial ? ' project-detail-editorial' : ''} project-detail-${project.slug}${editorial && !deurim ? ' project-detail-expanded' : ''}`}>
    <header className="detail-header">
      {/* Returns to the Projects camp with this project selected, without a reload. */}
      <Link ref={backLinkRef} to="/#high-camp" state={{ project: project.slug }} className="back-link">
        <svg className="back-link-arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
          <path d="M13.5 8.5h-11m4-4-4 4 4 4" vectorEffect="non-scaling-stroke" />
        </svg>
        <span>Back to Projects</span>
      </Link>
    </header>
    <DetailReturnTrail key={project.slug} projectSlug={project.slug} backLinkRef={backLinkRef} />
    {deurim && project.detail?.liveUrl && <ServiceDock sourceRef={liveLinkRef} href={project.detail.liveUrl} preview={project.detail.heroSlot.panels?.[0]?.image} />}
    <div className="detail-wrap">
      {deurim ? <div className="detail-heading-row"><h1 className="detail-title" tabIndex={-1}>{project.name}</h1>{liveLink && <div className="detail-heading-action">{liveLink}</div>}</div> : <h1 className="detail-title" tabIndex={-1}>{project.name}</h1>}
      <p className="detail-summary"><CaseText text={project.detail?.summary ?? project.summary} prose={deurim} /></p>{keywords.length > 0 && <ul className="project-tags" aria-label="프로젝트 키워드">{keywords.map(tag => <li key={tag}>#{tag}</li>)}</ul>}
      <dl className={`detail-meta${project.detail ? ' detail-meta-editorial' : ''}`} style={{ '--detail-meta-columns': meta.length } as CSSProperties}>{meta.map(([term, value]) => <div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}
        {!deurim && project.detail?.liveUrl && <div><dt>Live</dt><dd>{liveLink}</dd></div>}
      </dl>
    </div>
    <CaseStudy sections={project.caseStudy ?? processCaseStudy} heroSlot={project.detail?.heroSlot} projectSlug={project.slug} projectName={project.name} sentenceBreaks={deurim} />
    <ProjectRouteGate previous={previous} next={next} />
  </main>
}
