import {
  ExperimentBayesianResults,
  ExperimentStatus,
} from 'common/types/responses'

export type ResultsViewState =
  | { kind: 'empty' }
  | { kind: 'loaded' }
  | { kind: 'refreshing' }
  | { kind: 'error'; staleAvailable: boolean }

export type RefreshReason = 'not_started' | 'final'
export type RefreshAvailability = {
  canRefresh: boolean
  reason?: RefreshReason
}

export const REFRESH_POLL_INTERVAL_MS = 10000
export const POLL_TIMEOUT_MS = 120000

const ms = (iso: string | null): number => (iso ? new Date(iso).getTime() : 0)

const isRefreshing = (r: ExperimentBayesianResults): boolean => {
  const requested = ms(r.refresh_requested_at)
  return requested > 0 && requested > Math.max(ms(r.as_of), ms(r.last_error_at))
}

const hasError = (r: ExperimentBayesianResults): boolean =>
  ms(r.last_error_at) > ms(r.as_of)

export const deriveResultsViewState = (
  results: ExperimentBayesianResults | null | undefined,
): ResultsViewState => {
  if (!results) return { kind: 'empty' }
  if (isRefreshing(results)) return { kind: 'refreshing' }
  if (hasError(results)) {
    return { kind: 'error', staleAvailable: !!results.payload }
  }
  if (results.payload) return { kind: 'loaded' }
  return { kind: 'empty' }
}

export const canRefreshResults = (
  status: ExperimentStatus,
  results: ExperimentBayesianResults | null | undefined,
): RefreshAvailability => {
  if (status === 'created') return { canRefresh: false, reason: 'not_started' }
  if (results?.is_final) return { canRefresh: false, reason: 'final' }
  return { canRefresh: true }
}
