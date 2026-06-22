import { useLocation } from 'react-router-dom'

export type OnboardingConnectionStatus = 'listening' | 'connected'

// Single source of truth for the verify console's connection status, so the
// page never reads the raw signal directly.
//
// Today it reports the pre-connection state, with a `?connected` query-param
// escape hatch so the connected UI can be exercised in the live flow (and
// screenshots) before the real signal exists.
//
// TODO(#7767): replace the body with the real first-evaluation signal (poll /
// subscribe for the first SDK evaluation of the demo flag). The caller
// (OnboardingFlow) and the `?connected` test hook stay unchanged.
export const useOnboardingConnection = (): OnboardingConnectionStatus => {
  const { search } = useLocation()
  return new URLSearchParams(search).has('connected')
    ? 'connected'
    : 'listening'
}
