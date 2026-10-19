import { Fragment } from 'react'
import './CodeBadge.css'

/** Static metadata, deliberately separate from interactive specimen choices. */
export function CodeBadge({ children, inline = false }: { children: string; inline?: boolean }) {
  return <code className={'code-badge' + (inline ? ' code-badge--inline' : '')}>{children.split('/').map((part, index) => <Fragment key={index}>{index > 0 && <><span>/</span><wbr /></>}{part}</Fragment>)}</code>
}
