import { Link } from 'react-router-dom'
import type { Project } from '../data/projects'
import './ProjectRouteGate.css'
import { useRoutePreview } from './useRoutePreview'

export function ProjectRouteGate({ previous, next }: { previous: Project; next: Project }) {
  const preview = useRoutePreview(previous, next)
  return <footer className="detail-closing">{preview.preview}<nav className="detail-closing-inner project-route-gate" aria-label="이전·다음 프로젝트">
    <span className="project-route-origin" aria-hidden="true" />
    {([{ direction: 'previous', label: 'Previous Project', project: previous }, { direction: 'next', label: 'Next Project', project: next }] as const).map(({ direction, label, project }) =>
      <Link key={direction} className={`project-route project-route--${direction}`} to={`/project/${project.slug}`} aria-label={`${label}: ${project.name}`} onPointerEnter={event => preview.enter(event, direction)} onPointerMove={event => preview.move(event)} onPointerLeave={preview.hide} onPointerCancel={preview.hide} onClick={preview.hide}>
        <span className="project-route-cluster">
          <span className="project-route-label"><svg className="project-route-arrow" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M17 10.5H3m5-5-5 5 5 5" /></svg>{label}</span>
          <span className="project-route-name">{project.name}</span>
        </span>
        <span className="project-route-line" aria-hidden="true"><span className="project-route-node" /></span>
      </Link>,
    )}
  </nav></footer>
}
