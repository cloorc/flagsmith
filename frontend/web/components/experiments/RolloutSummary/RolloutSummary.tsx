import { FC, Fragment } from 'react'
import { ProjectFlag } from 'common/types/responses'
import Icon from 'components/icons/Icon'
import ColorSwatch from 'components/ColorSwatch'
import {
  CONTROL_COLOUR,
  VariationSplitEntry,
  getRolloutSummaryRows,
  getVariationColour,
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
        {rolloutPercentage}% of eligible identities enter the experiment.
        <br />
        {rows.map((row, index) => (
          <Fragment key={row.label}>
            {index > 0 && ', '}
            <ColorSwatch
              className='rollout-summary__swatch'
              color={
                index === 0 ? CONTROL_COLOUR : getVariationColour(index - 1)
              }
              size='sm'
              shape='circle'
            />
            <strong>{row.label}</strong> {row.percentage}%
          </Fragment>
        ))}
        .
        <br />
        Actual time-to-significance depends on traffic, baseline rate, and the
        lift you're trying to detect.
      </span>
    </div>
  )
}

export default RolloutSummary
