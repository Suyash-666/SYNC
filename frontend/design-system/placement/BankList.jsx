import React, { useMemo, useState } from 'react';
import { Check, Circle, Clock, Search } from 'lucide-react';
import { Badge, Button, Card, EmptyState } from '../components';

/**
 * BankList — the shared rendering for DSA / Aptitude / Interview / Resume
 * checklist content.  Each tab on the placement page feeds in:
 *   - `category`   (the PlacementCategory enum value: 'DSA' | 'INTERVIEW' | 'APTITUDE' | 'RESUME')
 *   - `bank`       (a topic-grouped array from the data modules)
 *   - `progress`   (the user's existing PlacementProgress rows)
 *   - `onToggle`   (async (item, topic, nextStatus) => void)
 *
 * The component is fully read/write aware: it queries progress by
 * `(category, item_name)` so a tick on a problem writes to Supabase
 * and survives a refresh.  It does not block on the progress query —
 * the user can start ticking items even before the query returns.
 */
function statusFor(progressRows, itemName) {
  const row = progressRows.find((p) => p.item_name === itemName);
  return row?.status || 'NOT_STARTED';
}

const statusBadge = (status) => {
  if (status === 'COMPLETED')   return { label: 'Done',         className: 'bg-success-soft text-success' };
  if (status === 'IN_PROGRESS') return { label: 'In progress',  className: 'bg-warning-soft text-warning' };
  return                          { label: 'Not started',   className: 'bg-background-subtle text-foreground-muted' };
};

const difficultyColor = (d) => {
  if (d === 'EASY')   return 'bg-success-soft text-success';
  if (d === 'MEDIUM') return 'bg-warning-soft text-warning';
  if (d === 'HARD')   return 'bg-danger-soft text-danger';
  return 'bg-background-subtle text-foreground-muted';
};

export default function BankList({ category, bank, progress = [], onToggle, onMarkInProgress, headerNote }) {
  const [query, setQuery] = useState('');
  const [activeTopic, setActiveTopic] = useState(bank?.[0]?.topic || null);

  // Build a flat filterable list across all topics so the search works
  // even when the user types a phrase that doesn't match the active topic.
  const allItems = useMemo(() => {
    return (bank || []).flatMap((group) =>
      group.items.map((it) => ({ ...it, topic: group.topic, icon: group.icon })),
    );
  }, [bank]);

  const filteredBySearch = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return allItems.filter(
      (it) =>
        it.name.toLowerCase().includes(q) ||
        it.topic.toLowerCase().includes(q) ||
        (it.hint || '').toLowerCase().includes(q),
    );
  }, [query, allItems]);

  const visibleItems = filteredBySearch
    ?? (bank.find((g) => g.topic === activeTopic)?.items || []);

  // Stats for the active view (or filtered view, when searching).
  const stats = useMemo(() => {
    const rows = filteredBySearch || (bank.find((g) => g.topic === activeTopic)?.items || []);
    const total = rows.length;
    let done = 0;
    let inProgress = 0;
    rows.forEach((it) => {
      const s = statusFor(progress, it.name);
      if (s === 'COMPLETED') done++;
      else if (s === 'IN_PROGRESS') inProgress++;
    });
    return { total, done, inProgress };
  }, [filteredBySearch, activeTopic, bank, progress]);

  const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      {/* Sidebar — topic list, search, and per-topic progress */}
      <Card padding="md" className="self-start">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background-subtle px-2 py-1.5">
          <Search className="h-3.5 w-3.5 text-foreground-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none"
          />
        </div>

        <div className="mt-4 text-2xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">
          Topics
        </div>
        <div className="mt-2 space-y-1">
          {bank.map((group) => {
            const isActive = !query && group.topic === activeTopic;
            return (
              <button
                key={group.topic}
                type="button"
                onClick={() => { setQuery(''); setActiveTopic(group.topic); }}
                className={[
                  'flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors',
                  isActive
                    ? 'border-[var(--color-accent)] bg-[rgba(99,102,241,0.12)] text-foreground'
                    : 'border-border bg-background-subtle/50 text-foreground-muted hover:text-foreground',
                ].join(' ')}
              >
                <span className="truncate">
                  <span className="mr-1.5">{group.icon}</span>
                  {group.topic}
                </span>
                <span className="text-2xs text-foreground-subtle">{group.items.length}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl border border-border bg-background-subtle/50 p-3">
          <div className="text-2xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">
            {query ? 'Search results' : 'Topic progress'}
          </div>
          <div className="mt-1 font-display text-2xl font-semibold text-foreground">{pct}%</div>
          <div className="mt-1 text-xs text-foreground-muted">
            {stats.done}/{stats.total} done
            {stats.inProgress > 0 ? ` · ${stats.inProgress} in progress` : ''}
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background">
            <div
              className="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Main panel — current topic's items, each tickable */}
      <Card padding="md">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-2xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">
              {query ? 'Search' : (bank.find((g) => g.topic === activeTopic)?.topic || category)}
            </div>
            <div className="mt-1 text-base font-semibold text-foreground">
              {query
                ? `${filteredBySearch.length} match${filteredBySearch.length === 1 ? '' : 'es'} for “${query}”`
                : `${stats.done}/${stats.total} done · ${stats.inProgress} in progress`}
            </div>
            {headerNote ? (
              <div className="mt-0.5 text-xs text-foreground-muted">{headerNote}</div>
            ) : null}
          </div>
        </div>

        {visibleItems.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No matches"
            description="Try a different search term, or clear the search to see all topics."
            compact
          />
        ) : (
          <ul className="space-y-2">
            {visibleItems.map((item) => {
              const status = statusFor(progress, item.name);
              const isDone = status === 'COMPLETED';
              const isInProgress = status === 'IN_PROGRESS';
              const sb = statusBadge(status);
              return (
                <li
                  key={item.id}
                  className={[
                    'rounded-2xl border p-4 transition-colors',
                    isDone
                      ? 'border-success/30 bg-success-soft/40'
                      : 'border-border bg-[rgba(255,255,255,0.03)]',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => onToggle?.(item, item.topic, isDone ? 'NOT_STARTED' : 'COMPLETED')}
                      className={[
                        'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-all',
                        isDone
                          ? 'border-success bg-success text-white'
                          : 'border-foreground-muted/40 bg-transparent text-transparent hover:border-foreground/60',
                      ].join(' ')}
                      aria-label={isDone ? 'Mark as not started' : 'Mark as done'}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className={['font-medium', isDone ? 'line-through text-foreground-muted' : 'text-foreground'].join(' ')}>
                          {item.name}
                        </div>
                        {item.difficulty ? (
                          <span className={['rounded-md px-1.5 py-0.5 text-2xs font-semibold', difficultyColor(item.difficulty)].join(' ')}>
                            {item.difficulty}
                          </span>
                        ) : null}
                        <span className={['rounded-md px-1.5 py-0.5 text-2xs font-semibold', sb.className].join(' ')}>
                          {sb.label}
                        </span>
                      </div>
                      {item.hint ? (
                        <div className="mt-1 text-xs text-foreground-muted">{item.hint}</div>
                      ) : null}
                      {!query ? (
                        <div className="mt-1 text-2xs uppercase tracking-[0.14em] text-foreground-subtle">
                          {item.icon} {item.topic}
                        </div>
                      ) : null}
                    </div>

                    {!isDone ? (
                      onMarkInProgress ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          leadingIcon={<Clock className="h-3.5 w-3.5" />}
                          onClick={() => onMarkInProgress?.(item, item.topic, isInProgress ? 'NOT_STARTED' : 'IN_PROGRESS')}
                          className="shrink-0 text-foreground-muted"
                        >
                          {isInProgress ? 'Stop' : 'Start'}
                        </Button>
                      ) : null
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
