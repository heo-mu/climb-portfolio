import { useState } from 'react'
import { Link } from 'react-router-dom'
import { checkpoints, inventory, profile, workflow } from '../data/expedition'
import { projects } from '../data/projects'
import { Home } from './Home'
import { CareerTimeline } from './CareerTimeline'
import { ArrowUpRight } from './ArrowUpRight'

function About() {
  return <>
    <h1 className="portfolio-heading" id="title-about" tabIndex={-1}>Structure before screens.</h1>
    <div className="about-content">
      <CareerTimeline>
        <li>
          <div className="career-entry">
            <h2 className="career-category">Agency</h2>
            <p><strong>에이전시에서 시작했어요.</strong><br />17개 웹사이트를 구축하며 요구사항을 화면 구조와 서비스 흐름으로 정리했어요.</p>
          </div>
        </li>
        <li>
          <div className="career-entry">
            <h2 className="career-category">In-house · B2B SaaS</h2>
            <p><strong>인하우스 B2B SaaS에서는 UX 기획까지 맡았어요.</strong><br />정보 구조와 화면 정책을 세우고, 상태·반응형을 담은 컴포넌트 시스템을 만들었어요.</p>
          </div>
        </li>
        <li aria-current="step">
          <div className="career-entry">
            <h2 className="career-category">SI · Solution <span className="career-current">현재</span></h2>
            <p><strong>지금은 SI 솔루션 업체에서 일해요.</strong><br />복잡한 데이터와 업무 조건을 이해하기 쉬운 정보 구조와 행동 순서로 바꿔요.</p>
          </div>
        </li>
      </CareerTimeline>
      <dl className="about-stats">
        <div><dt>완수 프로젝트</dt><dd>27+</dd></div>
        <div><dt>프로덕트 디자인 경험</dt><dd>4년차</dd></div>
        <div><dt>주요 도메인</dt><dd>B2B</dd></div>
      </dl>
    </div>
  </>
}

function AI() {
  const [active, setActive] = useState(0)
  return <>
    <h1 className="portfolio-heading" id="title-camp-one" tabIndex={-1}>AI for the repeatable.</h1>
    <div className="panel-body"><p className="body-copy section-intro">AI로 반복을 줄이고, 더 중요한 판단과 설계에 집중해요.</p>
      <ol className="workflow">{workflow.map((step, index) => <li key={step.name} data-active={active === index}>
        <button className="workflow-step" onClick={() => setActive(index)} onFocus={() => setActive(index)} onPointerEnter={event => { if (event.pointerType === 'mouse') setActive(index) }} aria-expanded={active === index} aria-controls={`workflow-${index}`}>
          <span className="step-number">0{index + 1}</span><span className="step-name">{step.name}</span><span className="step-symbol" aria-hidden="true" />
        </button>
        <div className="workflow-description" id={`workflow-${index}`} aria-hidden={active !== index} inert={active !== index}><div><p>{step.description[0]}<br />{step.description[1]}</p></div></div>
      </li>)}</ol>
    </div>
  </>
}

function Tools() {
  return <>
    <h1 className="portfolio-heading" id="title-camp-two" tabIndex={-1}>Tools I use.</h1>
    <p className="body-copy section-intro">필요한 도구를 연결해 더 빠르게 만들고, 더 정확하게 다듬어요.</p>
    <div className="panel-body inventory">
      {(['DESIGN', 'AI', 'COLLABORATION'] as const).map(group => <div className="tool-group" key={group}>
        <h2 className="tool-group-label">{{ DESIGN: 'Design', AI: 'AI', COLLABORATION: 'Collaboration' }[group]}</h2>
        <ul className="inventory-list">{inventory.filter(tool => tool.group === group).map(tool => <li key={tool.name}>
          <span className="tool-icon" data-tool={tool.name}><img src={tool.icon} alt="" width="32" height="32" /></span>
          <div className="tool-copy"><h3 className="tool-name">{tool.name}</h3><p className="tool-use">{tool.use}</p></div>
        </li>)}</ul>
      </div>)}
    </div>
  </>
}

function ProjectArtwork({ active }: { active: number }) {
  return <div className="project-art" data-variant={active} aria-hidden="true"><div className="art-grid" /><div className="art-form art-form-one" /><div className="art-form art-form-two" /><div className="art-form art-form-three" /></div>
}

function Projects() {
  const [active, setActive] = useState(0)
  const project = projects[active]
  return <>
    <h1 className="portfolio-heading" id="title-high-camp" tabIndex={-1}>Selected Work.</h1>
    <p className="body-copy section-intro">복잡한 문제를 구조화하고 실제 제품으로 만든 작업을 모았어요.</p>
    <div className="panel-body projects-layout">
      <div className="project-index" aria-label="프로젝트 선택">{projects.map((item, index) => <button type="button" key={item.slug} onClick={() => setActive(index)} className="project-row" data-active={active === index} aria-pressed={active === index} aria-controls="selected-project">
        <span className="project-number">{item.number}</span><span className="project-label"><strong>{item.name}</strong><span>{item.type}</span></span>
      </button>)}</div>
      <article className="project-preview" id="selected-project" aria-label="선택한 프로젝트">
        <header className="project-preview-header">
          <div className="project-preview-meta"><span>{project.type}</span><span>{project.period}</span></div>
          <h2>{project.name}</h2>
        </header>
        <div className="project-information" key={project.slug}>
          <p>{project.summary}</p>
          <div className="project-actions">
            <ul className="project-tags" aria-label="프로젝트 키워드">{project.tags.map(tag => <li key={tag}>#{tag}</li>)}</ul>
            <Link className="project-open" to={`/project/${project.slug}`} state={{ returnCheckpoint: 'high-camp' }}>프로젝트 보기 <ArrowUpRight className="project-open-arrow" /></Link>
          </div>
        </div>
        <Link className="project-media-link" to={`/project/${project.slug}`} state={{ returnCheckpoint: 'high-camp' }} aria-label={`${project.name} 프로젝트 보기`}><ProjectArtwork active={active} /></Link>
      </article>
    </div>
  </>
}

function Contact() {
  return <>
    <h1 className="portfolio-heading" id="title-summit" tabIndex={-1}>Open to the right challenge.</h1>
    <p className="body-copy section-intro">복잡한 문제를 구조화하고 제품으로 풀어내는 팀과 함께하고 싶어요.</p>
    <div className="panel-body contact-content">
      <div className="contact-details">
        <a className="contact-item" href={`mailto:${profile.email}`}><span><span className="contact-label">Email</span><span className="contact-address">{profile.email}</span></span><ArrowUpRight className="contact-arrow" /></a>
        <a className="contact-item" href={`tel:${profile.phone.replaceAll('-', '')}`}><span><span className="contact-label">Phone</span><span className="contact-address">{profile.phone}</span></span><ArrowUpRight className="contact-arrow" /></a>
      </div>
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
