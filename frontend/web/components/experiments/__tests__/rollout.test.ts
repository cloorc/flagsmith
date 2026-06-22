import {
  buildRolloutSummary,
  getControlPercentage,
  getMultivariateOptionValue,
  getRolloutSummaryRows,
  getVariationSplitDefaults,
} from 'components/experiments/rollout'
import { MultivariateOption, ProjectFlag } from 'common/types/responses'

const option = (over: Partial<MultivariateOption>): MultivariateOption => ({
  boolean_value: undefined,
  default_percentage_allocation: 0,
  id: 1,
  integer_value: undefined,
  key: null,
  string_value: '',
  type: 'unicode',
  uuid: 'u',
  ...over,
})

const feature = (options: MultivariateOption[]): ProjectFlag =>
  ({ multivariate_options: options } as ProjectFlag)

describe('rollout helpers', () => {
  it('getMultivariateOptionValue renders a value as a string', () => {
    expect(
      getMultivariateOptionValue(option({ integer_value: 7, type: 'int' })),
    ).toBe('7')
  })

  it('getVariationSplitDefaults maps options to id + default allocation', () => {
    expect(
      getVariationSplitDefaults([
        option({ default_percentage_allocation: 60, id: 10 }),
        option({ default_percentage_allocation: 40, id: 11 }),
      ]),
    ).toEqual([
      { multivariate_feature_option: 10, percentage_allocation: 60 },
      { multivariate_feature_option: 11, percentage_allocation: 40 },
    ])
  })

  it('getControlPercentage is 100 minus the sum of the split', () => {
    expect(
      getControlPercentage([
        { multivariate_feature_option: 10, percentage_allocation: 30 },
      ]),
    ).toBe(70)
  })

  it('getRolloutSummaryRows puts Control first, then variants by key/fallback', () => {
    expect(
      getRolloutSummaryRows(
        feature([
          option({ id: 10, key: 'big', string_value: 'big' }),
          option({ id: 11, key: null, string_value: 'small' }),
        ]),
        [
          { multivariate_feature_option: 10, percentage_allocation: 60 },
          { multivariate_feature_option: 11, percentage_allocation: 40 },
        ],
      ),
    ).toEqual([
      { label: 'Control', percentage: 0 },
      { label: 'big', percentage: 60 },
      { label: 'Variant_2', percentage: 40 },
    ])
  })

  it('buildRolloutSummary describes rollout and split in one sentence', () => {
    expect(
      buildRolloutSummary(42, [
        { label: 'Control', percentage: 0 },
        { label: 'big', percentage: 60 },
        { label: 'small', percentage: 40 },
      ]),
    ).toBe(
      '42% of eligible identities enter the experiment. Split: Control 0%, big 60%, small 40%.',
    )
  })
})
