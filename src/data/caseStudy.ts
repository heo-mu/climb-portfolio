export type CaseImage = {
  label: string
  image?: { src: string; alt: string; width: number; height: number }
}

export type ImageSlot = CaseImage & {
  layout?: 'wide' | 'split' | 'mobile-pair'
  panels?: readonly CaseImage[]
}

export type CaseBlock =
  | { kind: 'prompt-document'; request: string; workflow: readonly string[]; sections: readonly { title: string; paragraphs?: readonly string[]; items?: readonly string[] }[]; notes: readonly { title: string; body: string }[]; closing: string }
  | { kind: 'quote'; text: string }
  | { kind: 'list'; items: readonly string[] }
  | { kind: 'comparison'; columns: readonly { title: string; items: readonly string[] }[] }
  | { kind: 'rows'; items: readonly { title: string; body: string }[] }
  | { kind: 'compact-decisions'; items: readonly { title: string; body: string }[] }
  | { kind: 'decisions'; items: readonly { title: string; problem: string; decision: string; principle: string }[] }
  | { kind: 'flows'; items: readonly { title: string; steps: readonly string[] }[] }

export type CaseSection = {
  tone?: 'base' | 'elevated' | 'focus'
  spacing?: 'standard' | 'narrative' | 'image'
  externalLink?: { url: string; label: string; accessibleName: string; context?: string }
  layout?: 'overview' | 'statement' | 'structure' | 'visual-measure' | 'trust' | 'workflow' | 'directing-ai' | 'comparison' | 'decisions' | 'product' | 'outcome' | 'reflection'
  title: string
  heading: string
  body: string
  lead?: CaseBlock
  process?: readonly string[]
  media?: boolean
  blocks?: readonly CaseBlock[]
  imageSlot?: ImageSlot
}

/** Optional detail-only content; main journey data and legacy cases stay unchanged. */
export type ProjectDetailContent = {
  presentation?: 'editorial'
  keywords?: readonly string[]
  liveUrl?: string
  liveLabel?: string
  summary: string
  metadata: readonly (readonly [string, string])[]
  heroSlot: ImageSlot
}
