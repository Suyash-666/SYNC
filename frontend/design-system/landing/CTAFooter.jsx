import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, GraduationCap } from 'lucide-react';

export const CTAFooter = ({ className = '' }) => {
  return (
    <footer className={`mt-20 border-t border-border bg-background ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-6xl px-6 py-16 text-center"
      >
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
          <GraduationCap className="h-5 w-5" />
        </div>
        <h3 className="mt-5 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Start building your academic system today.
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-foreground-muted">
          Join ambitious students who trust SYNC to organize coursework, energize study time, and collaborate effectively.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-glow"
          >
            Create free account <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center rounded-xl border border-border bg-surface px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-background-muted"
          >
            I already have an account
          </Link>
        </div>

        <div className="mt-12 flex flex-col items-center gap-3 border-t border-border pt-6 text-sm text-foreground-muted md:flex-row md:justify-between">
          <div>© {new Date().getFullYear()} SYNC. All rights reserved.</div>
          <div className="flex gap-4">
            <a href="#privacy" className="transition-colors hover:text-foreground">Privacy</a>
            <a href="#terms"   className="transition-colors hover:text-foreground">Terms</a>
            <a href="#contact" className="transition-colors hover:text-foreground">Contact</a>
          </div>
        </div>
      </motion.div>
    </footer>
  );
};

CTAFooter.propTypes = { className: PropTypes.string };
export default CTAFooter;
