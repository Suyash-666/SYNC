import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownAZ, ArrowUpAZ, Calendar, CircleDot, Flame, AlertCircle, Search } from 'lucide-react';
import { Badge, Card, EmptyState } from '../components';

const priorityTone = {
  HIGH:   { tone: 'danger',  icon: Flame,    rank: 3 },
  MEDIUM: { tone: 'warning', icon: CircleDot,rank: 2 },
  LOW:    { tone: 'success', icon: CircleDot,rank: 1 },
};

const statusLabel = {
  todo:       'To Do',
  inprogress: 'In Progress',
  review:     'Review',
  submitted:  'Submitted',
};

const statusTone = {
  todo:       'info',
  inprogress: 'warning',
  review:     'brand',
  submitted:  'success',
};

function daysUntil(dateStr) {
  if (!dateStr) return 0;
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

/**
 * AssignmentList — table-style view over the same data the kanban
 * consumes.  Keeps the page header, filter bar, and detail modal
 * exactly as-is.  Sorts in place; click a column header to toggle.
 */
export default function AssignmentList({ items, onOpen }) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('dueDate'); // dueDate | priority | title | subject
  const [sortDir, setSortDir] = useState('asc');     // asc | desc

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      (it.title || '').toLowerCase().includes(q) ||
      (it.subject || '').toLowerCase().includes(q) ||
      (statusLabel[it.status] || '').toLowerCase().includes(q) ||
      (it.priority || '').toLowerCase().includes(q),
    );
  }, [items, query]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    const dir = sortDir === 'asc' ? 1 : -1;
    copy.sort((a, b) => {
      switch (sortKey) {
        case 'priority': {
          const ra = priorityTone[(a.priority || '').toUpperCase()]?.rank || 0;
          const rb = priorityTone[(b.priority || '').toUpperCase()]?.rank || 0;
          if (ra !== rb) return (ra - rb) * dir;
          // tiebreak: due date asc
          return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
        }
        case 'title':   return (a.title || '').localeCompare(b.title || '') * dir;
        case 'subject': return (a.subject || '').localeCompare(b.subject || '') * dir;
        case 'dueDate':
        default: {
          const ta = new Date(a.dueDate || 0).getTime();
          const tb = new Date(b.dueDate || 0).getTime();
          return (ta - tb) * dir;
        }
      }
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const setSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'priority' ? 'desc' : 'asc');
    }
  };

  const SortHeader = ({ k, children, className = '' }) => {
    const active = sortKey === k;
    const Icon = sortDir === 'asc' ? ArrowUpAZ : ArrowDownAZ;
    return (
      <button
        type="button"
        onClick={() => setSort(k)}
        className={[
          'inline-flex items-center gap-1 text-2xs font-semibold uppercase tracking-[0.12em] transition-colors',
          active ? 'text-foreground' : 'text-foreground-subtle hover:text-foreground',
          className,
        ].join(' ')}
      >
        {children}
        {active ? <Icon className="h-3 w-3" /> : null}
      </button>
    );
  };

  if (items.length === 0) {
    return (
      <Card padding="lg">
        <EmptyState
          icon="📋"
          title="No assignments yet"
          description="Create one to see it here, or in the Kanban / Calendar view."
          actionLabel="Add assignment"
        />
      </Card>
    );
  }

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Search row */}
      <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background-subtle px-2 py-1.5">
          <Search className="h-3.5 w-3.5 text-foreground-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, subject, status…"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none"
          />
        </div>
        <span className="font-mono text-2xs text-foreground-subtle">
          {sorted.length} of {items.length}
        </span>
      </div>

      {/* Table header */}
      <div className="hidden grid-cols-[2.5rem_minmax(0,1fr)_8rem_8rem_8rem_6rem] items-center gap-3 border-b border-border-subtle bg-background-subtle/50 px-4 py-2 md:grid">
        <span />
        <SortHeader k="title">Title</SortHeader>
        <SortHeader k="subject">Subject</SortHeader>
        <SortHeader k="priority">Priority</SortHeader>
        <SortHeader k="dueDate">Due</SortHeader>
        <SortHeader k="status" className="justify-end">Status</SortHeader>
      </div>

      {/* Rows */}
      <ul>
        {sorted.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-foreground-muted">
            Nothing matches that search.
          </li>
        ) : sorted.map((item, idx) => {
          const days = daysUntil(item.dueDate);
          const overdue = days < 0;
          const dueSoon = days >= 0 && days < 2;
          const dueTone = overdue ? 'danger' : dueSoon ? 'warning' : 'neutral';
          const dueLabel = overdue
            ? `${Math.abs(days)}d overdue`
            : days === 0
            ? 'Due today'
            : `${days}d left`;
          const p = priorityTone[(item.priority || '').toUpperCase()] || priorityTone.MEDIUM;
          const PIcon = p.icon;
          const isLast = idx === sorted.length - 1;
          return (
            <motion.li
              key={item.id}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.12 }}
            >
              <button
                type="button"
                onClick={() => onOpen?.(item)}
                className={[
                  'grid w-full grid-cols-1 items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-background-subtle/60 md:grid-cols-[2.5rem_minmax(0,1fr)_8rem_8rem_8rem_6rem] md:gap-3',
                  isLast ? '' : 'border-b border-border-subtle',
                ].join(' ')}
              >
                {/* Status dot */}
                <span className="hidden md:inline-flex">
                  <span className="h-2 w-2 rounded-full bg-foreground-muted" />
                </span>

                {/* Title + meta */}
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">{item.title}</div>
                  {item.description ? (
                    <div className="mt-0.5 truncate text-xs text-foreground-muted">{item.description}</div>
                  ) : null}
                  {/* Mobile-only meta row */}
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 md:hidden">
                    <Badge tone="brand" size="xs">{item.subject || 'No subject'}</Badge>
                    <Badge tone={p.tone} size="xs" leftIcon={<PIcon className="h-2.5 w-2.5" />}>
                      {item.priority || 'Medium'}
                    </Badge>
                    <Badge tone={dueTone} size="xs" leftIcon={overdue ? <AlertCircle className="h-2.5 w-2.5" /> : null}>
                      {dueLabel}
                    </Badge>
                    <Badge tone={statusTone[item.status] || 'neutral'} size="xs">
                      {statusLabel[item.status] || 'To Do'}
                    </Badge>
                  </div>
                </div>

                {/* Subject (desktop) */}
                <div className="hidden truncate md:block">
                  <Badge tone="brand" size="xs">{item.subject || 'No subject'}</Badge>
                </div>

                {/* Priority (desktop) */}
                <div className="hidden md:block">
                  <Badge tone={p.tone} size="xs" leftIcon={<PIcon className="h-2.5 w-2.5" />}>
                    {item.priority || 'Medium'}
                  </Badge>
                </div>

                {/* Due (desktop) */}
                <div className="hidden items-center gap-1.5 md:flex">
                  <Calendar className="h-3 w-3 text-foreground-subtle" />
                  <span className="text-xs text-foreground-muted">
                    {item.dueDate
                      ? new Date(item.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                      : '—'}
                  </span>
                  <Badge tone={dueTone} size="xs" leftIcon={overdue ? <AlertCircle className="h-2.5 w-2.5" /> : null}>
                    {dueLabel}
                  </Badge>
                </div>

                {/* Status (desktop) */}
                <div className="hidden justify-end md:flex">
                  <Badge tone={statusTone[item.status] || 'neutral'} size="xs">
                    {statusLabel[item.status] || 'To Do'}
                  </Badge>
                </div>
              </button>
            </motion.li>
          );
        })}
      </ul>
    </Card>
  );
}
