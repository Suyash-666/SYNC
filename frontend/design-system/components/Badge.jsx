import React from 'react';
import PropTypes from 'prop-types';

/**
 * Badge — small status pill.
 *
 * Design decisions:
 *   • `tone` is the API name (rather than the old `variant`) because we use
 *     semantic tones: neutral / brand / success / warning / danger / info.
 *     Every tone renders in two styles: `solid` (filled, for primary status)
 *     and `soft` (tinted background, used 95% of the time).
 *   • Solid uses brand/inverse foreground; soft uses tone foreground over a
 *     tinted background — easy to scan at small sizes.
 *   • `dot` adds a small leading dot; great for status pills.
 *   • Sizes are xs (h-5) and sm (h-6). Anything bigger is a Card, not a Badge.
 */
const toneMap = {
  neutral: {
    solid: 'bg-foreground text-background',
    soft:  'bg-background-muted text-foreground-muted',
  },
  brand: {
    solid: 'bg-brand-500 text-brand-foreground',
    soft:  'bg-brand-50 text-brand-700',
  },
  success: {
    solid: 'bg-success text-white',
    soft:  'bg-success-soft text-success-fg',
  },
  warning: {
    solid: 'bg-warning text-white',
    soft:  'bg-warning-soft text-warning-fg',
  },
  danger: {
    solid: 'bg-danger text-white',
    soft:  'bg-danger-soft text-danger-fg',
  },
  info: {
    solid: 'bg-info text-white',
    soft:  'bg-info-soft text-info-fg',
  },
};

const dotColorMap = {
  neutral: 'bg-foreground-muted',
  brand:   'bg-brand-500',
  success: 'bg-success',
  warning: 'bg-warning',
  danger:  'bg-danger',
  info:    'bg-info',
};

const sizeMap = {
  xs: 'h-5 px-2 text-2xs',
  sm: 'h-6 px-2.5 text-xs',
};

export const Badge = React.forwardRef(function Badge(
  {
    tone = 'neutral',
    style: styleKind = 'soft',
    size = 'sm',
    dot = false,
    leftIcon,
    rightIcon,
    className = '',
    children,
    ...props
  },
  ref,
) {
  const palette = toneMap[tone] || toneMap.neutral;
  const computed = [
    'inline-flex items-center gap-1.5 rounded-full font-medium',
    'whitespace-nowrap',
    palette[styleKind] || palette.soft,
    sizeMap[size] || sizeMap.sm,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span ref={ref} className={computed} {...props}>
      {dot ? (
        <span
          aria-hidden
          className={['h-1.5 w-1.5 rounded-full', dotColorMap[tone] || dotColorMap.neutral].join(' ')}
        />
      ) : null}
      {leftIcon ? <span aria-hidden className="-ml-0.5 inline-flex">{leftIcon}</span> : null}
      <span>{children}</span>
      {rightIcon ? <span aria-hidden className="-mr-0.5 inline-flex">{rightIcon}</span> : null}
    </span>
  );
});

Badge.displayName = 'Badge';
Badge.propTypes = {
  tone: PropTypes.oneOf(['neutral', 'brand', 'success', 'warning', 'danger', 'info']),
  style: PropTypes.oneOf(['solid', 'soft']),
  size: PropTypes.oneOf(['xs', 'sm']),
  dot: PropTypes.bool,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  className: PropTypes.string,
  children: PropTypes.node,
};
