import { useGetProjectFlagsQuery } from 'common/services/useProjectFlag'
import {
  useGetFeatureStatesQuery,
  useUpdateFeatureStateMutation,
} from 'common/services/useFeatureState'
import { Environment } from 'common/types/responses'

// Resolves the onboarding demo flag's Development feature state and exposes a
// real, persisted toggle (updateFeatureState) for the flags table. Finds the
// flag by name (the bootstrap returns the name, not the id), then its state in
// the Dev environment.
export const useOnboardingFlag = (
  environment: Environment | null,
  projectId: number | null,
  featureName: string,
) => {
  const { data: flags } = useGetProjectFlagsQuery(
    { project: `${projectId}` },
    { skip: !projectId },
  )
  const flag = flags?.results?.find((f) => f.name === featureName)

  const { data: states } = useGetFeatureStatesQuery(
    { environment: environment?.id, feature: flag?.id },
    { skip: !environment || !flag },
  )
  const state = states?.results?.[0]

  const [updateFeatureState, { isLoading }] = useUpdateFeatureStateMutation()

  const toggle = (enabled: boolean) => {
    if (!environment || !state) {
      return
    }
    updateFeatureState({
      body: { enabled },
      environmentFlagId: state.id,
      environmentId: environment.api_key,
    })
  }

  return {
    enabled: !!state?.enabled,
    isToggling: isLoading,
    ready: !!state,
    toggle,
  }
}
