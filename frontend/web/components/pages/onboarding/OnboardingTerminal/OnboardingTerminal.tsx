import React, { FC } from 'react'
import classNames from 'classnames'
import './OnboardingTerminal.scss'

export type OnboardingTerminalProps = {
  featureName: string
  installCopied: boolean
  snippetCopied: boolean
  // First SDK evaluation received (the connection signal, #7767).
  connected: boolean
}

// Verify console for the onboarding flow, mirroring the design's "sdk console".
// The checklist ticks as the user acts: copy install, copy snippet, then the
// first evaluation flips the badge to LIVE and prints the connection receipt.
// Always dark - it's a terminal - so it carries its own palette, not the theme
// tokens.
const OnboardingTerminal: FC<OnboardingTerminalProps> = ({
  connected,
  featureName,
  installCopied,
  snippetCopied,
}) => {
  const steps = [
    { done: installCopied, label: 'Copy install command' },
    { done: snippetCopied, label: 'Copy code snippet' },
    { done: connected, label: `First evaluation of '${featureName}'` },
  ]
  // The first unfinished step is the active one (amber).
  const currentIndex = steps.findIndex((step) => !step.done)

  return (
    <div className='onboarding-terminal'>
      <div className='onboarding-terminal__bar'>
        <span className='onboarding-terminal__dot onboarding-terminal__dot--red' />
        <span className='onboarding-terminal__dot onboarding-terminal__dot--amber' />
        <span className='onboarding-terminal__dot onboarding-terminal__dot--green' />
        <span className='onboarding-terminal__title'>
          flagsmith — sdk console
        </span>
        <span
          className={classNames('onboarding-terminal__badge', {
            'onboarding-terminal__badge--listening': !connected,
            'onboarding-terminal__badge--live': connected,
          })}
        >
          <span className='onboarding-terminal__badge-dot' />
          {connected ? 'LIVE' : 'LISTENING'}
        </span>
      </div>

      <div className='onboarding-terminal__body' aria-live='polite'>
        {!connected && (
          <p className='onboarding-terminal__line onboarding-terminal__line--muted'>
            awaiting first request
          </p>
        )}
        {steps.map((step, index) => (
          <p
            key={step.label}
            className={classNames('onboarding-terminal__line', {
              'onboarding-terminal__line--current':
                !step.done && index === currentIndex,
              'onboarding-terminal__line--ok': step.done,
            })}
          >
            {step.done ? '[✓]' : '[ ]'} {step.label}
            {!step.done && index === steps.length - 1 ? '…' : ''}
          </p>
        ))}
        {connected ? (
          <>
            <p className='onboarding-terminal__line onboarding-terminal__line--dim'>
              SDK initialized · flags loaded · {featureName}: true
            </p>
            <p className='onboarding-terminal__line onboarding-terminal__line--ok onboarding-terminal__line--strong'>
              ✓ Connected
            </p>
            <p className='onboarding-terminal__line onboarding-terminal__line--ok'>
              ✓ {featureName} is live
            </p>
          </>
        ) : (
          <p className='onboarding-terminal__line onboarding-terminal__line--prompt'>
            $ <span className='onboarding-terminal__cursor' aria-hidden />
          </p>
        )}
      </div>
    </div>
  )
}

export default OnboardingTerminal
