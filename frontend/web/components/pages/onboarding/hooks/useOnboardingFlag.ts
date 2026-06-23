import { useGetProjectFlagsQuery } from 'common/services/useProjectFlag'
import {
  useGetFeatureStatesQuery,
  useUpdateFeatureStateMutation,
} from 'common/services/useFeatureState'
import { useGetTagsQuery } from 'common/services/useTag'
import { Environment, Tag } from 'common/types/responses'

// Resolves the onboarding demo flag's Development feature state and exposes a
// real, persisted toggle (updateFeatureState) for the flags table. Finds the
// flag by name (the bootstrap returns the name, not the id), then its state in
// the Dev environment. Also resolves the flag's real tags, so attaching a tag
// to the flag shows up in the onboarding table automatically.
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

  const { data: projectTags } = useGetTagsQuery(
    { projectId: projectId ?? 0 },
    { skip: !projectId },
  )
  const tags = (flag?.tags ?? [])
    .map((id) => projectTags?.find((tag) => tag.id === id))
    .filter((tag): tag is Tag => !!tag)

  const { data: states } = useGetFeatureStatesQuery(
    { environment: environment?.id, feature: flag?.id },
    { skip: !environment || !flag },
  )
  const state = states?.results?.[0]

  const [updateFeatureState, { isLoading }] = useUpdateFeatureStateMutation()

  // Persisted toggle. Not optimistic: the Switch reflects the RTK-cached state
  // and is disabled mid-flight, so a failure just leaves the old value. Toast on
  // failure, matching the header rename UX, rather than failing silently.
  const toggle = async (enabled: boolean) => {
    if (!environment || !state) {
      return
    }
    try {
      await updateFeatureState({
        body: { enabled },
        environmentFlagId: state.id,
        environmentId: environment.api_key,
      }).unwrap()
    } catch {
      toast('Couldn’t update your flag. Please try again.', 'danger')
    }
  }

  return {
    enabled: !!state?.enabled,
    isToggling: isLoading,
    ready: !!state,
    tags,
    toggle,
  }
}
