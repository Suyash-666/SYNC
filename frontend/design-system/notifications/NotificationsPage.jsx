import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Inbox,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Users,
  CalendarCheck2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Skeleton,
  Toast,
} from '../components';
import { useNotifications } from '../src/hooks/useNotifications';

// ============================================================================
// NotificationsPage — alert inbox.
// Replaces the previous flat list. Same data, same hook, same mutations;
// only the page composition and rendering changed.  Realtime is preserved
// because we still consume the same `useNotifications` hook (which dispatches
// `prependNotification` from the socket / supabase channel on its own).
// ============================================================================

// Type metadata: icon, tone, label. Adding a new server type later is a
// one-liner here — the rest of the page falls back to "System" for any
// unknown type so old data still renders cleanly.
const TYPE_META = {
  ASSIGNMENT:    { label: 'Assignment',  icon: CalendarCheck2, tone: 'info'    },
  ATTENDANCE:    { label: 'Attendance',  icon: Bell,           tone: 'warning' },
  AI_SUGGESTION: { label: 'AI',          icon: Sparkles,       tone: 'brand'   },
  COLLABORATION: { label: 'Collab',      icon: Users,          tone: 'success' },
  SYSTEM:        { label: 'System',      icon: AlertTriangle,  tone: 'neutral' },
};

const FILTERS = [
  { id: 'All',           label: 'All',        match: () => true                       },
  { id: 'Unread',        label: 'Unread',     match: (n) => !!n.unread                },
  { id: 'ASSIGNMENT',    label: 'Assignments',match: (n) => n.type === 'ASSIGNMENT'   },
  { id: 'ATTENDANCE',    label: 'Attendance', match: (n) => n.type === 'ATTENDANCE'   },
  { id: 'AI_SUGGESTION', label: 'AI',         match: (n) => n.type === 'AI_SUGGESTION'},
  { id: 'COLLABORATION', label: 'Collab',     match: (n) => n.type === 'COLLABORATION'},
  { id: 'SYSTEM',        label: 'System',     match: (n) => n.type === 'SYSTEM'       },
];

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};

function bucketFor(ts, now) {
  const todayStart = startOfDay(now);
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  if (ts >= todayStart) return 'Today';
  if (ts >= yesterdayStart) return 'Yesterday';
  const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000;
  if (ts >= weekStart) return 'This week';
  return 'Earlier';
}

const BUCKET_ORDER = ['Today', 'Yesterday', 'This week', 'Earlier'];

function relativeTime(ts, now) {
  const diff = Math.max(0, now - ts);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function clockString(ts) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function TypeIcon({ type, className = 'h-4 w-4' }) {
  const meta = TYPE_META[type] || TYPE_META.SYSTEM;
  const Icon = meta.icon;
  return <Icon className={className} />;
}

function TypePill({ type }) {
  const meta = TYPE_META[type] || TYPE_META.SYSTEM;
  return <Badge tone={meta.tone} size="xs">{meta.label}</Badge>;
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(() => new Set());
  const [toast, setToast] = useState({ open: false, variant: 'info', message: '' });
  const [now, setNow] = useState(() => Date.now());

  // Same hook contract as before — no signature change, no new fetches.
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markRead,
    markAllRead,
    removeNotification,
  } = useNotifications({ page: 1, limit: 50 });

  // Tick a "now" timestamp once a minute so relative timestamps update
  // even when the user has the tab in the background for a while. We
  // deliberately don't re-render on every second; relative groups are
  // still derived from a stable `now` per render.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  // Clear the selection any time the underlying list mutates (delete,
  // mark read, new realtime notification) so we never hold a stale id.
  useEffect(() => {
    setSelected((prev) => {
      const live = new Set(safeNotifications.map((n) => n.id));
      const next = new Set();
      prev.forEach((id) => { if (live.has(id)) next.add(id); });
      return next;
    });
  }, [safeNotifications]);

  // Filter + search are independent: a search term narrows whatever the
  // active filter has produced, so users can "show me all unread about
  // attendance" in one go.
  const activeFilter = FILTERS.find((f) => f.id === filter) || FILTERS[0];
  const visible = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return safeNotifications.filter((n) => {
      if (!activeFilter.match(n)) return false;
      if (!trimmed) return true;
      return (
        (n.title || '').toLowerCase().includes(trimmed) ||
        (n.body  || '').toLowerCase().includes(trimmed) ||
        (n.type  || '').toLowerCase().includes(trimmed)
      );
    });
  }, [safeNotifications, activeFilter, query]);

  // Group by recency bucket. Empty groups are skipped automatically.
  const grouped = useMemo(() => {
    const groups = new Map();
    visible.forEach((n) => {
      const bucket = bucketFor(n.ts || 0, now);
      if (!groups.has(bucket)) groups.set(bucket, []);
      groups.get(bucket).push(n);
    });
    // Sort within each bucket by ts desc (newest first).
    groups.forEach((rows) => rows.sort((a, b) => (b.ts || 0) - (a.ts || 0)));
    return BUCKET_ORDER
      .filter((name) => groups.has(name))
      .map((name) => ({ name, items: groups.get(name) }));
  }, [visible, now]);

  // Per-type counts feed both the type-breakdown bar and the filter pills.
  const counts = useMemo(() => {
    const base = { All: safeNotifications.length, Unread: 0 };
    safeNotifications.forEach((n) => {
      if (n.unread) base.Unread += 1;
      const t = n.type || 'SYSTEM';
      base[t] = (base[t] || 0) + 1;
    });
    return base;
  }, [safeNotifications]);

  // Type breakdown (used by the side panel). Only shows types that
  // actually have at least one notification, so a fresh inbox doesn't
  // display five empty bars.
  const typeBreakdown = useMemo(() => {
    const types = ['ASSIGNMENT', 'ATTENDANCE', 'AI_SUGGESTION', 'COLLABORATION', 'SYSTEM'];
    return types
      .map((t) => ({ type: t, count: counts[t] || 0 }))
      .filter((row) => row.count > 0);
  }, [counts]);

  const total = safeNotifications.length;
  const pct = total > 0 ? Math.round(((total - unreadCount) / total) * 100) : 100;

  const showToast = (variant, message) => setToast({ open: true, variant, message });
  const onRowClick = async (n) => {
    if (!n.unread) return;
    try { await markRead(n.id); }
    catch (err) { showToast('error', err?.message || 'Could not mark as read.'); }
  };

  const toggleSelected = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());

  const bulkMarkRead = async () => {
    const ids = Array.from(selected);
    const unreadIds = ids.filter((id) => {
      const row = safeNotifications.find((n) => n.id === id);
      return row && row.unread;
    });
    if (unreadIds.length === 0) {
      clearSelection();
      showToast('info', 'Nothing to mark — selection is already read.');
      return;
    }
    try {
      await Promise.all(unreadIds.map((id) => markRead(id)));
      showToast('success', `Marked ${unreadIds.length} as read.`);
      clearSelection();
    } catch (err) {
      showToast('error', err?.message || 'Some items could not be updated.');
    }
  };

  const bulkDelete = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    try {
      await Promise.all(ids.map((id) => removeNotification(id)));
      showToast('success', `Deleted ${ids.length} notification${ids.length === 1 ? '' : 's'}.`);
      clearSelection();
    } catch (err) {
      showToast('error', err?.message || 'Some items could not be deleted.');
    }
  };

  // Selection-mode toolbar only appears when the user has ticked at
  // least one row — keeps the header visually quiet by default.
  const hasSelection = selected.size > 0;
  const selectAllVisible = (() => {
    if (visible.length === 0) return false;
    return visible.every((n) => selected.has(n.id));
  })();
  const toggleSelectAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (selectAllVisible) {
        visible.forEach((n) => next.delete(n.id));
      } else {
        visible.forEach((n) => next.add(n.id));
      }
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <Toast
        open={toast.open}
        variant={toast.variant}
        onClose={() => setToast((c) => ({ ...c, open: false }))}
        message={toast.message}
      />

      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        description="Real-time alerts from assignments, attendance, AI, and study rooms."
        actions={
          <div className="flex items-center gap-2">
            {unreadCount > 0 ? (
              <Badge tone="brand" dot>{unreadCount} unread</Badge>
            ) : (
              <Badge tone="success" dot>All caught up</Badge>
            )}
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<CheckCheck className="h-3.5 w-3.5" />}
              onClick={async () => {
                try {
                  await markAllRead();
                  showToast('success', 'All notifications marked as read.');
                } catch (err) {
                  showToast('error', err?.message || 'Could not mark all as read.');
                }
              }}
              disabled={unreadCount === 0}
            >
              Mark all read
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* ============================================================ */}
        {/* Main column: filter pills, search, timeline                    */}
        {/* ============================================================ */}
        <div className="space-y-4">
          {/* Filter pills + search */}
          <Card padding="sm">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {FILTERS.map((f) => {
                  const active = filter === f.id;
                  const count = counts[f.id] ?? 0;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilter(f.id)}
                      className={[
                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                        active
                          ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-50/20'
                          : 'border-border bg-background-subtle text-foreground-muted hover:text-foreground',
                      ].join(' ')}
                    >
                      {f.label}
                      <span className={[
                        'rounded-full px-1.5 text-2xs',
                        active ? 'bg-brand-500 text-white' : 'bg-background text-foreground-muted',
                      ].join(' ')}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="ml-auto flex items-center gap-2 rounded-lg border border-border bg-background-subtle px-2 py-1.5">
                <Search className="h-3.5 w-3.5 text-foreground-muted" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search title, body, type…"
                  className="w-44 bg-transparent text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="grid h-4 w-4 place-items-center rounded text-foreground-muted hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </button>
                ) : null}
              </div>
            </div>
          </Card>

          {/* Bulk-action toolbar (only when at least one is selected) */}
          <AnimatePresence>
            {hasSelection ? (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                <Card padding="sm" className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-foreground">
                    <span className="font-semibold">{selected.size}</span> selected
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    leadingIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                    onClick={bulkMarkRead}
                  >
                    Mark selected read
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    leadingIcon={<Trash2 className="h-3.5 w-3.5" />}
                    onClick={bulkDelete}
                    className="text-danger hover:bg-danger-soft"
                  >
                    Delete selected
                  </Button>
                  <Button size="sm" variant="ghost" onClick={clearSelection}>
                    Clear selection
                  </Button>
                </Card>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Loading skeleton — preserves the previous "five blocks" feel */}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} variant="block" className="h-20" />
              ))}
            </div>
          ) : error ? (
            <EmptyState
              icon={<Bell className="h-6 w-6" />}
              title="Notifications failed to load"
              description={error.message || 'Unable to fetch notifications.'}
              actionLabel="Retry"
              onAction={() => window.location.reload()}
            />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={<Inbox className="h-6 w-6" />}
              title={safeNotifications.length === 0 ? 'No notifications yet' : 'Nothing matches'}
              description={
                safeNotifications.length === 0
                  ? 'New alerts from assignments, attendance, AI, and study rooms will appear here in real time.'
                  : 'Try a different filter or clear the search.'
              }
              actionLabel={safeNotifications.length > 0 ? 'Clear filters' : undefined}
              onAction={safeNotifications.length > 0 ? () => { setFilter('All'); setQuery(''); } : undefined}
            />
          ) : (
            <div className="space-y-5">
              {/* Select-all row */}
              <div className="flex items-center justify-between text-xs text-foreground-muted">
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-border text-brand-500 focus:ring-brand-500"
                    checked={selectAllVisible}
                    onChange={toggleSelectAllVisible}
                  />
                  <span>Select all visible</span>
                </label>
                <span>{visible.length} item{visible.length === 1 ? '' : 's'}</span>
              </div>

              {grouped.map((group) => (
                <section key={group.name} className="space-y-2">
                  <div className="flex items-center gap-2 text-2xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">
                    <span>{group.name}</span>
                    <span className="rounded-full bg-background-subtle px-1.5 py-0.5 text-2xs text-foreground-muted">
                      {group.items.length}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  <ul className="space-y-2">
                    <AnimatePresence initial={false}>
                      {group.items.map((n) => {
                        const isSelected = selected.has(n.id);
                        const rowClass = [
                          'group relative flex items-start gap-3 rounded-2xl border p-4 transition-colors',
                          n.unread
                            ? 'border-l-2 border-l-brand-500 border-border bg-surface'
                            : 'border-border bg-[rgba(255,255,255,0.03)]',
                          isSelected ? 'ring-2 ring-brand-500/50' : '',
                        ].join(' ');
                        return (
                          <motion.li
                            key={n.id}
                            layout
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.18 }}
                          >
                            <div
                              className={rowClass}
                              role="button"
                              tabIndex={0}
                              onClick={() => onRowClick(n)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  onRowClick(n);
                                }
                              }}
                            >
                              <label
                                className="mt-0.5 inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-border text-brand-500 focus:ring-brand-500"
                                  checked={isSelected}
                                  onChange={() => toggleSelected(n.id)}
                                />
                              </label>

                              <div
                                className={[
                                  'mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl',
                                  n.unread ? 'bg-brand-50 text-brand-600 dark:bg-brand-50/20' : 'bg-background-subtle text-foreground-muted',
                                ].join(' ')}
                              >
                                <TypeIcon type={n.type} className="h-4 w-4" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={[
                                      'truncate text-sm font-semibold',
                                      n.unread ? 'text-foreground' : 'text-foreground-muted',
                                    ].join(' ')}
                                    title={n.title}
                                  >
                                    {n.title}
                                  </span>
                                  <TypePill type={n.type} />
                                  {n.unread ? (
                                    <Badge tone="brand" size="xs">New</Badge>
                                  ) : (
                                    <Badge size="xs">Read</Badge>
                                  )}
                                </div>
                                {n.body ? (
                                  <p className="mt-1 text-sm text-foreground-muted">{n.body}</p>
                                ) : null}
                                <div
                                  className="mt-1 text-2xs uppercase tracking-[0.12em] text-foreground-subtle"
                                  title={clockString(n.ts)}
                                >
                                  {relativeTime(n.ts, now)}
                                </div>
                              </div>

                              <div className="flex shrink-0 items-center gap-1.5">
                                {n.unread ? (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      try {
                                        await markRead(n.id);
                                        showToast('success', 'Marked as read.');
                                      } catch (err) {
                                        showToast('error', err?.message || 'Could not mark as read.');
                                      }
                                    }}
                                  >
                                    Mark read
                                  </Button>
                                ) : null}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  leadingIcon={<Trash2 className="h-3.5 w-3.5" />}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      await removeNotification(n.id);
                                      showToast('success', 'Notification deleted.');
                                    } catch (err) {
                                      showToast('error', err?.message || 'Could not delete.');
                                    }
                                  }}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </motion.li>
                        );
                      })}
                    </AnimatePresence>
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* Side panel: stats + type breakdown + realtime status           */}
        {/* ============================================================ */}
        <aside className="space-y-4">
          <Card padding="md">
            <div className="text-2xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">
              Inbox health
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="font-display text-3xl font-semibold text-foreground">{pct}%</div>
              <div className="text-xs text-foreground-muted">read</div>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background">
              <div
                className="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-border bg-background-subtle px-3 py-2">
                <div className="text-foreground-muted">Unread</div>
                <div className="mt-0.5 text-lg font-semibold text-foreground">{unreadCount}</div>
              </div>
              <div className="rounded-lg border border-border bg-background-subtle px-3 py-2">
                <div className="text-foreground-muted">Total</div>
                <div className="mt-0.5 text-lg font-semibold text-foreground">{total}</div>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="text-2xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">
              By type
            </div>
            {typeBreakdown.length === 0 ? (
              <div className="mt-3 text-sm text-foreground-muted">No notifications yet.</div>
            ) : (
              <div className="mt-3 space-y-2">
                {typeBreakdown.map((row) => {
                  const meta = TYPE_META[row.type] || TYPE_META.SYSTEM;
                  const Icon = meta.icon;
                  const widthPct = Math.round((row.count / Math.max(total, 1)) * 100);
                  return (
                    <button
                      key={row.type}
                      type="button"
                      onClick={() => setFilter(row.type)}
                      className="block w-full text-left"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1.5 text-foreground-muted">
                          <Icon className="h-3.5 w-3.5" />
                          {meta.label}
                        </span>
                        <span className="font-semibold text-foreground">{row.count}</span>
                      </div>
                      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-background">
                        <div
                          className={[
                            'h-full rounded-full transition-[width] duration-500',
                            meta.tone === 'brand'   ? 'bg-brand-500' :
                            meta.tone === 'success' ? 'bg-success' :
                            meta.tone === 'warning' ? 'bg-warning' :
                            meta.tone === 'danger'  ? 'bg-danger'  :
                            meta.tone === 'info'    ? 'bg-info'    : 'bg-foreground-muted',
                          ].join(' ')}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          <Card padding="md">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-success-soft text-success">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Realtime is on</div>
                <p className="mt-1 text-xs text-foreground-muted">
                  New alerts from the backend appear at the top of the list automatically.
                </p>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
