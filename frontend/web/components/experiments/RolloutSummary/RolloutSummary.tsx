import { FC, Fragment } from 'react'
import { ProjectFlag } from 'common/types/responses'
import Icon from 'components/icons/Icon'
import {
  VariationSplitEntry,
  getRolloutSummaryRows,
} from 'components/experiments/rollout'
import './RolloutSummary.scss'

type RolloutSummaryProps = {
  selectedFeature: ProjectFlag
  rolloutPercentage: number
  variationSplit: VariationSplitEntry[]
}

const RolloutSummary: FC<RolloutSummaryProps> = ({
  rolloutPercentage,
  selectedFeature,
  variationSplit,
}) => {
  const rows = getRolloutSummaryRows(selectedFeature, variationSplit)

  return (
    <div className='rollout-summary'>
      <Icon name='people' width={20} />
      <span>
        {rolloutPercentage}% of eligible identities enter the experiment. Split:{' '}
        {rows.map((row, index) => (
          <Fragment key={row.label}>
            {index > 0 && ', '}
            <strong>{row.label}</strong> {row.percentage}%
          </Fragment>
        ))}
        .
      </span>
    </div>
  )
}

export default RolloutSummary
