import { Link } from 'react-router-dom'

export function NotFound() {
  return <main className="not-found"><p className="mono">404 / Off the trail</p><h1>잠시, 경로를 벗어났어요.</h1><p>이 주소에서는 프로젝트를 찾지 못했어요.</p><Link to="/#high-camp">프로젝트로 돌아가요 ↗</Link></main>
}
