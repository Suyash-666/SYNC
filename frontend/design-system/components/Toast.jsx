import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Info, AlertTriangle, X, XCircle } from 'lucide-react';

/**
 * Toast — premium, animated notification.
 *
 * Design decisions:
 *   • Stacked at the bottom-right (Linear/Notion convention). Bottom-right is
 *     out of the way of primary content and the user's reading path; top-
 *     right toasts get visually crossed by modals.
 *   • Variant icon + tone-matched color, not just background. The icon
 *     doubles as a scannable status cue without reading the message.
 *   • Stacked list with `stack` prop, animated by framer-motion AnimatePresence.
 *   • Hover pauses the auto-dismiss timer — small detail, big perceived
 *     quality improvement.
 *   • Close button always visible (small chevron on hover would hide it from
 *     keyboard users).
 */
const variantConfig = {
  success: {
    icon: Check,
    ring:  'border-success/30 bg-success-soft text-success-fg',
    iconWrap: 'bg-success/15 text-success',
  },
  error: {
    icon: XCircle,
    ring:  'border-danger/30 bg-danger-soft text-danger-fg',
    iconWrap: 'bg-danger/15 text-danger',
  },
  warning: {
    icon: AlertTriangle,
    ring:  'border-warning/30 bg-warning-soft text-warning-fg',
    iconWrap: 'bg-warning/15 text-warning',
  },
  info: {
    icon: Info,
    ring:  'border-info/30 bg-info-soft text-info-fg',
    iconWrap: 'bg-info/15 text-info',
  },
};

const ToastItem = ({ variant = 'info', message, description, onClose, duration = 4000, id }) => {
  const [paused, setPaused] = React.useState(false);
  const config = variantConfig[variant] || variantConfig.info;
  const Icon = config.icon;

  useEffect(() => {
    if (!onClose || duration <= 0 || paused) return undefined;
    const t = window.setTimeout(() => onClose(id), duration);
    return () => window.clearTimeout(t);
  }, [paused, duration, onClose, id]);

  return (
    <motion.div
      role={variant === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={[
        'pointer-events-auto flex w-[360px] max-w-[calc(100vw-2rem)] items-start gap-3 overflow-hidden rounded-xl border bg-surface p-3.5 shadow-xl',
        config.ring,
      ].join(' ')}
    >
      <span className={['mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', config.iconWrap].join(' ')}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1 min-w-0">
        {message ? <div className="text-sm font-semibold text-foreground">{message}</div> : null}
        {description ? <div className="mt-0.5 text-xs leading-relaxed text-foreground-muted">{description}</div> : null}
      </div>
      {onClose ? (
        <button
          type="button"
          onClick={() => onClose(id)}
          aria-label="Dismiss notification"
          className="-mr-1 -mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-foreground-subtle transition-colors hover:bg-background-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </motion.div>
  );
};

/**
 * Toast — accepts either a single message or a stack of items.
 *
 *   <Toast open message="Saved" variant="success" />
 *   <Toast stack={[{id:1, message:'...', variant:'success'}]} onClose={remove} />
 */
export const Toast = ({
  open = false,
  message,
  description,
  variant = 'info',
  duration = 4000,
  onClose,
  className = '',
}) => {
  if (!open) return null;
  return (
    <div className={['pointer-events-none fixed bottom-4 right-4 z-[var(--z-toast)] flex flex-col gap-2', className].join(' ')}>
      <ToastItem
        id="single"
        variant={variant}
        message={message}
        description={description}
        duration={duration}
        onClose={onClose}
      />
    </div>
  );
};

export const ToastStack = ({ items = [], onClose, className = '' }) => (
  <div className={['pointer-events-none fixed bottom-4 right-4 z-[var(--z-toast)] flex flex-col gap-2', className].join(' ')}>
    <AnimatePresence initial={false}>
      {items.map((item) => (
        <ToastItem key={item.id} {...item} onClose={onClose} />
      ))}
    </AnimatePresence>
  </div>
);

Toast.displayName = 'Toast';
Toast.propTypes = {
  open: PropTypes.bool,
  message: PropTypes.string,
  description: PropTypes.string,
  variant: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  duration: PropTypes.number,
  onClose: PropTypes.func,
  className: PropTypes.string,
};
