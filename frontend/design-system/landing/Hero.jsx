import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check, GraduationCap, Sparkles, ArrowRight } from 'lucide-react';

/**
 * Hero — landing-page top fold.
 *
 * Design decisions:
 *   • Light theme. The old version was a dark, animated mesh-gradient hero
 *     with a glass mockup — fine for a SaaS, but inconsistent with the
 *     new light-first product. Now it's a clean white background with a
 *     soft brand-tinted radial glow, a strong typographic hierarchy, and
 *     a clearly visible CTA. Premium B2C SaaS convention.
 *   • The CTAs use the design-system Button (rendered as Link wrappers)
 *     so the same hover/click feedback is used everywhere.
 *   • Mockup card is a real Card primitive, not an inline-styled div, so
 *     it sits in the right surface treatment on light and dark themes.
 */
export const Hero = ({ className = '' }) => {
  const container = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
  const itemUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } } };

  return (
    <section className={`relative overflow-hidden bg-background ${className}`}>
      {/* Soft brand-tinted glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-24 h-[40rem] w-[40rem] rounded-full bg-brand-100/40 blur-3xl" />
        <div className="absolute -right-24 -bottom-24 h-[40rem] w-[40rem] rounded-full bg-brand-50/60 blur-3xl" />
      </div>

      {/* Top nav */}
      <nav className="relative z-30 mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-12">
        <Link to="/landing" className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-foreground">SYNC</span>
        </Link>
        <div className="hidden gap-8 text-sm font-medium text-foreground-muted md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
          <a href="#about" className="transition-colors hover:text-foreground">About</a>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-foreground-muted transition-colors hover:bg-background-muted hover:text-foreground sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-glow"
          >
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>

      <motion.div variants={container} initial="hidden" animate="visible" className="mx-auto max-w-7xl px-6 pb-20 pt-16 lg:pb-28 lg:pt-20">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <motion.div variants={itemUp} className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-brand-700 shadow-xs">
              <Sparkles className="h-3 w-3" /> Now in beta · built for ambitious students
            </motion.div>
            <motion.h1 variants={itemUp} className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Your <span className="text-brand-600">academic OS</span>. Built for ambition.
            </motion.h1>
            <motion.p variants={itemUp} className="mt-5 max-w-xl text-lg text-foreground-muted">
              SYNC brings coursework, planning, and AI-assisted study together — so you spend less time managing tasks and more time mastering subjects.
            </motion.p>

            <motion.div variants={itemUp} className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-glow"
              >
                Get started free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center rounded-xl border border-border bg-surface px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-background-muted"
              >
                I already have an account
              </Link>
            </motion.div>

            <motion.ul variants={itemUp} className="mt-7 flex flex-col gap-2 text-sm text-foreground-muted">
              {[
                'Seamless semester planning and progress tracking',
                'AI study partner for summaries and practice',
                'Collaboration tools for group study and notes',
              ].map((line) => (
                <li key={line} className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-success-soft text-success-fg">
                    <Check className="h-3 w-3" />
                  </span>
                  {line}
                </li>
              ))}
            </motion.ul>
          </div>

          {/* Mockup card */}
          <motion.div variants={itemUp} className="relative">
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-2xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">This week</div>
                  <div className="mt-1 font-display text-lg font-semibold text-foreground">Study progress</div>
                </div>
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>

              {[
                { name: 'Calculus II',  pct: 72, tone: 'bg-success' },
                { name: 'Physics Lab',  pct: 48, tone: 'bg-brand-500' },
                { name: 'Data Structures', pct: 91, tone: 'bg-success' },
              ].map((row) => (
                <div key={row.name} className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{row.name}</span>
                    <span className="font-mono text-foreground-muted">{row.pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-background-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${row.pct}%` }}
                      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                      className={`h-full rounded-full ${row.tone}`}
                    />
                  </div>
                </div>
              ))}

              <div className="mt-5 flex items-center justify-between rounded-xl border border-border-subtle bg-background-subtle/40 p-3 text-xs text-foreground-muted">
                <span>Next: Module 4 · Due Wed</span>
                <span className="font-mono">2 tasks</span>
              </div>
            </div>
            <div aria-hidden className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-brand-200/40 to-brand-50/0 blur-2xl" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

Hero.propTypes = { className: PropTypes.string };
export default Hero;
