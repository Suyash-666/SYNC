import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

/**
 * Button — premium, accessible button.
 *
 * Design decisions:
 *   • `variant` covers the 5 button roles in a SaaS product (primary, secondary,
 *     ghost, subtle, danger). This stops callers from reaching for `className`
 *     to recolor buttons — color and depth are centralized.
 *   • `size` controls padding + text + radius in one place so layouts stay
 *     vertically aligned. `icon` is a square variant for icon-only buttons.
 *   • `leadingIcon` / `trailingIcon` slots take any React node — usually a
 *     Lucide icon. This kills the `inline-flex items-center gap-2` boilerplate
 *     in 50+ places.
 *   • `isLoading` renders a soft spinner and disables interaction; we don't
 *     remove children (keeps the button width stable and avoids layout shift).
 *   • Hover uses a 1.5% y-translate + shadow lift, both under 150ms — feels
 *     snappy without overshooting.
 *   • Focus ring uses the brand color at 40% opacity so it reads on every
 *     variant without competing with the button's own color.
 */
const sizeStyles = {
  xs:  'h-7  px-2.5 text-xs  gap-1.5 rounded-md',
  sm:  'h-8  px-3   text-sm  gap-1.5 rounded-md',
  md:  'h-10 px-4   text-sm  gap-2   rounded-md',
  lg:  'h-11 px-5   text-md  gap-2   rounded-md',
  xl:  'h-12 px-6   text-lg  gap-2.5 rounded-md',
  icon:'h-10 w-10   p-0         gap-0   rounded-md',
};

const variantStyles = {
  primary:
    'bg-foreground text-background shadow-none hover:bg-foreground/90 active:bg-foreground',
  secondary:
    'bg-surface text-foreground border border-border shadow-none hover:bg-background-subtle hover:border-border-strong',
  subtle:
    'bg-background-muted text-foreground hover:bg-border',
  ghost:
    'text-foreground-muted hover:text-foreground hover:bg-background-muted',
  danger:
    'bg-danger text-white shadow-sm hover:opacity-90 active:opacity-100',
  outline:
    'bg-transparent text-foreground border border-border hover:bg-background-muted',
};

export const Button = React.forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    fullWidth = false,
    leadingIcon,
    trailingIcon,
    className = '',
    children,
    type = 'button',
    ...props
  },
  ref,
) {
  const isDisabled = disabled || isLoading;
  const computed =
    [
      'inline-flex items-center justify-center font-medium whitespace-nowrap select-none',
      'transition-colors duration-150 ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      variantStyles[variant] || variantStyles.primary,
      sizeStyles[size] || sizeStyles.md,
      fullWidth ? 'w-full' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={computed}
      whileTap={isDisabled ? undefined : { scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      {...props}
    >
      {isLoading ? (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      ) : leadingIcon ? (
        <span aria-hidden className="inline-flex shrink-0">
          {leadingIcon}
        </span>
      ) : null}
      {children ? <span className="inline-flex items-center">{children}</span> : null}
      {!isLoading && trailingIcon ? (
        <span aria-hidden className="inline-flex shrink-0">
          {trailingIcon}
        </span>
      ) : null}
    </motion.button>
  );
});

Button.displayName = 'Button';
Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'subtle', 'ghost', 'danger', 'outline']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', 'icon']),
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  leadingIcon: PropTypes.node,
  trailingIcon: PropTypes.node,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default Button;
