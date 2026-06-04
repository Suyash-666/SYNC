import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { CardEyebrow, CardTitle } from './Card';
import { Button } from './Button';

/**
 * PageHeader — eyebrow + title + subtitle + actions.
 *
 * Design decisions:
 *   • Single header primitive so every protected page has the same opening
 *     rhythm (eyebrow → title → subtitle → actions). This is the most
 *     recognizable visual feature of every premium SaaS dashboard.
 *   • The `eyebrow` and `title` render through the Card primitives for
 *     consistent letter spacing and color. Title is display-font by default.
 *   • Actions slot accepts a single React node or array of nodes (buttons,
 *     segmented controls, etc.). We don't constrain the layout — that
 *     decision is per-page.
 *   • Subtle fade-up entrance; 350ms feels like a real page-load.
 */
export const PageHeader = ({
  eyebrow,
  title,
  description,
  actions,
  className = '',
}) => (
  <motion.header
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    className={['flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className].join(' ')}
  >
    <div>
      {eyebrow ? <CardEyebrow>{eyebrow}</CardEyebrow> : null}
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-1.5 text-sm text-foreground-muted">{description}</p>
      ) : null}
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
  </motion.header>
);

PageHeader.displayName = 'PageHeader';
PageHeader.propTypes = {
  eyebrow: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  actions: PropTypes.node,
  className: PropTypes.string,
};

export default PageHeader;
