import React, { FC } from 'react'
import classNames from 'classnames'
import { Tag as TTag } from 'common/types/responses'
import FeatureName from 'components/feature-summary/FeatureName'
import Tag from 'components/tags/Tag'
import Switch from 'components/Switch'
import './OnboardingFlagsTable.scss'

export type OnboardingFlagsTableStatus = 'waiting' | 'connected'

export type OnboardingFlagRow = {
  name: string
  description?: string
  tags?: Partial<TTag>[]
  enabled: boolean
}

export type OnboardingFlagsTableProps = {
  status: OnboardingFlagsTableStatus
  flags: OnboardingFlagRow[]
  onToggle: (flag: OnboardingFlagRow, enabled: boolean) => void
  // Name of the flag whose toggle is mid-flight, so its Switch disables.
  togglingFlag?: string | null
}

// The "Your flags" card from the onboarding design: the pre-created flag(s) in a
// real-looking table that reuses the product FeatureName / Tag / Switch. Prop
// driven (the page owns the data and the persisted toggle, see
// useUpdateFeatureStateMutation). `connected` lifts the card with the accent
// border + glow and enables the toggle; `waiting` dims it until the first
// evaluation arrives.
const OnboardingFlagsTable: FC<OnboardingFlagsTableProps> = ({
  flags,
  onToggle,
  status,
  togglingFlag,
}) => {
  const waiting = status === 'waiting'
  return (
    <section className='onboarding-flags'>
      <h3 className='onboarding-flags__title'>Your flags</h3>
      <div
        className={classNames('onboarding-flags__table', {
          'onboarding-flags__table--waiting': waiting,
        })}
      >
        <div className='onboarding-flags__head'>
          <span className='onboarding-flags__col onboarding-flags__col--feature'>
            FEATURE
          </span>
          <span className='onboarding-flags__col onboarding-flags__col--enabled'>
            ENABLED
          </span>
        </div>
        {flags.map((flag) => (
          <div className='onboarding-flags__row' key={flag.name}>
            <div className='onboarding-flags__feature'>
              <div className='onboarding-flags__name-row'>
                <FeatureName name={flag.name} />
                {flag.tags?.map((tag) => (
                  <Tag key={tag.id ?? tag.label} tag={tag} />
                ))}
              </div>
              {flag.description && (
                <p className='onboarding-flags__desc'>{flag.description}</p>
              )}
            </div>
            <div className='onboarding-flags__toggle'>
              <Switch
                checked={flag.enabled}
                disabled={togglingFlag === flag.name}
                onChange={(enabled) => onToggle(flag, enabled)}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default OnboardingFlagsTable
