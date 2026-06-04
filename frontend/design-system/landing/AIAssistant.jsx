import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

export const AIAssistant = ({ className = '' }) => {
  return (
    <section className={`relative mx-auto my-20 max-w-6xl px-6 ${className}`}>
      <div className="absolute inset-x-0 top-0 -z-10 flex justify-center">
        <div className="mt-6 h-80 w-[80%] max-w-4xl rounded-3xl bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[rgba(99,102,241,0.06)] to-transparent blur-3xl opacity-40" />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mx-auto max-w-4xl">
        <h3 className="text-center text-2xl font-semibold text-foreground">Your AI Study Partner, Always On</h3>
        <p className="mt-3 text-center text-foreground-muted">Ask concise explanations, get tailored practice questions, and request summaries of lectures — all inside SYNC.</p>

        <div className="mt-8 flex justify-center">
          <div className="w-full max-w-2xl rounded-2xl bg-[var(--color-surface-card)] border border-border p-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-[rgba(255,255,255,0.04)]" />
                <div>
                  <div className="rounded-md bg-[rgba(255,255,255,0.03)] px-3 py-2 text-sm text-foreground">What are the key topics to revise for Calculus II before the midterm?</div>
                  <div className="mt-2 text-xs text-foreground-muted">You • 2m ago</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-brand-500" />
                <div>
                  <div className="rounded-md bg-[rgba(99,102,241,0.06)] px-3 py-2 text-sm text-foreground">
                    <strong>SYNC AI</strong>
                    <div className="mt-2 text-sm text-foreground">Focus on integration techniques, differential equations applications, and series tests. Prioritize solving past midterms and timed problem sets.</div>
                    <ul className="mt-2 text-sm text-foreground-muted list-disc pl-5">
                      <li>Integration by parts & substitution</li>
                      <li>Convergence of series (comparison, ratio)</li>
                      <li>Applications: motion, area between curves</li>
                    </ul>
                  </div>
                  <div className="mt-2 text-xs text-foreground-muted">SYNC AI • instant</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

AIAssistant.propTypes = { className: PropTypes.string };
export default AIAssistant;
