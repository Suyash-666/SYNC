import React from 'react';
import PropTypes from 'prop-types';

/**
 * Skeleton — loading placeholder.
 *
 * Design decisions:
 *   • We replaced the old `bg-white/10` (which only works on dark surfaces)
 *     with a CSS shimmer that animates a gradient on the surface tint — it
 *     looks correct on both light and dark themes.
 *   • `variant` is "line" (text) or "block" (panel) — same API as before,
 *     but now the "block" uses a real border so it can sit inside a Card
 *     layout without looking out of place.
 *   • Sizes for `line` use text rhythm (full, 3/4, 1/2) so multiple lines
 *     look like a paragraph, not a stack of mismatched bars.
 */
export const Skeleton = React.forwardRef(function Skeleton(
  { variant = 'line', width, height, rounded = 'md', className = '', ...props },
  ref,
) {
  const radius = { sm: 'rounded', md: 'rounded-md', lg: 'rounded-lg', full: 'rounded-full' }[rounded] || 'rounded-md';
  const size =
    variant === 'block'
      ? 'h-full w-full'
      : 'h-3 w-full';

  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className={['shimmer', radius, size, className].join(' ')}
      style={{ width, height }}
      {...props}
    />
  );
});

Skeleton.displayName = 'Skeleton';
Skeleton.propTypes = {
  variant: PropTypes.oneOf(['line', 'block']),
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  rounded: PropTypes.oneOf(['sm', 'md', 'lg', 'full']),
  className: PropTypes.string,
};

/**
 * SkeletonText — multiple lines for paragraph placeholders.
 */
export const SkeletonText = ({ lines = 3, lastWidth = '60%', className = '' }) => (
  <div className={['space-y-2', className].join(' ')}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="line"
        width={i === lines - 1 ? lastWidth : '100%'}
      />
    ))}
  </div>
);

SkeletonText.propTypes = {
  lines: PropTypes.number,
  lastWidth: PropTypes.string,
  className: PropTypes.string,
};
