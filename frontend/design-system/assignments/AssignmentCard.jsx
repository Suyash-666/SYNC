import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, CircleDot, Flame, AlertCircle } from 'lucide-react';
import { Badge, Card } from '../components';

/**
 * AssignmentCard — kanban card.
 *
 * Design decisions:
 *   • No more inline styles. The card uses the design-system tokens
 *     (background, border, shadow) so a theme change is one variable.
 *   • The accent strip on overdue cards is a top border, not a hard
 *     gradient — softens the urgency cue.
 *   • Priority badge maps to the Badge component's `tone` (danger/warning/
 *     success/neutral). Subject pill uses `tone="brand"`. Consistent with
 *     the rest of the app.
 *   • Move arrows (← →) are icon buttons with hover background, not raw
 *     `onMouseEnter/Leave` JS handlers. Less code, more accessible.
 */
const priorityTone = {
  HIGH:   { tone: 'danger',  icon: Flame },
  MEDIUM: { tone: 'warning', icon: CircleDot },
  LOW:    { tone: 'success', icon: CircleDot },
};

function daysUntil(dateStr) {
  if (!dateStr) return 0;
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

function AssignmentCard({ item, onOpen, onMove }) {
  const days = daysUntil(item.dueDate);
  const overdue = days < 0;
  const dueSoon = days >= 0 && days < 2;
  const priorityKey = (item.priority || 'Medium').toUpperCase();
  const p = priorityTone[priorityKey] || priorityTone.MEDIUM;

  const dueTone = overdue ? 'danger' : dueSoon ? 'warning' : 'neutral';
  const dueLabel = overdue
    ? `${Math.abs(days)}d overdue`
    : days === 0
    ? 'Due today'
    : `${days}d left`;

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.995 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
    >
      <Card
        padding="sm"
        interactive
        onClick={() => onOpen(item)}
        className={[
          'group cursor-pointer',
          overdue ? 'ring-1 ring-danger/30' : '',
        ].join(' ')}
      >
        {/* Subject + title */}
        <div className="mb-2.5 flex items-start gap-2">
          <Badge tone="brand" size="xs">
            {item.subject}
          </Badge>
        </div>
        <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {item.title}
        </h4>

        {/* Progress */}
        {typeof item.progress === 'number' ? (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-2xs font-medium">
              <span className="uppercase tracking-[0.12em] text-foreground-subtle">Progress</span>
              <span className="font-mono text-brand-600">{item.progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-background-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.progress}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={[
                  'h-full rounded-full',
                  item.progress === 100 ? 'bg-success' : 'bg-gradient-to-r from-brand-500 to-brand-400',
                ].join(' ')}
              />
            </div>
          </div>
        ) : null}

        {/* Footer row */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Badge tone={p.tone} size="xs" leftIcon={<p.icon className="h-2.5 w-2.5" />}>
              {item.priority}
            </Badge>
            <Badge tone={dueTone} size="xs" leftIcon={overdue ? <AlertCircle className="h-2.5 w-2.5" /> : null}>
              {dueLabel}
            </Badge>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMove?.(item, 'prev'); }}
              aria-label="Move to previous column"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-foreground-subtle transition-colors hover:bg-background-muted hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMove?.(item, 'next'); }}
              aria-label="Move to next column"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-foreground-subtle transition-colors hover:bg-background-muted hover:text-foreground"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Due date footer */}
        {item.dueDate ? (
          <div className="mt-2.5 flex items-center gap-1.5 border-t border-border-subtle pt-2 text-2xs text-foreground-subtle">
            <Calendar className="h-3 w-3" />
            {new Date(item.dueDate).toLocaleDateString(undefined, {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </div>
        ) : null}
      </Card>
    </motion.div>
  );
}

export default memo(AssignmentCard);
