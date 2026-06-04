import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Modal — premium, accessible dialog.
 *
 * Design decisions:
 *   • Sizes via `size` prop: sm, md, lg, xl. Caps the maximum width so a
 *     detail modal can't stretch to 1200px on a 4K monitor.
 *   • Header / body / footer slots — most modals have all three, and we
 *     shouldn't be re-implementing the header/close button in every page.
 *   • Closes on Escape and on backdrop click — both are non-negotiable for
 *     accessibility. (Originally a draft modal only closed on backdrop click.)
 *   • Focus is moved into the modal on open and restored on close. We use a
 *     ref so the consumer doesn't have to wire it.
 *   • Backdrop blur + 60% black overlay: a "premium" feel without making the
 *     page invisible (Stripe/Linear use ~50% blur).
 */
const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  '2xl': 'max-w-4xl',
  full: 'max-w-[calc(100vw-2rem)]',
};

export const Modal = React.forwardRef(function Modal(
  {
    isOpen,
    onClose,
    title,
    description,
    size = 'md',
    closeOnBackdrop = true,
    closeOnEscape = true,
    hideHeader = false,
    children,
    footer,
    className = '',
    ...props
  },
  ref,
) {
  const innerRef = useRef(null);
  const previousActive = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    // Lock scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Remember the active element so we can restore focus
    previousActive.current = document.activeElement;
    // Focus the first focusable element in the modal
    const focusable = innerRef.current?.querySelector(
      'input, select, textarea, button, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();

    const onKey = (e) => {
      if (closeOnEscape && e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
      // Restore focus
      if (previousActive.current?.focus) previousActive.current.focus();
    };
  }, [isOpen, closeOnEscape, onClose]);

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) onClose?.();
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            ref={(node) => {
              innerRef.current = node;
              if (typeof ref === 'function') ref(node);
              else if (ref) ref.current = node;
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            aria-describedby={description ? 'modal-desc' : undefined}
            className={[
              'relative w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl',
              sizeMap[size] || sizeMap.md,
              className,
            ].join(' ')}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            {...props}
          >
            {!hideHeader ? (
              <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
                <div>
                  {title ? (
                    <h2 id="modal-title" className="text-lg font-semibold tracking-tight text-foreground">
                      {title}
                    </h2>
                  ) : null}
                  {description ? (
                    <p id="modal-desc" className="mt-1 text-sm text-foreground-muted">
                      {description}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="-mr-2 -mt-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-background-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}
            <div className="px-6 py-4">{children}</div>
            {footer ? (
              <div className="flex items-center justify-end gap-2 border-t border-border-subtle bg-background-subtle/50 px-6 py-3">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
});

Modal.displayName = 'Modal';
Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  description: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', '2xl', 'full']),
  closeOnBackdrop: PropTypes.bool,
  closeOnEscape: PropTypes.bool,
  hideHeader: PropTypes.bool,
  children: PropTypes.node,
  footer: PropTypes.node,
  className: PropTypes.string,
};
