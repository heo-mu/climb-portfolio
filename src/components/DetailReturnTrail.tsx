import { useEffect, useRef, useState, type RefObject } from 'react'
import { Link } from 'react-router-dom'
import './DetailReturnTrail.css'

export function DetailReturnTrail({ projectSlug, backLinkRef }: { projectSlug: string; backLinkRef: RefObject<HTMLAnchorElement | null> }) {
  const [visible, setVisible] = useState(false)
  const trailRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const backLink = backLinkRef.current
    if (!backLink) return
    let frame = 0
    const update = () => {
      frame = 0
      const distance = document.documentElement.scrollHeight - window.innerHeight
      const progress = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0
      trailRef.current?.style.setProperty('--return-progress', String(progress))
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0)
      schedule()
    })
    observer.observe(backLink)
    const resize = new ResizeObserver(schedule)
    resize.observe(document.documentElement)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    schedule()
    return () => {
      observer.disconnect()
      resize.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      cancelAnimationFrame(frame)
    }
  }, [backLinkRef, projectSlug])

  return <Link ref={trailRef} className="detail-return-trail" data-visible={visible} to="/#high-camp" state={{ project: projectSlug }} aria-label="Projects로 돌아가기" aria-hidden={!visible} tabIndex={visible ? 0 : -1}>
    <span className="detail-return-trail-arrow" aria-hidden="true">←</span>
    <span className="detail-return-trail-label">Projects</span>
    <span className="detail-return-trail-track" aria-hidden="true"><span /></span>
  </Link>
}
