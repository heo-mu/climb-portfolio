export type CaseImage = {
  label: string
  description?: string
  image?: { src: string; alt: string; width: number; height: number }
}

export type ImageSlot = CaseImage & {
  introductions?: readonly { label: string; heading: string; body: string; aiUsage?: string }[]
  layout?: 'wide' | 'split' | 'mobile-pair' | 'decision-visual' | 'agent-sequence'
  panels?: readonly CaseImage[]
}

export type CaseBlock =
  | { kind: 'role-hierarchy'; roles: readonly { title: string; scope: string }[]; workflows: readonly string[] }
  | { kind: 'supporting'; text: string }
  | { kind: 'spatial-hierarchy'; steps: readonly { title: string; detail: string }[]; principles: readonly { title: string; body: string }[] }
  | { kind: 'image-workflow'; steps: readonly { title: string; body: string }[]; images: readonly CaseImage[] }
  | { kind: 'insight'; label?: '핵심 정리' | '핵심 시사점' | '다음에 가져갈 기준'; text: string; supporting?: string }
  | { kind: 'production-workflow'; steps: readonly { title: string; body: string }[] }
  | { kind: 'graph-workflow'; title: string; steps: readonly { title: string; body: string }[]; evidence?: { stepIndex: number; label: string; image: NonNullable<CaseImage['image']> }; supporting?: string; insight: string; conclusion: string }
  | { kind: 'execution-judgment'; items: readonly { title: string; judgmentTitle: string; execution: string; judgment: string }[] }
  | { kind: 'problems'; items: readonly { title: string; body: string }[] }
  | { kind: 'prompt-document'; request: string; workflow: readonly string[]; sections: readonly { title: string; paragraphs?: readonly string[]; items?: readonly string[] }[] }
  | { kind: 'quote'; text: string }
  | { kind: 'list'; items: readonly string[] }
  | { kind: 'comparison'; columns: readonly { title: string; items: readonly string[] }[] }
  | { kind: 'rows'; items: readonly { title: string; body: string; examples?: readonly string[] }[] }
  | { kind: 'compact-decisions'; items: readonly { title: string; body: string }[] }
  | { kind: 'decisions'; items: readonly { title: string; problem: string; decision: string; principle: string }[] }
  | { kind: 'flows'; items: readonly { title: string; steps: readonly string[] }[] }

export type CaseSection = {
  tone?: 'base' | 'elevated' | 'focus'
  spacing?: 'standard' | 'narrative' | 'image'
  externalLink?: { url: string; label: string; accessibleName: string; title?: string; context?: string; metaLabel?: string; metaValue?: string }
  layout?: 'overview' | 'statement' | 'structure' | 'visual-measure' | 'trust' | 'workflow' | 'directing-ai' | 'comparison' | 'decisions' | 'product' | 'reflection' | 'split' | 'narrative' | 'hierarchy' | 'spatial-structure' | 'spatial-data' | 'ai-agent'
  title: string
  heading: string
  body?: string
  supporting?: string
  closing?: string
  reflectionSummary?: boolean
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
