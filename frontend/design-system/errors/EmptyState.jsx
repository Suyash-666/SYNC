import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Button } from '../components';

/**
 * EmptyState — premium "nothing here" panel.
 *
 * Design decisions:
 *   • Accepts a React node for `icon` (Lucide icon) or a string emoji as a
 *     fallback. The previous version hard-coded `text-4xl` emoji.
 *   • Centered in a Card with a soft border, gentle scale-in animation.
 *   • Optional primary action button and secondary action (link).
 *   • `compact` is for inline use inside list panels (smaller padding).
 */
export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  compact = false,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={[
        'flex items-center justify-center',
        compact ? 'py-10' : 'py-16',
        className,
      ].join(' ')}
    >
      <div className="max-w-md text-center">
        {icon ? (
          <div className={[
            'mx-auto mb-4 grid place-items-center rounded-2xl bg-brand-50 text-brand-600',
            compact ? 'h-10 w-10' : 'h-14 w-14',
          ].join(' ')}
          >
            {typeof icon === 'string' ? (
              <span className={compact ? 'text-xl' : 'text-2xl'}>{icon}</span>
            ) : (
              React.cloneElement(icon, { className: compact ? 'h-5 w-5' : 'h-6 w-6' })
            )}
          </div>
        ) : null}
        {title ? (
          <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h3>
        ) : null}
        {description ? (
          <p className="mt-1.5 text-sm text-foreground-muted">{description}</p>
        ) : null}
        {(actionLabel || secondaryLabel) ? (
          <div className="mt-5 flex items-center justify-center gap-2">
            {actionLabel ? (
              <Button onClick={onAction}>{actionLabel}</Button>
            ) : null}
            {secondaryLabel ? (
              <Button variant="ghost" onClick={onSecondary}>{secondaryLabel}</Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

EmptyState.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string,
  description: PropTypes.string,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
  secondaryLabel: PropTypes.string,
  onSecondary: PropTypes.func,
  compact: PropTypes.bool,
  className: PropTypes.string,
};
