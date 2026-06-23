import { FC, ReactNode, useCallback, useEffect, useState } from 'react'
import {
  useGetExperimentBayesianResultsQuery,
  useRefreshExperimentBayesianResultsMutation,
} from 'common/services/useExperiment'
import { ExperimentStatus } from 'common/types/responses'
import RefreshControl from 'components/base/forms/RefreshControl'
import {
  POLL_TIMEOUT_MS,
  REFRESH_POLL_INTERVAL_MS,
  canRefreshResults,
  deriveResultsViewState,
} from './resultsViewState'

const parseRetryAfter = (err: unknown): number | null => {
  const fetchErr = err as {
    status?: number
    retryAfter?: number | null
  }
  if (fetchErr.status !== 429) return null
  if (fetchErr.retryAfter) return fetchErr.retryAfter
  return 300
}

const formatCountdown = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

type ExperimentResultsRefreshControlProps = {
  environmentId: string
  experimentId: number
  status: ExperimentStatus
}

const REFRESH_DISABLED_COPY: Record<string, string> = {
  final: 'Refresh is disabled because the experiment is complete.',
  not_started: 'Start the experiment to compute results.',
}

const ExperimentResultsRefreshControl: FC<
  ExperimentResultsRefreshControlProps
> = ({ environmentId, experimentId, status }) => {
  const [pollInterval, setPollInterval] = useState(0)
  const [refreshRequested, setRefreshRequested] = useState(false)
  const [pollStartedAt, setPollStartedAt] = useState<number | null>(null)
  const [retryAfter, setRetryAfter] = useState<number | null>(null)

  const { data: results } = useGetExperimentBayesianResultsQuery(
    { environmentId, experimentId },
    { pollingInterval: pollInterval },
  )
  const [refresh, { isLoading: isSubmitting }] =
    useRefreshExperimentBayesianResultsMutation()

  const viewState = deriveResultsViewState(results)
  const availability = canRefreshResults(status, results)

  const pollTimedOut =
    pollStartedAt !== null && Date.now() - pollStartedAt > POLL_TIMEOUT_MS
  const shouldPoll =
    !pollTimedOut && (viewState.kind === 'refreshing' || refreshRequested)
  const nextPollInterval = shouldPoll ? REFRESH_POLL_INTERVAL_MS : 0
  useEffect(() => {
    setPollInterval(nextPollInterval)
  }, [nextPollInterval])

  useEffect(() => {
    if (viewState.kind === 'loaded' || viewState.kind === 'error') {
      setRefreshRequested(false)
      setPollStartedAt(null)
    }
  }, [viewState.kind])

  useEffect(() => {
    if (pollTimedOut) {
      setRefreshRequested(false)
      setPollStartedAt(null)
    }
  }, [pollTimedOut])

  useEffect(() => {
    if (retryAfter === null || retryAfter <= 0) return
    const timer = setInterval(() => {
      setRetryAfter((prev) => {
        if (prev === null || prev <= 1) return null
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [retryAfter !== null]) // eslint-disable-line react-hooks/exhaustive-deps

  const isRefreshing =
    refreshRequested || viewState.kind === 'refreshing' || isSubmitting
  const hasData = !!results?.payload

  const handleRefresh = useCallback(async () => {
    setRefreshRequested(true)
    setPollStartedAt(Date.now())
    const result = await refresh({ environmentId, experimentId })
    if ('error' in result && result.error) {
      setRefreshRequested(false)
      setPollStartedAt(null)
      const seconds = parseRetryAfter(result.error)
      if (seconds !== null) {
        setRetryAfter(seconds)
      } else {
        toast('Failed to refresh results', 'danger')
      }
    }
  }, [refresh, environmentId, experimentId])

  let label: ReactNode = undefined
  if (retryAfter !== null) {
    label = `Computing, retry in ${formatCountdown(retryAfter)}`
  } else if (isRefreshing) {
    label = 'Computing… results will update automatically.'
  } else if (viewState.kind === 'error') {
    label = (
      <span className='text-danger'>The last results computation failed.</span>
    )
  }

  return (
    <RefreshControl
      disabled={!availability.canRefresh || isRefreshing || retryAfter !== null}
      disabledReason={
        availability.reason
          ? REFRESH_DISABLED_COPY[availability.reason]
          : undefined
      }
      isRefreshing={isRefreshing && hasData}
      label={label}
      onRefresh={handleRefresh}
    >
      Refresh results
    </RefreshControl>
  )
}

export default ExperimentResultsRefreshControl
