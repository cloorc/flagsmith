import React, { ButtonHTMLAttributes, forwardRef } from 'react'
import cn from 'classnames'
import BareButton from 'components/base/forms/BareButton'
import Tooltip from 'components/Tooltip'
import './IconButton.scss'

export type IconButtonVariant = 'ghost' | 'filled'
export type IconButtonSize = 'small' | 'medium' | 'large'
export type IconButtonShape = 'rounded' | 'square'

export type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-label'
> & {
  // Required: an icon-only button has no text, so it needs an explicit
  // accessible name.
  'aria-label': string
  variant?: IconButtonVariant
  size?: IconButtonSize
  shape?: IconButtonShape
  // Optional visible label shown on hover/focus.
  tooltip?: string
}

// Built on BareButton, so the reset, focus-visible ring and disabled
// semantics are shared; IconButton only adds the icon-specific sizing,
// shape and surface styling.
const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      children,
      className,
      shape = 'rounded',
      size = 'medium',
      tooltip,
      variant = 'ghost',
      ...rest
    },
    ref,
  ) => {
    const button = (
      <BareButton
        {...rest}
        ref={ref}
        className={cn(
          'icon-button',
          `icon-button--${variant}`,
          `icon-button--${size}`,
          `icon-button--${shape}`,
          className,
        )}
      >
        {/* aria-hidden so the accessible name comes only from aria-label */}
        <span className='icon-button__icon' aria-hidden>
          {children}
        </span>
      </BareButton>
    )

    return tooltip ? <Tooltip title={button}>{tooltip}</Tooltip> : button
  },
)

IconButton.displayName = 'IconButton'

export default IconButton
