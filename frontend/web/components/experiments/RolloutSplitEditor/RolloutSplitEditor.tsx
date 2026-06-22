import { ChangeEvent, FC } from 'react'
import { MultivariateOption } from 'common/types/responses'
import Input from 'components/base/forms/Input'
import ErrorMessage from 'components/ErrorMessage'
import ColorSwatch from 'components/ColorSwatch'
import Utils from 'common/utils/utils'
import { getDefaultVariantKey } from 'common/utils/multivariate'
import { colorTextAction, colorTextSuccess } from 'common/theme/tokens'
import {
  VariationSplitEntry,
  getControlPercentage,
  getMultivariateOptionValue,
} from 'components/experiments/rollout'
import './RolloutSplitEditor.scss'

type RolloutSplitEditorProps = {
  controlValue: string
  multivariateOptions: MultivariateOption[]
  variationSplit: VariationSplitEntry[]
  onChange: (entries: VariationSplitEntry[]) => void
}

const RolloutSplitEditor: FC<RolloutSplitEditorProps> = ({
  controlValue,
  multivariateOptions,
  onChange,
  variationSplit,
}) => {
  const controlPercentage = getControlPercentage(variationSplit)
  const invalid = controlPercentage < 0 || controlPercentage > 100

  const getPercentage = (optionId: number): number =>
    variationSplit.find((v) => v.multivariate_feature_option === optionId)
      ?.percentage_allocation ?? 0

  const setPercentage = (optionId: number, percentage: number) =>
    onChange(
      variationSplit.map((entry) =>
        entry.multivariate_feature_option === optionId
          ? { ...entry, percentage_allocation: percentage }
          : entry,
      ),
    )

  return (
    <div className='rollout-split'>
      {invalid && (
        <ErrorMessage
          errorMessageClass='mb-2'
          error='Your variation percentage splits total to over 100%'
        />
      )}

      <div className='rollout-split__row'>
        <div className='rollout-split__name'>
          <ColorSwatch color={colorTextSuccess} size='md' shape='circle' />
          <span className='rollout-split__name-text'>Control</span>
          <span className='rollout-split__control-tag'>control</span>
        </div>
        <div className='rollout-split__value'>
          {controlValue ? (
            <span className='rollout-split__value-badge' title={controlValue}>
              {controlValue}
            </span>
          ) : null}
        </div>
        <div className='rollout-split__weight'>
          <span className='rollout-split__weight-readonly'>
            {Math.max(0, controlPercentage)}
          </span>
          <span className='text-muted'>%</span>
        </div>
      </div>

      {multivariateOptions.map((option, index) => {
        const value = getMultivariateOptionValue(option)
        return (
          <div key={option.id} className='rollout-split__row'>
            <div className='rollout-split__name'>
              <ColorSwatch color={colorTextAction} size='md' shape='circle' />
              <span className='rollout-split__name-text'>
                {option.key || getDefaultVariantKey(index)}
              </span>
            </div>
            <div className='rollout-split__value'>
              {value ? (
                <span className='rollout-split__value-badge' title={value}>
                  {value}
                </span>
              ) : null}
            </div>
            <div className='rollout-split__weight'>
              <Input
                type='number'
                size='small'
                underline
                centered
                value={getPercentage(option.id)}
                step='any'
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const val = Utils.safeParseEventValue(e)
                  setPercentage(option.id, val ? parseFloat(val) : 0)
                }}
              />
              <span className='text-muted'>%</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default RolloutSplitEditor
