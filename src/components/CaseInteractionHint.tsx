import './CaseInteractionHint.css'

export function CaseInteractionHint({ action, description, direction = 'left' }: {
  action: string; description: string; direction?: 'left' | 'right'
}) {
  return <aside className={`case-interaction-hint case-interaction-hint--${direction}`}>
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="m5 3 10 7-5 1-2 5-3-13Z" />
      <path d="m11 13 3 4" />
    </svg>
    <div>
      <p className="case-interaction-hint__action">{action}</p>
      <p className="case-interaction-hint__description">{description}</p>
    </div>
  </aside>
}
