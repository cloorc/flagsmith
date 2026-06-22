import type { Meta, StoryObj } from 'storybook'

import OnboardingTerminal from 'components/pages/onboarding/OnboardingTerminal'

const meta: Meta<typeof OnboardingTerminal> = {
  args: {
    featureName: 'show_demo_button',
    status: 'listening',
  },
  component: OnboardingTerminal,
  parameters: {
    docs: {
      description: {
        component:
          'The onboarding verify console. Driven by `status`: amber LISTENING with an unchecked checklist and a blinking cursor while waiting, green LIVE with a connection receipt once the first evaluation arrives. Always dark, since a terminal reads the same in light and dark mode.',
      },
    },
    layout: 'padded',
  },
  title: 'Pages/Onboarding/OnboardingTerminal',
}
export default meta

type Story = StoryObj<typeof OnboardingTerminal>

export const Listening: Story = {}

export const Connected: Story = {
  args: { status: 'connected' },
}
