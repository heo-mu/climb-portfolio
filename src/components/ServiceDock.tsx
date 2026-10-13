import { useEffect, useState, type RefObject } from 'react'
import { ArrowUpRight } from './ArrowUpRight'
import './ServiceDock.css'

export function ServiceDock({ sourceRef, href, preview }: { sourceRef: RefObject<HTMLAnchorElement | null>; href: string; preview?: { src: string; width: number; height: number } }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const source = sourceRef.current
    if (!source) return
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0)
    })
    observer.observe(source)
    return () => observer.disconnect()
  }, [sourceRef])

  return <a className="service-dock" data-visible={visible} href={href} target="_blank" rel="noopener noreferrer" aria-label="들임 실제 서비스 열기 (새 탭에서 열기)" aria-hidden={!visible} tabIndex={visible ? 0 : -1}>
    {preview && <span className="service-dock-preview" aria-hidden="true"><img src={preview.src} width={preview.width} height={preview.height} alt="" loading="lazy" decoding="async" /></span>}
    <span className="service-dock-action"><span>들임 서비스</span><ArrowUpRight className="service-dock-arrow" /></span>
    <span className="service-dock-support" aria-hidden="true">실제 서비스에서 확인하기</span>
  </a>
}
