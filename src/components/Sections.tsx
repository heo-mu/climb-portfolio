import { useState } from 'react'
import { Link } from 'react-router-dom'
import { checkpoints, inventory, profile, workflow } from '../data/expedition'
import { projects } from '../data/projects'
import type { ScrollController } from '../experience/progress'

export function About() {
  return <div className="about-content">
    <p className="intro">{profile.introduction}</p>
    <dl className="profile-details"><div><dt>ROLE</dt><dd>Product Designer</dd></div><div><dt>BASED IN</dt><dd>Seoul, Korea <span className="tiny-dot" /></dd></div></dl>
    <p className="focus-line mono">{profile.focus.join(' / ')}</p>
  </div>
}

export function AICapability() {
  return <ol className="workflow">{workflow.map((step, index) => <li key={step.name}>
    <span className="step-number mono">0{index + 1}</span><div><h3>{step.name}<span>{step.label}</span></h3><p>{step.description}</p></div>
  </li>)}</ol>
}

export function Tools() {
  const [selected, setSelected] = useState(0)
  return <div className="inventory">
    <div className="inventory-active" aria-live="polite"><span className="mono">IN USE / {String(selected + 1).padStart(2, '0')}</span><h3>{inventory[selected].name}</h3><p>{inventory[selected].detail}</p></div>
    <div className="inventory-list" aria-label="디자인 도구">{inventory.map((tool, index) => <button type="button" key={tool.name} onClick={() => setSelected(index)} onFocus={() => setSelected(index)} onPointerEnter={event => { if (event.pointerType === 'mouse') setSelected(index) }} aria-pressed={selected === index}>
      <span className="tool-name">{tool.name}</span><span className="tool-category mono">{tool.category}</span><span className="tool-use">{tool.use}</span><span className="tool-arrow" aria-hidden="true">↗</span>
    </button>)}</div>
  </div>
}

export function Projects() {
  const [active, setActive] = useState<number | null>(null)
  return <div className="projects-content">
    <p className="section-note">생각을 구조로, 구조를 경험으로 연결해요.</p>
    <div className="project-index" onMouseLeave={() => setActive(null)} data-hovering={active !== null}>
      {projects.map((project, index) => <Link to={`/project/${project.slug}`} state={{ returnCheckpoint: 'high-camp' }} key={project.slug} onPointerEnter={event => { if (event.pointerType === 'mouse') setActive(index) }} onFocus={() => setActive(index)} onBlur={() => setActive(null)} className="project-row" data-active={active === index}>
        <span className="project-number mono">{project.number}</span><div className="project-label"><h3>{project.name}</h3><span className="project-meta mono">{project.type} / {project.year}</span></div><span className="project-arrow" aria-hidden="true">↗</span>
      </Link>)}
    </div>
    <div className="project-preview" data-visible={active !== null} aria-hidden="true"><div className="media-surface"><span>0{(active ?? 0) + 1}</span><small className="mono">MEDIA / 16:10</small></div><p className="mono">{projects[active ?? 0].type} <span>2026</span></p></div>
    <p className="dummy-note mono">CONCEPT PROJECTS / 실제 작업을 위한 예시 콘텐츠예요.</p>
  </div>
}

export function Contact({ controller, fallback }: { controller: ScrollController; fallback: boolean }) {
  return <div className="contact-content">
    <p className="intro">{profile.contact}</p>
    <a className="email-link" href={`mailto:${profile.email}`}>{profile.email}<span aria-hidden="true">↗</span></a>
    <p className="contact-note">예시 이메일이에요. 실제 연락처로 교체할 예정이에요.</p>
    <div className="social-links">{profile.socials.map(social => social.url ? <a href={social.url} key={social.label} target="_blank" rel="noreferrer">{social.label} ↗</a> : <span key={social.label}>{social.label}<small>준비 중</small></span>)}</div>
    <button className="descend" onClick={() => fallback ? document.getElementById('base-camp')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }) : controller.goTo(0)}><span aria-hidden="true">↓</span><span>DESCEND<small>베이스캠프로 내려가요</small></span></button>
  </div>
}

export function CheckpointSections({ controller, fallback }: { controller: ScrollController; fallback: boolean }) {
  const sections = [<About />, <AICapability />, <Tools />, <Projects />, <Contact controller={controller} fallback={fallback} />]
  return <div className="checkpoint-sections">{checkpoints.map((camp, index) => <section key={camp.id} id={camp.id} className={`checkpoint checkpoint-${index}`} aria-labelledby={`title-${camp.id}`} data-checkpoint={index}>
    <div className="checkpoint-caption mono">{camp.index}</div>
    <div className="checkpoint-inner">
      <h1 id={`title-${camp.id}`} className="checkpoint-title" tabIndex={-1}>{camp.name}</h1>
      <p className="checkpoint-subtitle mono">{camp.topic} <span>— {camp.eyebrow}</span></p>
      {sections[index]}
    </div>
  </section>)}</div>
}
