import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * SlideMenu — animated side drawer.
 *
 * Design decisions:
 *   • Accepts `width`, `overlayClassName`, `panelClassName` so it can be
 *     themed per use (e.g. dim + blur for command palette, opaque for
 *     mobile nav).
 *   • Framer-motion enters/exits the panel (spring) and the overlay
 *     (fade) independently. The previous CSS-only version was fine for
 *     `translateX(0)` but couldn't ease the overlay out cleanly.
 *   • Closes on Escape and on backdrop click. Esc-to-close is required for
 *     accessibility on any modal/drawer.
 *   • Locks body scroll while open so the page behind doesn't scroll when
 *     the user arrow-keys past the end of the drawer.
 */
export default function SlideMenu({
  open,
  onClose,
  width = '320px',
  overlayClassName = '',
  panelClassName = '',
  showCloseButton = false,
  title,
  children,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-40"
          initial="hidden"
          animate="visible"
          exit="hidden"
          role="presentation"
        >
          <motion.div
            className={['absolute inset-0', overlayClassName].join(' ')}
            onClick={onClose}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            transition={{ duration: 0.18 }}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title || 'Side menu'}
            className={[
              'absolute left-0 top-0 h-full overflow-hidden',
              panelClassName,
            ].join(' ')}
            style={{ width }}
            variants={{
              hidden: { x: '-100%' },
              visible: { x: 0 },
            }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            {showCloseButton ? (
              <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
                <div className="text-sm font-semibold text-foreground">{title || 'Menu'}</div>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={onClose}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted hover:bg-background-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}
            {children}
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

SlideMenu.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  overlayClassName: PropTypes.string,
  panelClassName: PropTypes.string,
  showCloseButton: PropTypes.bool,
  title: PropTypes.string,
  children: PropTypes.node,
};
SlideMenu.defaultProps = { open: false, onClose: () => {}, children: null };
