import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Calendar, Clock, Loader2, AlertCircle } from 'lucide-react';
import { assignmentsApi } from '../src/api/assignments.api';

/**
 * StudyPlannerPanel — right-side panel on the AI Assistant page.
 *
 * Shows the user's real upcoming assignment deadlines, pulled from the
 * assignments API. Falls back to a friendly empty state when the user
 * has no open work.
 */

const TONE_PILL = {
  danger:  'bg-danger-soft border-danger/30 text-danger',
  warning: 'bg-warning-soft border-warning/30 text-foreground',
  success: 'bg-success-soft border-success/30 text-foreground',
  brand:   'bg-brand-50 border-brand/30 text-brand-700',
};

function daysUntil(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const ms = d.getTime() - Date.now();
  const days = Math.ceil(ms / 86400000);
  if (days < 0) return { label: 'Overdue', tone: 'danger' };
  if (days === 0) return { label: 'Due today', tone: 'danger' };
  if (days === 1) return { label: 'Tomorrow', tone: 'warning' };
  if (days <= 3) return { label: `${days} days`, tone: 'warning' };
  if (days <= 7) return { label: `${days} days`, tone: 'brand' };
  return { label: `${days} days`, tone: 'success' };
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function StudyPlannerPanel() {
  const [open, setOpen] = useState(true);
  const [assignments, setAssignments] = useState(null); // null = loading
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await assignmentsApi.getAll();
        if (cancelled) return;
        const rows = Array.isArray(res) ? res : (res?.data || []);
        setAssignments(rows);
      } catch (err) {
        if (cancelled) return;
        setError(err?.response?.data?.message || err?.message || 'Failed to load');
        setAssignments([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const upcoming = useMemo(() => {
    if (!Array.isArray(assignments)) return [];
    return assignments
      .filter((a) => a?.status !== 'DONE' && a?.status !== 'COMPLETED')
      .filter((a) => a?.due_date)
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .slice(0, 6);
  }, [assignments]);

  return (
    <div className="h-full">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-2xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">Upcoming</div>
          <div className="mt-0.5 text-sm font-semibold text-foreground">Deadlines</div>
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
            className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4"
          >
            {assignments === null ? (
              <div className="flex items-center gap-2 text-2xs text-foreground-muted">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading assignments…
              </div>
            ) : error ? (
              <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-2xs text-foreground">
                <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-danger" />
                <span>Couldn't load deadlines — {error}</span>
              </div>
            ) : upcoming.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 py-6 text-center">
                <div className="text-2xl">🎉</div>
                <div className="text-xs font-semibold text-foreground">No upcoming deadlines</div>
                <div className="text-2xs text-foreground-muted">You're all caught up.</div>
              </div>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {upcoming.map((a) => {
                  const due = daysUntil(a.due_date);
                  return (
                    <li
                      key={a.id || a._id}
                      className={['flex items-center justify-between rounded-lg border px-3 py-2', TONE_PILL[due?.tone || 'brand']].join(' ')}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold">{a.title || a.name || 'Untitled assignment'}</div>
                        <div className="mt-0.5 flex items-center gap-1.5 font-mono text-2xs text-foreground-muted">
                          <Calendar className="h-3 w-3" /> {formatDate(a.due_date)}
                          {a.subject?.name ? <span>· {a.subject.name}</span> : null}
                        </div>
                      </div>
                      <span className="ml-3 inline-flex items-center gap-1 font-mono text-2xs font-bold">
                        <Clock className="h-3 w-3" /> {due?.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
