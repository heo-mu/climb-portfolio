import { memo, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { checkpoints, inventory, profile, workflow } from '../data/expedition'
import { projects } from '../data/projects'
import { projectSelection } from '../experience/projectSelection'
import { Home } from './Home'
import { CareerTimeline } from './CareerTimeline'
import { ArrowUpRight } from './ArrowUpRight'

function About() {
  return <>
    <h1 className="portfolio-heading" id="title-about" tabIndex={-1}>About Me<span className="heading-accent">.</span></h1>
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
    <h1 className="portfolio-heading" id="title-camp-one" tabIndex={-1}>Working with AI<span className="heading-accent">.</span></h1>
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
    <h1 className="portfolio-heading" id="title-camp-two" tabIndex={-1}>Tools I Use<span className="heading-accent">.</span></h1>
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

/**
 * Original captures in a stable, uncropped frame on reading, portrait and narrow screens.
 * Keep the last loaded image visible while the newly selected capture decodes.
 */
const ProjectScreen = memo(function ProjectScreen({ active }: { active: number }) {
  const [shown, setShown] = useState(() => new Set([active]))
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set())
  const [displayed, setDisplayed] = useState(active)
  const [previous, setPrevious] = useState<number | null>(null)
  if (!shown.has(active)) setShown(new Set(shown).add(active))
  if (loaded.has(active) && displayed !== active) { setPrevious(displayed); setDisplayed(active) }
  return <div className="project-screen" aria-hidden="true">
    {projects.map((item, index) => shown.has(index) && <img key={item.slug} src={item.screen.desktop} width={item.screen.width} height={item.screen.height} alt="" loading="lazy" decoding="async" onLoad={() => setLoaded(previous => new Set(previous).add(index))} data-active={index === displayed} data-previous={index === previous} />)}
  </div>
})

/** A pointer target the scene lays over the exhibit's display; the "프로젝트 보기" link is the accessible route. */
function ShowcaseLink() {
  const index = useSyncExternalStore(projectSelection.subscribe, projectSelection.get)
  return <Link className="showcase-link" to={`/project/${projects[index].slug}`} tabIndex={-1} aria-hidden="true" />
}

function Projects() {
  const { index: active, pending, failed } = useSyncExternalStore(projectSelection.subscribe, projectSelection.snapshot)
  const select = (index: number) => { void projectSelection.request(index) }
  const project = projects[active]
  return <>
    <h1 className="portfolio-heading" id="title-high-camp" tabIndex={-1}>Selected Work<span className="heading-accent">.</span></h1>
    <div className="panel-body projects-layout">
      <Link className="project-media-link" to={`/project/${project.slug}`} tabIndex={-1} aria-hidden="true"><ProjectScreen active={active} /></Link>
      <div className="projects-editorial">
        <nav className="project-navigation" aria-label="프로젝트 선택">
          <p className="project-index-label">프로젝트를 선택해 보세요 <span>{project.number} / {String(projects.length).padStart(2, '0')}</span></p>
          <div className="project-index" role="tablist" aria-label="프로젝트" aria-orientation="horizontal">{projects.map((item, index) => <button key={item.slug} role="tab" tabIndex={active === index ? 0 : -1} type="button" id={`project-tab-${item.slug}`} onClick={() => select(index)} onKeyDown={event => {
          const offset = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 0
          if (!offset && event.key !== 'Home' && event.key !== 'End') return
          event.preventDefault(); event.stopPropagation()
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? projects.length - 1 : (index + offset + projects.length) % projects.length
          select(next)
          document.getElementById(`project-tab-${projects[next].slug}`)?.focus({ preventScroll: true })
        }} className="project-row" data-active={active === index} data-pending={pending === index} aria-selected={active === index} aria-controls={`project-info-${item.slug}`} aria-label={`${item.number} ${item.name}`}>
          <span className="project-number">{item.number}</span><span className="project-tab-name"><span className="project-name-full">{item.name}</span><span className="project-name-short">{item.navigationName}</span></span>
          </button>)}</div>
        </nav>
        <div className="project-details">{projects.map((item, index) => <div className="project-information" key={item.slug} id={`project-info-${item.slug}`} role="tabpanel" aria-labelledby={`project-tab-${item.slug}`} aria-hidden={active !== index} inert={active !== index}>
            <h2 className="project-detail-title">{item.name}</h2>
            <p className="project-summary">{item.summary}</p>
            <p className="project-meta"><span>{item.type}</span><span aria-hidden="true">·</span><span>{item.period}</span></p>
            <ul className="project-tags" aria-label="프로젝트 키워드">{item.tags.map(tag => <li key={tag}>#{tag}</li>)}</ul>
            <Link className="project-open" to={`/project/${item.slug}`}>프로젝트 보기 <ArrowUpRight className="project-open-arrow" /></Link>
        </div>)}</div>
      </div>
      <span className="project-load-status" role="status">{pending !== null ? `${projects[pending].name} 화면을 불러오고 있어요.` : failed ? '화면을 불러오지 못했어요. 다시 선택해 주세요.' : ''}</span>
    </div>
  </>
}

function Contact() {
  return <>
    <h1 className="portfolio-heading" id="title-summit" tabIndex={-1}>Work Together<span className="heading-accent">!</span></h1>
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
    <div className="spatial-panel"><div className="panel-content"><div className="panel-kicker"><span>{camp.index}</span><span>{camp.navigation}</span></div>{sections[index]}</div></div>
    {camp.id === 'high-camp' && <ShowcaseLink />}
  </section>)}</div>
}
