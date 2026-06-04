import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

export const Collaboration = ({ className = '' }) => {
  return (
    <section className={`mx-auto my-20 max-w-7xl px-6 ${className}`}>
      <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="rounded-2xl bg-[var(--color-surface-card)] border border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-foreground">Study Better, Together</h3>
            <p className="mt-2 text-foreground-muted">Collaborate in real-time: shared notes, live highlights, and synced task lists so study groups stay focused and productive.</p>
          </div>

          <div className="ml-6 flex items-center gap-3">
            <div className="flex -space-x-2">
              <div className="h-10 w-10 rounded-full border border-border bg-[rgba(255,255,255,0.04)]" />
              <div className="h-10 w-10 rounded-full border border-border bg-[rgba(255,255,255,0.06)]" />
              <div className="h-10 w-10 rounded-full border border-border bg-brand-500" />
            </div>
            <div className="rounded-md bg-[rgba(255,255,255,0.03)] px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="text-xs font-semibold text-[var(--color-success)]">Live</div>
                <div className="text-sm text-foreground">Shared Notes • 3 collaborators</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

Collaboration.propTypes = { className: PropTypes.string };
export default Collaboration;
