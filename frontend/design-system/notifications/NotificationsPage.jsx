import React, { useMemo, useState } from 'react';
import { CheckCheck, Trash2, Bell, Inbox } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardEyebrow,
  EmptyState,
  Select,
  Skeleton,
  Toast,
} from '../components';
import { useNotifications } from '../src/hooks/useNotifications';

/**
 * NotificationsPage — alert inbox.
 *
 * Design decisions:
 *   • Filter is a real <Select> (mobile-friendly) plus a row of clickable
 *     pills (desktop-friendly) — both stay in sync.
 *   • Each notification is a Card with a leading icon, title, body, and
 *     timestamp. Unread notifications have a brand left-border.
 *   • Empty state uses the new EmptyState with a contextual icon.
 */
const FILTERS = [
  { id: 'All',          label: 'All' },
  { id: 'Unread',       label: 'Unread' },
  { id: 'ASSIGNMENT',   label: 'Assignments' },
  { id: 'ATTENDANCE',   label: 'Attendance' },
  { id: 'AI_SUGGESTION',label: 'AI' },
  { id: 'COLLABORATION',label: 'Collab' },
  { id: 'SYSTEM',       label: 'System' },
];

export default function NotificationsPage() {
  const [filter, setFilter] = useState('All');
  const { notifications, unreadCount, isLoading, error, markRead, markAllRead, removeNotification } = useNotifications({ page: 1, limit: 50 });
  const [toast, setToast] = useState({ open: false, variant: 'info', message: '' });

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === 'All') return true;
      if (filter === 'Unread') return n.unread;
      return n.type === filter;
    });
  }, [notifications, filter]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton variant="line" width="30%" height={28} />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="block" className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<Bell className="h-6 w-6" />}
        title="Notifications failed to load"
        description={error.message || 'Unable to fetch notifications.'}
        actionLabel="Retry"
        onAction={() => window.location.reload()}
      />
    );
  }

  const showToast = (variant, message) => setToast({ open: true, variant, message });

  return (
    <div className="space-y-5">
      <Toast
        open={toast.open}
        variant={toast.variant}
        onClose={() => setToast((c) => ({ ...c, open: false }))}
        message={toast.message}
      />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <CardEyebrow>Inbox</CardEyebrow>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-foreground">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Real-time alerts from assignments, attendance, AI, and rooms.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-44">
            {FILTERS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </Select>
          <Button
            variant="secondary"
            leadingIcon={<CheckCheck className="h-4 w-4" />}
            onClick={async () => {
              await markAllRead();
              showToast('success', 'All notifications marked as read.');
            }}
          >
            Mark all read
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="brand" dot={unreadCount > 0}>{unreadCount} unread</Badge>
        <Badge>{notifications.length} total</Badge>
        {filter !== 'All' ? <Badge tone="info">Filtered: {filter}</Badge> : null}
      </div>

      <ul className="space-y-2">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-6 w-6" />}
            title="No notifications"
            description="Everything is quiet right now."
          />
        ) : (
          filtered.map((n) => (
            <li key={n.id}>
              <Card
                padding="md"
                className={[
                  'relative',
                  n.unread ? 'border-l-2 border-l-brand-500' : '',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{n.title}</span>
                      {n.unread ? <Badge tone="brand" size="xs">New</Badge> : <Badge size="xs">Read</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-foreground-muted">{n.body}</p>
                    <div className="mt-1 text-2xs uppercase tracking-[0.12em] text-foreground-subtle">
                      {new Date(n.ts).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {n.unread ? (
                      <Button
                        size="sm" variant="secondary"
                        onClick={async () => { await markRead(n.id); showToast('success', 'Marked as read.'); }}
                      >
                        Mark read
                      </Button>
                    ) : null}
                    <Button
                      size="sm" variant="ghost"
                      leadingIcon={<Trash2 className="h-3.5 w-3.5" />}
                      onClick={async () => { await removeNotification(n.id); showToast('success', 'Notification deleted.'); }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
