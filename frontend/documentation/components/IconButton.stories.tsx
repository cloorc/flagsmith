import React from 'react'
import type { Meta, StoryObj } from 'storybook'

import IconButton from 'components/base/IconButton'
import type { IconButtonProps } from 'components/base/IconButton'
import { Icon } from 'components/icons'

const meta: Meta<IconButtonProps> = {
  component: IconButton,
  parameters: {
    docs: {
      description: {
        component:
          'Icon-only action button. Pass the icon as a child via `<Icon>` and an `aria-label` (required — the button has no text). `variant` (ghost/filled), `size` (small/medium/large) and `shape` (rounded/square) control the look; an optional `tooltip` shows a label on hover.',
      },
    },
    layout: 'centered',
  },
  title: 'Components/IconButton',
}

export default meta

type Story = StoryObj<IconButtonProps>

export const Default: Story = {
  render: () => (
    <IconButton onClick={() => undefined} aria-label='Copy'>
      <Icon name='copy' />
    </IconButton>
  ),
}

export const Sizes: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`small` (32px) for inline copy buttons next to text. `medium` (40px, default) matches the legacy row-action visual. `large` (44px) for emphasised affordances.',
      },
    },
  },
  render: () => (
    <span style={{ alignItems: 'center', display: 'inline-flex', gap: 16 }}>
      <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
        <IconButton variant='filled' size='small' aria-label='Small'>
          <Icon name='trash-2' />
        </IconButton>
        <small>small (32)</small>
      </span>
      <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
        <IconButton variant='filled' size='medium' aria-label='Medium'>
          <Icon name='trash-2' />
        </IconButton>
        <small>medium (40)</small>
      </span>
      <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
        <IconButton variant='filled' size='large' aria-label='Large'>
          <Icon name='trash-2' />
        </IconButton>
        <small>large (44)</small>
      </span>
    </span>
  ),
}

export const Variants: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`ghost` (default) is transparent at rest — used inline next to a value. `filled` has a resting surface — used as the dominant action in a row/cell.',
      },
    },
  },
  render: () => (
    <span style={{ display: 'inline-flex', gap: 16 }}>
      <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
        <IconButton aria-label='Copy'>
          <Icon name='copy' />
        </IconButton>
        <small>ghost</small>
      </span>
      <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
        <IconButton variant='filled' aria-label='Delete'>
          <Icon name='trash-2' />
        </IconButton>
        <small>filled</small>
      </span>
    </span>
  ),
}

export const FilledRowActions: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The `filled` variant in a list of row actions — the visible tile makes the affordance read at a glance.',
      },
    },
  },
  render: () => (
    <div
      style={{
        border: '1px solid var(--color-border-default)',
        borderRadius: 8,
        display: 'inline-flex',
        flexDirection: 'column',
        minWidth: 280,
      }}
    >
      {['payments-api', 'auth-service', 'notifications', 'webhooks'].map(
        (label, i, arr) => (
          <div
            key={label}
            style={{
              alignItems: 'center',
              borderBottom:
                i < arr.length - 1
                  ? '1px solid var(--color-border-default)'
                  : 'none',
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 16px',
            }}
          >
            <span>{label}</span>
            <IconButton variant='filled' aria-label={`Delete ${label}`}>
              <Icon name='trash-2' />
            </IconButton>
          </div>
        ),
      )}
    </div>
  ),
}

export const InlineWithValue: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Typical use: copy-to-clipboard button next to an identifier or value.',
      },
    },
  },
  render: () => (
    <span
      style={{
        alignItems: 'center',
        display: 'inline-flex',
        fontFamily: 'monospace',
        fontSize: 14,
        gap: 4,
      }}
    >
      ident_8f2c4e9a-7b1d-4c5e-9a3b-2f6d8e0c1a5f
      <IconButton aria-label='Copy identity'>
        <Icon name='copy' />
      </IconButton>
    </span>
  ),
}

export const InTableRow: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Inline action in a table row — fits the 32px row affordance area without offsetting other cell content.',
      },
    },
  },
  render: () => (
    <table style={{ borderCollapse: 'collapse', width: 360 }}>
      <thead>
        <tr style={{ borderBottom: '1px solid var(--color-border-default)' }}>
          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Name</th>
          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Value</th>
          <th style={{ padding: '8px 12px', width: 48 }} />
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={{ padding: '8px 12px' }}>api_key</td>
          <td style={{ fontFamily: 'monospace', padding: '8px 12px' }}>
            sk_live_…
          </td>
          <td style={{ padding: '4px 8px', textAlign: 'right' }}>
            <IconButton aria-label='Copy api_key'>
              <Icon name='copy' />
            </IconButton>
          </td>
        </tr>
        <tr>
          <td style={{ padding: '8px 12px' }}>environment</td>
          <td style={{ fontFamily: 'monospace', padding: '8px 12px' }}>
            production
          </td>
          <td style={{ padding: '4px 8px', textAlign: 'right' }}>
            <IconButton aria-label='Copy environment'>
              <Icon name='copy' />
            </IconButton>
          </td>
        </tr>
      </tbody>
    </table>
  ),
}

export const Disabled: Story = {
  render: () => (
    <IconButton disabled aria-label='Copy'>
      <Icon name='copy' />
    </IconButton>
  ),
}

export const DifferentIcons: Story = {
  parameters: {
    docs: {
      description: {
        story: 'IconButton works with any `<Icon>` — copy, edit, trash, etc.',
      },
    },
  },
  render: () => (
    <span style={{ display: 'inline-flex', gap: 4 }}>
      <IconButton aria-label='Copy'>
        <Icon name='copy' />
      </IconButton>
      <IconButton aria-label='Edit'>
        <Icon name='edit' />
      </IconButton>
      <IconButton aria-label='Delete'>
        <Icon name='trash-2' />
      </IconButton>
    </span>
  ),
}

export const Shapes: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`rounded` (default) for most contexts; `square` when the button sits flush in a segmented or gridded control.',
      },
    },
  },
  render: () => (
    <span style={{ alignItems: 'center', display: 'inline-flex', gap: 16 }}>
      <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
        <IconButton variant='filled' shape='rounded' aria-label='Rounded'>
          <Icon name='copy' />
        </IconButton>
        <small>rounded</small>
      </span>
      <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
        <IconButton variant='filled' shape='square' aria-label='Square'>
          <Icon name='copy' />
        </IconButton>
        <small>square</small>
      </span>
    </span>
  ),
}

export const WithTooltip: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Pass `tooltip` to show a label on hover/focus. `aria-label` is still required as the accessible name.',
      },
    },
  },
  render: () => (
    <IconButton aria-label='Copy identity' tooltip='Copy identity'>
      <Icon name='copy' />
    </IconButton>
  ),
}
