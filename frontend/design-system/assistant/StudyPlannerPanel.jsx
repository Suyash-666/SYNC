import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Check, Sparkles, Calendar, BookOpen, AlertTriangle, Clock, ArrowRight } from 'lucide-react';

/**
 * StudyPlannerPanel — right-side study planner card on the AI Assistant page.
 */
const BLOCKS = [
  { id: 'b1', time: '9:00 – 10:00',  subject: 'DSA',  topic: 'Revision', tone: 'brand'   },
  { id: 'b2', time: '11:00 – 12:00', subject: 'OS',   topic: 'Notes',    tone: 'warning' },
  { id: 'b3', time: '14:00 – 15:00', subject: 'DBMS', topic: 'Queries',  tone: 'success' },
];

const DEADLINES = [
  { label: 'Project proposal', due: '3 days',    tone: 'warning' },
  { label: 'DBMS quiz',        due: 'tomorrow',  tone: 'danger'  },
  { label: 'DSA assignment',   due: '5 days',    tone: 'success' },
];

const RESOURCES = [
  { label: 'Algorithms Cheat Sheet', icon: '⚡' },
  { label: 'OS Notes PDF',           icon: '💻' },
  { label: 'DBMS Query Guide',       icon: '🗄️' },
];

const TONE_DOT = {
  brand:   'bg-brand-500',
  warning: 'bg-warning',
  success: 'bg-success',
  danger:  'bg-danger',
};

const TONE_PILL = {
  danger:  'bg-danger-soft border-danger/30',
  warning: 'bg-warning-soft border-warning/30',
  success: 'bg-success-soft border-success/30',
};

export default function StudyPlannerPanel() {
  const [open, setOpen] = useState(true);
  const [blocks, setBlocks] = useState(BLOCKS);

  const toggleDone = (id) =>
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, done: !b.done } : b)));

  const doneCount = blocks.filter((b) => b.done).length;
  const pct = Math.round((doneCount / blocks.length) * 100);
  const C = 2 * Math.PI * 20;

  return (
    <div className="h-full">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-2xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">Daily</div>
          <div className="mt-0.5 text-sm font-semibold text-foreground">Study Planner</div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-2xs font-semibold text-foreground-muted transition-colors hover:bg-background-muted hover:text-foreground"
        >
          {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {open ? 'Collapse' : 'Expand'}
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-4"
          >
            {/* Progress ring */}
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12">
                <svg viewBox="0 0 48 48" className="h-full w-full -rotate-90">
                  <circle cx="24" cy="24" r="20" fill="none" className="stroke-border" strokeWidth="5" />
                  <circle
                    cx="24" cy="24" r="20" fill="none" className="stroke-brand-500"
                    strokeWidth="5"
                    strokeDasharray={`${(pct / 100) * C} ${C}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 grid place-items-center text-2xs font-bold text-foreground">
                  {pct}%
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Today's progress</div>
                <div className="text-2xs text-foreground-muted">
                  {doneCount} of {blocks.length} sessions complete
                </div>
              </div>
            </div>

            {/* Sessions */}
            <div>
              <div className="mb-2 text-2xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">Today's sessions</div>
              <ul className="flex flex-col gap-1.5">
                {blocks.map((b) => (
                  <li
                    key={b.id}
                    className={[
                      'flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all',
                      b.done ? 'border-border-subtle bg-background-subtle/40 opacity-60' : 'border-border bg-surface',
                    ].join(' ')}
                  >
                    <span className={['h-2 w-2 shrink-0 rounded-full', b.done ? 'bg-foreground-subtle' : TONE_DOT[b.tone]].join(' ')} />
                    <div className="min-w-0 flex-1">
                      <div className={['text-xs font-semibold', b.done ? 'text-foreground-subtle line-through' : 'text-foreground'].join(' ')}>
                        {b.subject} <span className="text-foreground-subtle">·</span> {b.topic}
                      </div>
                      <div className="font-mono text-2xs text-foreground-muted">{b.time}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleDone(b.id)}
                      className={[
                        'inline-flex items-center gap-1 rounded-md px-2 py-1 text-2xs font-semibold transition-colors',
                        b.done
                          ? 'border border-success/30 bg-success-soft text-success-fg'
                          : 'border border-border bg-surface text-foreground-muted hover:bg-background-muted',
                      ].join(' ')}
                    >
                      {b.done ? <Check className="h-3 w-3" /> : null}
                      {b.done ? 'Done' : 'Mark'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Deadlines */}
            <div>
              <div className="mb-2 text-2xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">Upcoming deadlines</div>
              <ul className="flex flex-col gap-1.5">
                {DEADLINES.map((d) => (
                  <li
                    key={d.label}
                    className={[
                      'flex items-center justify-between rounded-lg border px-3 py-2',
                      TONE_PILL[d.tone],
                    ].join(' ')}
                  >
                    <span className="text-xs font-semibold text-foreground">{d.label}</span>
                    <span className="font-mono text-2xs font-bold text-foreground-muted">{d.due}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <div className="mb-2 text-2xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">Resources</div>
              <ul className="flex flex-col gap-1.5">
                {RESOURCES.map((r) => (
                  <li key={r.label}>
                    <a
                      href="#"
                      className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground-muted transition-colors hover:border-border-strong hover:bg-background-muted hover:text-foreground"
                    >
                      <span className="text-base">{r.icon}</span>
                      {r.label}
                      <ArrowRight className="ml-auto h-3 w-3 text-foreground-subtle" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-glow"
            >
              <Sparkles className="h-4 w-4" /> Generate new plan
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
