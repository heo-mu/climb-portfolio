// Figma input (76:2945): Outline × Size × State, measured from all 21 variants.
export const inputSizes = {
  sm: { height: 36, padX: 10, padY: 8, font: 14, line: 20, labelFont: 12, labelLine: 16, icon: 16, gap: 4 },
  md: { height: 44, padX: 12, padY: 10, font: 16, line: 24, labelFont: 14, labelLine: 20, icon: 20, gap: 6 },
  lg: { height: 52, padX: 16, padY: 12, font: 18, line: 28, labelFont: 14, labelLine: 20, icon: 24, gap: 6 },
} as const
export const inputVariantNodes = {
  sm: { Default: '83:2801', Hover: '83:2807', Focus: '83:2813', Completed: '83:2823', Error: '83:2833', Disabled: '83:2843', 'Read-only': '83:2849' },
  md: { Default: '76:2944', Hover: '76:2959', Focus: '76:2973', Completed: '83:2682', Error: '76:2984', Disabled: '76:2996', 'Read-only': '76:3002' },
  lg: { Default: '83:2911', Hover: '83:2917', Focus: '83:2923', Completed: '83:2933', Error: '83:2943', Disabled: '83:2953', 'Read-only': '83:2959' },
} as const
