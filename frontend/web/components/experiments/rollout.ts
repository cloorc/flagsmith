import { MultivariateOption, ProjectFlag } from 'common/types/responses'
import { getDefaultVariantKey } from 'common/utils/multivariate'

export type VariationSplitEntry = {
  multivariate_feature_option: number
  percentage_allocation: number
}

export type RolloutSummaryRow = {
  label: string
  percentage: number
}

export const getMultivariateOptionValue = (mv: MultivariateOption): string => {
  if (mv.type === 'unicode') return mv.string_value
  if (mv.type === 'int') return String(mv.integer_value ?? '')
  if (mv.type === 'bool') return String(mv.boolean_value ?? '')
  return ''
}

export const getVariationSplitDefaults = (
  options: MultivariateOption[],
): VariationSplitEntry[] =>
  options.map((option) => ({
    multivariate_feature_option: option.id,
    percentage_allocation: option.default_percentage_allocation ?? 0,
  }))

export const getControlPercentage = (
  variationSplit: VariationSplitEntry[],
): number =>
  100 -
  variationSplit.reduce(
    (total, entry) => total + (entry.percentage_allocation || 0),
    0,
  )

export const getRolloutSummaryRows = (
  feature: ProjectFlag,
  variationSplit: VariationSplitEntry[],
): RolloutSummaryRow[] => [
  {
    label: 'Control',
    percentage: Math.max(0, getControlPercentage(variationSplit)),
  },
  ...feature.multivariate_options.map((option, index) => ({
    label: option.key || getDefaultVariantKey(index),
    percentage:
      variationSplit.find(
        (entry) => entry.multivariate_feature_option === option.id,
      )?.percentage_allocation ?? 0,
  })),
]

export const buildRolloutSummary = (
  rolloutPercentage: number,
  rows: RolloutSummaryRow[],
): string =>
  `${rolloutPercentage}% of eligible identities enter the experiment. Split: ${rows
    .map((row) => `${row.label} ${row.percentage}%`)
    .join(', ')}.`
