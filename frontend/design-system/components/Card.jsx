import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

/**
 * Card — the foundational surface.
 *
 * Design decisions:
 *   • `variant` chooses between three surface treatments:
 *       - `default`  — light raised card with a soft 1px border, used for
 *                      almost all content blocks.
 *       - `elevated` — adds a layered soft shadow for cards that need to
 *                      "lift" off the page (overviews, modals).
 *       - `glass`    — frosted glass used sparingly on the TopNav/Sidebar
 *                      and the auth marketing panel. Strong blur, low alpha.
 *   • `padding` is a single knob — no more `className="p-4"` / `"p-5"` drift.
 *   • `interactive` adds a subtle hover lift (used in clickable list items).
 *   • Header / body / footer slots keep titles aligned: we use a
 *     12px / 16px / 18px stack (eyebrow / title / subtitle).
 *   • `as="section"` / `as="article"` lets the same primitive be a semantic
 *     landmark without forking the component.
 */
const variantStyles = {
  default:
    'bg-surface border border-border shadow-none',
  elevated:
    'bg-surface border border-border shadow-sm',
  glass:
    'glass shadow-md',
  ghost:
    'bg-transparent border border-transparent',
};

const paddingStyles = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6',
  xl:   'p-8',
};

export const Card = React.forwardRef(function Card(
  {
    variant = 'default',
    padding = 'md',
    interactive = false,
    as: Tag = 'div',
    className = '',
    children,
    ...props
  },
  ref,
) {
const computed = [
    'relative rounded-lg',
    'transition-all duration-200 ease-out',
    variantStyles[variant] || variantStyles.default,
    paddingStyles[padding] || paddingStyles.md,
    interactive
      ? 'cursor-pointer hover:border-border-strong hover:bg-surface-raised'
      : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Use motion when interactive so we get the spring hover; plain Tag otherwise
  if (interactive) {
    return (
      <motion.div
        ref={ref}
        className={computed}
        whileTap={{ scale: 0.995 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
  return (
    <Tag ref={ref} className={computed} {...props}>
      {children}
    </Tag>
  );
});

/**
 * CardHeader / CardTitle / CardDescription / CardBody / CardFooter
 * — small composable slots so a card always has the same vertical rhythm.
 */
export const CardHeader = ({ className = '', children, ...props }) => (
  <div className={['mb-4 flex items-start justify-between gap-3', className].join(' ')} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className = '', children, ...props }) => (
  <h3
    className={['text-md font-semibold tracking-tight text-foreground', className].join(' ')}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription = ({ className = '', children, ...props }) => (
  <p
    className={['mt-1 text-sm text-foreground-muted', className].join(' ')}
    {...props}
  >
    {children}
  </p>
);

export const CardEyebrow = ({ className = '', children, ...props }) => (
  <div
    className={[
      'text-2xs font-semibold uppercase tracking-[0.12em] text-foreground-subtle',
      className,
    ].join(' ')}
    {...props}
  >
    {children}
  </div>
);

export const CardBody = ({ className = '', children, ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className = '', children, ...props }) => (
  <div
    className={[
      'mt-5 flex items-center justify-between gap-3 border-t border-border-subtle pt-4',
      className,
    ].join(' ')}
    {...props}
  >
    {children}
  </div>
);

Card.displayName = 'Card';
Card.propTypes = {
  variant: PropTypes.oneOf(['default', 'elevated', 'glass', 'ghost']),
  padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg', 'xl']),
  interactive: PropTypes.bool,
  as: PropTypes.elementType,
  className: PropTypes.string,
  children: PropTypes.node,
};
