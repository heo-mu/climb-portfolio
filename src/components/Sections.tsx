import { useState } from 'react'
import { Link } from 'react-router-dom'
import { checkpoints, inventory, profile, workflow } from '../data/expedition'
import { projects } from '../data/projects'
import { Home } from './Home'

function About() {
  return <>
    <h1 className="portfolio-heading about-heading" id="title-about" tabIndex={-1}>
      <span>사용자가 다음 행동을</span>{' '}
      <span>알 수 있는 구조를 설계해요.</span>
    </h1>
    <div className="about-content">
      <ol className="career-timeline" aria-label="경력 흐름" role="list">
        <li>
          <div className="career-entry">
            <h2 className="career-category">Agency</h2>
            <p><strong>에이전시에서 시작했어요.</strong>{' '}17개 웹사이트를 구축하며 다양한 요구사항을 화면 구조와 서비스 흐름으로 정리했어요.</p>
          </div>
        </li>
        <li>
          <div className="career-entry">
            <h2 className="career-category">In-house · B2B SaaS</h2>
            <p><strong>인하우스 B2B SaaS에서는 UX 기획까지 맡았어요.</strong>{' '}정보 구조와 화면 정책을 설계하고, 프론트엔드 엔지니어와 컴포넌트·상태·반응형 기준을 디자인 시스템으로 만들었어요.</p>
          </div>
        </li>
        <li aria-current="step">
          <div className="career-entry">
            <h2 className="career-category">SI · Solution <span className="career-current">현재</span></h2>
            <p><strong>지금은 SI 솔루션 업체에서 일해요.</strong>{' '}여러 프로젝트의 복잡한 데이터와 업무 조건을 사용자가 이해하기 쉬운 정보와 행동 순서로 바꾸고 있어요.</p>
          </div>
        </li>
      </ol>
      <dl className="about-stats">
        <div><dt>완수 프로젝트</dt><dd>27+</dd></div>
        <div><dt>프로덕트 디자인 경험</dt><dd>4년차</dd></div>
      </dl>
    </div>
  </>
}

function AI() {
  const [active, setActive] = useState(0)
  return <>
    <h1 className="portfolio-heading" id="title-camp-one" tabIndex={-1}>AI Workflow</h1>
    <div className="panel-body"><p className="body-copy section-intro">질문을 넓히고, 생각을 빠르게 구현해요.</p>
      <ol className="workflow">{workflow.map((step, index) => <li key={step.name} data-active={active === index}>
        <button className="workflow-step" onClick={() => setActive(index)} onFocus={() => setActive(index)} onPointerEnter={event => { if (event.pointerType === 'mouse') setActive(index) }} aria-expanded={active === index} aria-controls={`workflow-${index}`}>
          <span className="step-number">0{index + 1}</span><span className="step-name">{step.name === 'IMPLEMENT' ? 'BUILD' : step.name}</span><span className="step-label">{step.label}</span><span className="step-symbol" aria-hidden="true">{active === index ? '−' : '+'}</span>
        </button>
        <div className="workflow-description" id={`workflow-${index}`} hidden={active !== index}><p>{step.description}</p></div>
      </li>)}</ol>
    </div>
  </>
}

function Tools() {
  const [selected, setSelected] = useState(0)
  return <>
    <h1 className="portfolio-heading" id="title-camp-two" tabIndex={-1}>Tools for the work.</h1>
    <div className="panel-body inventory">
      <div className="inventory-list" aria-label="디자인 도구">{inventory.map((tool, index) => <button type="button" key={tool.name} onClick={() => setSelected(index)} onFocus={() => setSelected(index)} onPointerEnter={event => { if (event.pointerType === 'mouse') setSelected(index) }} aria-pressed={selected === index} aria-controls="tool-description">
        <span className="tool-name">{tool.name}</span><span className="tool-use">{tool.use}</span><span className="tool-arrow" aria-hidden="true">↗</span>
      </button>)}</div>
      <p className="tool-description" id="tool-description" aria-live="polite">{inventory[selected].detail}</p>
    </div>
  </>
}

function ProjectArtwork({ active }: { active: number }) {
  return <div className="project-art" data-variant={active} aria-hidden="true"><div className="art-grid" /><div className="art-form art-form-one" /><div className="art-form art-form-two" /><div className="art-form art-form-three" /><span className="art-number">{projects[active].number}</span><span className="art-type">{projects[active].type}</span><span className="art-caption">CONCEPT PREVIEW</span></div>
}

function Projects() {
  const [active, setActive] = useState(0)
  const project = projects[active]
  return <>
    <h1 className="portfolio-heading" id="title-high-camp" tabIndex={-1}>Selected projects.</h1>
    <div className="panel-body projects-layout">
      <div className="project-index" aria-label="프로젝트 선택">{projects.map((item, index) => <button type="button" key={item.slug} onClick={() => setActive(index)} onFocus={() => setActive(index)} onPointerEnter={event => { if (event.pointerType === 'mouse') setActive(index) }} className="project-row" data-active={active === index} aria-pressed={active === index} aria-controls="selected-project">
        <span className="project-number">{item.number}</span><span className="project-label"><strong>{item.name.replace('PROJECT ', '')}</strong><span>{item.type}</span></span><span className="project-arrow" aria-hidden="true">↗</span>
      </button>)}<p className="concept-note">예시 프로젝트</p></div>
      <article className="project-preview" id="selected-project" aria-label="선택한 프로젝트">
        <Link className="project-media-link" to={`/project/${project.slug}`} state={{ returnCheckpoint: 'high-camp' }} aria-label={`${project.name} 프로젝트 보기`}><ProjectArtwork active={active} /></Link>
        <div className="project-information" key={project.slug}><div className="project-preview-meta"><span>{project.role}</span><span>{project.year}</span></div><p>{project.summary}</p><Link className="project-open" to={`/project/${project.slug}`} state={{ returnCheckpoint: 'high-camp' }}>프로젝트 보기 <span aria-hidden="true">↗</span></Link></div>
      </article>
    </div>
  </>
}

function Contact() {
  return <>
    <h1 className="portfolio-heading" id="title-summit" tabIndex={-1}>Let’s work<br />together.</h1>
    <div className="panel-body contact-content"><p className="body-copy">다음 경험을 함께 만들어요.</p>
      <div className="contact-email"><span className="contact-label">EMAIL</span><span className="email-address">{profile.email}</span><span className="contact-placeholder">예시 주소</span></div>
      {profile.socials.some(social => social.url) && <div className="social-links">{profile.socials.filter(social => social.url).map(social => <a href={social.url!} key={social.label} target="_blank" rel="noreferrer">{social.label} ↗</a>)}</div>}
    </div>
  </>
}

export function CheckpointSections({ onExplore }: { onExplore: () => void }) {
  const sections = [<About />, <AI />, <Tools />, <Projects />, <Contact />]
  return <div className="checkpoint-sections"><Home onExplore={onExplore} />{checkpoints.slice(1).map((camp, index) => <section key={camp.id} id={camp.id} className={`checkpoint checkpoint-${camp.id}`} aria-labelledby={`title-${camp.id}`} data-checkpoint={index + 1}>
    <div className="panel-surface" aria-hidden="true" />
    <div className="panel-content"><div className="panel-kicker"><span>{camp.index}</span><span>{camp.navigation}</span></div>{sections[index]}</div>
  </section>)}</div>
}
