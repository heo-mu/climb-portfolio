import { TextAaIcon } from '@phosphor-icons/react/dist/csr/TextAa'
import { PaletteIcon } from '@phosphor-icons/react/dist/csr/Palette'
import { CornersOutIcon } from '@phosphor-icons/react/dist/csr/CornersOut'
import { ArrowsOutLineHorizontalIcon } from '@phosphor-icons/react/dist/csr/ArrowsOutLineHorizontal'
import { StackIcon } from '@phosphor-icons/react/dist/csr/Stack'
import { ShapesIcon } from '@phosphor-icons/react/dist/csr/Shapes'

// Reading groups for the portfolio, not a new design-system taxonomy.
const foundations = [
  [TextAaIcon, '글자', '글자 스타일'],
  [PaletteIcon, '색상', '색상 기준'],
  [CornersOutIcon, '형태', '모서리 · 테두리'],
  [ArrowsOutLineHorizontalIcon, '간격', '안쪽 · 바깥 여백'],
  [StackIcon, '표현', '투명도 · 높이'],
  [ShapesIcon, '아이콘', '아이콘 기준'],
] as const

export function SystemFoundations({ className, iconSize = 32 }: { className: string; iconSize?: number }) {
  return <dl className={className}>{foundations.map(([Icon, title, detail]) => <div key={title}>
    <Icon size={iconSize} weight="regular" aria-hidden="true" /><dt>{title}</dt><dd>{detail}</dd>
  </div>)}</dl>
}
