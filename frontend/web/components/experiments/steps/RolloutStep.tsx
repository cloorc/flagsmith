import { FC } from 'react'
import { ProjectFlag } from 'common/types/responses'
import ContentCard from 'components/base/grid/ContentCard'
import RolloutSlider from 'components/experiments/RolloutSlider'
import RolloutSplitEditor from 'components/experiments/RolloutSplitEditor'
import {
  VariationSplitEntry,
  buildRolloutSummary,
  getRolloutSummaryRows,
} from 'components/experiments/rollout'

type RolloutStepProps = {
  selectedFeature: ProjectFlag | null
  rolloutPercentage: number
  variationSplit: VariationSplitEntry[]
  onRolloutChange: (value: number) => void
  onSplitChange: (entries: VariationSplitEntry[]) => void
}

const RolloutStep: FC<RolloutStepProps> = ({
  onRolloutChange,
  onSplitChange,
  rolloutPercentage,
  selectedFeature,
  variationSplit,
}) => {
  if (!selectedFeature) {
    return (
      <ContentCard title='Rollout configuration'>
        <p className='text-muted mb-0'>
          Select a feature flag in the Setup step to configure the rollout.
        </p>
      </ContentCard>
    )
  }

  const controlValue =
    selectedFeature.environment_feature_state?.feature_state_value?.toString() ??
    ''

  return (
    <div className='d-flex flex-column gap-4'>
      <ContentCard
        title='Sample Size'
        description='Choose what share of eligible identities enters the experiment.'
      >
        <RolloutSlider value={rolloutPercentage} onChange={onRolloutChange} />
      </ContentCard>

      <ContentCard
        title='Variation Split'
        description='How traffic entering the experiment is divided across variations. Values come from the feature; adjust the weights for this experiment.'
      >
        <RolloutSplitEditor
          controlValue={controlValue}
          multivariateOptions={selectedFeature.multivariate_options}
          variationSplit={variationSplit}
          onChange={onSplitChange}
        />
      </ContentCard>

      <ContentCard title='Summary'>
        <p className='mb-0'>
          {buildRolloutSummary(
            rolloutPercentage,
            getRolloutSummaryRows(selectedFeature, variationSplit),
          )}
        </p>
      </ContentCard>
    </div>
  )
}

export default RolloutStep
