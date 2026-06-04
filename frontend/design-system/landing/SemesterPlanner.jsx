import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
const { Check } = Icons;

export const SemesterPlanner = ({ className = '' }) => {
  return (
    <section id="features" className={`mx-auto my-20 max-w-7xl px-6 ${className}`}>
      <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <h3 className="text-2xl font-semibold text-foreground">Semester Planner</h3>
          <p className="mt-3 max-w-xl text-foreground-muted">Plan your semester, visualize workload, and stay on top of deadlines with clear module progress and intuitive scheduling.</p>

          <ul className="mt-6 space-y-4">
            <li className="flex items-start gap-3">
              <Check className="mt-1 h-5 w-5 text-brand-600" />
              <div>
                <div className="font-medium text-foreground">Auto-synced course timelines</div>
                <div className="text-sm text-foreground-muted">Dates and tasks sync with your syllabus and calendar.</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Check className="mt-1 h-5 w-5 text-brand-600" />
              <div>
                <div className="font-medium text-foreground">Progress-first UI</div>
                <div className="text-sm text-foreground-muted">Quickly spot modules that need attention with at-a-glance progress bars.</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Check className="mt-1 h-5 w-5 text-brand-600" />
              <div>
                <div className="font-medium text-foreground">Smart reminders</div>
                <div className="text-sm text-foreground-muted">Prioritized tasks so you focus on what moves the needle.</div>
              </div>
            </li>
          </ul>
        </div>

        <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="flex justify-center">
          <div className="w-full max-w-md rounded-2xl bg-[var(--color-surface-card)] border border-border p-4">
            <div className="flex items-center justify-between pb-3">
              <div className="text-sm text-foreground-muted">Spring • 2026</div>
              <div className="text-xs text-foreground-muted">Semester Overview</div>
            </div>

            <div className="mt-3 space-y-4">
              {[
                { name: 'Calculus II', pct: 72 },
                { name: 'Physics Lab', pct: 48 },
                { name: 'Modern History', pct: 89 },
                { name: 'Data Structures', pct: 36 },
              ].map((c) => (
                <div key={c.name}>
                  <div className="flex items-center justify-between text-sm text-foreground-muted">
                    <span>{c.name}</span>
                    <span className="text-foreground font-medium">{c.pct}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-[rgba(255,255,255,0.04)]">
                    <div style={{ width: `${c.pct}%` }} className="h-2 rounded-full bg-brand-500" />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between text-xs text-foreground-muted">
              <div>2 upcoming exams</div>
              <div>4 tasks due this week</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

SemesterPlanner.propTypes = { className: PropTypes.string };

export default SemesterPlanner;
