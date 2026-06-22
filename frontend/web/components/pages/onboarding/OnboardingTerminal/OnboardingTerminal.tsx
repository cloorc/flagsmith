import React, { FC } from 'react'
import classNames from 'classnames'
import './OnboardingTerminal.scss'

export type OnboardingTerminalStatus = 'listening' | 'connected'

export type OnboardingTerminalProps = {
  status: OnboardingTerminalStatus
  // The flag the SDK is expected to evaluate; drives the checklist and receipt.
  featureName: string
}

// Verify console for the onboarding flow, mirroring the design's "sdk console":
// amber LISTENING with an unchecked checklist and a blinking cursor while
// waiting, green LIVE with a connection receipt once the first evaluation
// arrives. Driven entirely by `status` (the real connection signal lands in
// #7767/#7623). Always dark - it's a terminal - so it carries its own palette
// rather than the theme tokens.
const OnboardingTerminal: FC<OnboardingTerminalProps> = ({
  featureName,
  status,
}) => {
  const connected = status === 'connected'
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
        {connected ? (
          <>
            <p className='onboarding-terminal__line onboarding-terminal__line--ok'>
              [✓] Copy install command
            </p>
            <p className='onboarding-terminal__line onboarding-terminal__line--ok'>
              [✓] Copy code snippet
            </p>
            <p className='onboarding-terminal__line onboarding-terminal__line--ok onboarding-terminal__line--strong'>
              [✓] First evaluation of &apos;{featureName}&apos;
            </p>
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
          <>
            <p className='onboarding-terminal__line onboarding-terminal__line--muted'>
              awaiting first request
            </p>
            <p className='onboarding-terminal__line'>
              [ ] Copy install command
            </p>
            <p className='onboarding-terminal__line'>[ ] Copy code snippet</p>
            <p className='onboarding-terminal__line onboarding-terminal__line--current'>
              [ ] First evaluation of &apos;{featureName}&apos;…
            </p>
            <p className='onboarding-terminal__line onboarding-terminal__line--prompt'>
              $ <span className='onboarding-terminal__cursor' aria-hidden />
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default OnboardingTerminal
