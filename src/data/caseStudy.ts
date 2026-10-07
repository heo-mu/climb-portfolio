export type ImageSlot = { label: string; caption: string }

export type CaseBlock =
  | { kind: 'quote'; text: string }
  | { kind: 'list'; items: readonly string[] }
  | { kind: 'comparison'; columns: readonly { title: string; items: readonly string[] }[] }
  | { kind: 'rows'; items: readonly { title: string; body: string }[] }
  | { kind: 'decisions'; items: readonly { title: string; problem: string; decision: string; principle: string }[] }
  | { kind: 'flows'; items: readonly { title: string; steps: readonly string[] }[] }

export type CaseSection = {
  title: string
  heading: string
  body: string
  process?: readonly string[]
  media?: boolean
  blocks?: readonly CaseBlock[]
  imageSlot?: ImageSlot
}

/** Optional detail-only content; main journey data and legacy cases stay unchanged. */
export type ProjectDetailContent = {
  summary: string
  metadata: readonly (readonly [string, string])[]
  heroSlot: ImageSlot
}
