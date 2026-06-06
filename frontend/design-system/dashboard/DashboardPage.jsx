import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Flame,
  GraduationCap,
  ListTodo,
  Plus,
  RefreshCcw,
  Save,
  Sparkles,
  Target,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardEyebrow,
  CardTitle,
  EmptyState,
  Input,
  Skeleton,
  Toast,
} from '../components';
import { useDashboard } from '../src/hooks/useDashboard';
import { useNotes } from '../src/hooks/useNotes';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

/* ----------------------------------------------------------------------------
   DashboardPage — premium productivity command center.
   --------------------------------------------------------------------------
   Sections (top → bottom on desktop, stacked on mobile):
     1. Welcome hero               (greeting + date + quick actions)
     2. KPI strip                  (4 cards: completion, attendance, pending, streak)
     3. Two-column main row:
        a) Weekly study trend chart
        b) Upcoming deadlines list
     4. Three-column row:
        a) Subject-wise attendance
        b) Study streak + activity heatmap
        c) Quick notes
     5. Two-column row:
        a) Recent assignments
        b) Latest notifications
   Design notes:
     • All "cards" use the new <Card> primitive. No more `className="p-5"`
       drift — padding is centralized.
     • Every section has an eyebrow + title + optional action link. This
       is the rhythm users see across SaaS dashboards and it dramatically
       improves scannability.
     • Charts use a brand-color gradient with a soft fill — readable on
       both light and dark backgrounds.
     • Empty states use <EmptyState> with a clear primary action so the
       user is never stuck on a dead-end.
---------------------------------------------------------------------------- */

const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const greetingFor = (hour) => {
  if (hour < 5)  return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  }),
};

function MetricCard({ icon: Icon, label, value, subtitle, accent = 'brand', delay = 0 }) {
  const tone = {
    brand:   'bg-brand-50 text-brand-600',
    success: 'bg-success-soft text-success-fg',
    warning: 'bg-warning-soft text-warning-fg',
    danger:  'bg-danger-soft text-danger-fg',
  }[accent] || 'bg-brand-50 text-brand-600';
  return (
    <motion.div custom={delay} initial="hidden" animate="visible" variants={fadeUp}>
      <Card padding="md" className="h-full">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-2xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">
              {label}
            </div>
            <div className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground">
              {value}
            </div>
            {subtitle ? <div className="mt-1 text-sm text-foreground-muted">{subtitle}</div> : null}
          </div>
          <div className={['grid h-10 w-10 shrink-0 place-items-center rounded-xl', tone].join(' ')}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

const DashboardPage = () => {
  const { overview, assignments, notifications, isLoading, error, refetch } = useDashboard();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [toast, setToast] = useState({ open: false, variant: 'info', message: '' });
  const showToast = (variant, message) => setToast({ open: true, variant, message });
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Loading skeleton — matches the final layout's vertical rhythm
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton variant="line" width="40%" height={32} />
          <Skeleton variant="line" width="60%" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="block" height={112} />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton variant="block" height={320} className="lg:col-span-2" />
          <Skeleton variant="block" height={320} />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="block" height={260} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<Zap className="h-6 w-6" />}
        title="Dashboard failed to load"
        description={error.message || 'Unable to fetch dashboard data.'}
        actionLabel="Retry"
        onAction={refetch}
      />
    );
  }

  // Pull data points defensively so a missing field doesn't blow up the page
  const completion = overview?.assignmentCompletionRate ?? 0;
  const attendance = overview?.attendancePct ?? 0;
  const pending    = overview?.pendingAssignments ?? 0;
  const streak     = overview?.studyStreak ?? 0;
  const todayLabel = now.toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <div className="space-y-8">
      <Toast
        open={toast.open}
        variant={toast.variant}
        onClose={() => setToast((c) => ({ ...c, open: false }))}
        message={toast.message}
      />
      <div className="space-y-8">
        {/* ───────── 1. Welcome hero ───────── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <div className="text-2xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">
              {todayLabel}
            </div>
            <h1 className="mt-1 font-display text-3xl font-semibold text-foreground sm:text-4xl">
              {greetingFor(now.getHours())},{' '}
              <span className="text-foreground">
                {overview?.user?.firstName || 'Student'}
              </span>
            </h1>
            <p className="mt-1.5 text-sm text-foreground-muted">
              You have <span className="font-semibold text-foreground">{pending} pending</span> assignments and
              a <span className="font-semibold text-foreground">{streak}-day streak</span>. Keep the momentum.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              leadingIcon={<RefreshCcw className="h-4 w-4" />}
              onClick={() => { refetch(); showToast('success', 'Dashboard refreshed.'); }}
            >
              Refresh
            </Button>
            <Button
              leadingIcon={<Plus className="h-4 w-4" />}
              onClick={() => navigate('/assignments')}
            >
              New assignment
            </Button>
          </div>
        </motion.div>

        {/* ───────── 2. KPI strip ───────── */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Sparkles}     label="Completion" value={`${completion}%`} subtitle="Assignment completion" accent="brand"   delay={0} />
          <MetricCard icon={Target}       label="Attendance" value={`${attendance}%`} subtitle="Current semester"      accent="success" delay={1} />
          <MetricCard icon={ListTodo}     label="Pending"    value={pending}         subtitle="Tasks waiting on you"   accent="warning" delay={2} />
          <MetricCard icon={Flame}        label="Streak"     value={`${streak}d`}    subtitle="Consecutive active days" accent="danger"  delay={3} />
        </div>

        {/* ───────── 3. Trend + Deadlines ───────── */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card padding="md" className="lg:col-span-2">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <CardEyebrow>This week</CardEyebrow>
                <CardTitle>Study hours trend</CardTitle>
                <p className="mt-1 text-sm text-foreground-muted">
                  You studied <span className="font-semibold text-foreground">14.5 hrs</span> in the last 7 days.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="success" dot>On track</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  trailingIcon={<ArrowUpRight className="h-3.5 w-3.5" />}
                  onClick={() => navigate('/analytics')}
                >
                  Details
                </Button>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={studyTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="studyFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="hsl(238 78% 60%)" stopOpacity={0.32} />
                      <stop offset="100%" stopColor="hsl(238 78% 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" stroke="hsl(var(--fg-subtle))" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis stroke="hsl(var(--fg-subtle))" tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--surface))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 12,
                      boxShadow: '0 12px 24px -6px rgba(15,23,42,0.12)',
                    }}
                    cursor={{ stroke: 'hsl(var(--brand-300))', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="hrs"
                    stroke="hsl(238 78% 60%)"
                    strokeWidth={2.5}
                    fill="url(#studyFill)"
                    dot={{ r: 3, fill: 'hsl(238 78% 60%)', strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card padding="md">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <CardEyebrow>Don't miss</CardEyebrow>
                <CardTitle>Upcoming deadlines</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                trailingIcon={<ChevronRight className="h-3.5 w-3.5" />}
                onClick={() => navigate('/assignments')}
              >
                View all
              </Button>
            </div>
            <ul className="space-y-2.5">
              {deadlines.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 className="h-6 w-6" />}
                  title="All clear"
                  description="Nothing due in the next 5 days."
                />
              ) : (
                deadlines.map((d) => {
                  const tone = d.days < 2 ? 'danger' : d.days < 4 ? 'warning' : 'brand';
                  return (
                    <li
                      key={d.title}
                      className="group flex items-center gap-3 rounded-xl border border-border-subtle bg-background-subtle/50 p-3 transition-colors hover:border-border"
                    >
                      <div className={[
                        'grid h-10 w-10 shrink-0 place-items-center rounded-lg font-display text-md font-semibold',
                        tone === 'danger'  && 'bg-danger-soft text-danger-fg',
                        tone === 'warning' && 'bg-warning-soft text-warning-fg',
                        tone === 'brand'   && 'bg-brand-50 text-brand-700',
                      ].filter(Boolean).join(' ')}
                      >
                        {d.days}d
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-foreground">{d.title}</div>
                        <div className="truncate text-xs text-foreground-muted">{d.subject}</div>
                      </div>
                      <Badge tone={tone} size="xs">
                        {d.days < 1 ? 'Today' : d.days === 1 ? 'Tomorrow' : `In ${d.days}d`}
                      </Badge>
                    </li>
                  );
                })
              )}
            </ul>
          </Card>
        </div>

        {/* ───────── 4. Attendance / Streak / Notes ───────── */}
        <div className="grid gap-6 lg:grid-cols-3">
          <AttendanceWidget />
          <StreakWidget streak={streak} />
          <NotesWidget onToast={showToast} />
        </div>

        {/* ───────── 5. Assignments + Notifications ───────── */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card padding="md" className="lg:col-span-2">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <CardEyebrow>Coursework</CardEyebrow>
                <CardTitle>Recent assignments</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{assignments.length} active</Badge>
                <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/assignments')}
              >
                Open board
              </Button>
              </div>
            </div>
            {assignments.length === 0 ? (
              <EmptyState
                icon={<ListTodo className="h-6 w-6" />}
                title="No assignments yet"
                description="Create your first assignment to start tracking."
                actionLabel="New assignment"
                onAction={() => navigate('/assignments')}
              />
            ) : (
              <ul className="divide-y divide-border-subtle">
                {assignments.slice(0, 6).map((a) => (
                  <li
                    key={a.id}
                    className="group flex items-center gap-4 py-3 transition-colors first:pt-0 last:pb-0"
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-foreground">{a.title}</div>
                      <div className="truncate text-xs text-foreground-muted">
                        {a.subject} · Due {fmtDate(a.dueDate)}
                      </div>
                    </div>
                    <Badge
                      tone={
                        a.status === 'completed' || a.status === 'SUBMITTED'
                          ? 'success'
                          : a.status === 'overdue' || a.status === 'OVERDUE'
                          ? 'danger'
                          : a.status === 'review' || a.status === 'REVIEW'
                          ? 'info'
                          : 'warning'
                      }
                      size="xs"
                    >
                      {a.status}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-foreground-subtle opacity-0 transition-opacity group-hover:opacity-100" />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <CardEyebrow>Inbox</CardEyebrow>
                <CardTitle>Latest notifications</CardTitle>
              </div>
              <Badge tone="brand">{notifications.length}</Badge>
            </div>
            {notifications.length === 0 ? (
              <EmptyState
                icon={<Bell className="h-6 w-6" />}
                title="You're all caught up"
                description="No new notifications right now."
              />
            ) : (
              <ul className="space-y-2.5">
                {notifications.slice(0, 5).map((n) => (
                  <li
                    key={n.id}
                    className="flex gap-3 rounded-xl border border-border-subtle bg-background-subtle/40 p-3"
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-info-soft text-info-fg">
                      <Bell className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="truncate text-sm font-semibold text-foreground">{n.title}</div>
                        {n.unread ? <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> : null}
                      </div>
                      <div className="mt-0.5 line-clamp-2 text-xs text-foreground-muted">{n.body}</div>
                      <div className="mt-1 text-2xs uppercase tracking-[0.12em] text-foreground-subtle">
                        {new Date(n.ts).toLocaleString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* ───────── 6. AI suggestions ───────── */}
        <Card variant="elevated" padding="lg" className="overflow-hidden">
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-md bg-foreground text-background">
                  <Sparkles className="h-4 w-4" />
                </div>
                <CardEyebrow>SYNC AI</CardEyebrow>
              </div>
              <h3 className="mt-2 font-display text-xl font-semibold tracking-tight text-foreground">
                Practical nudges based on your workload
              </h3>
              <p className="mt-1 max-w-xl text-sm text-foreground-muted">
                We noticed your OS attendance is below 75% and you have two big assignments due this week. Want a 30-minute revision plan?
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                leadingIcon={<TrendingUp className="h-4 w-4" />}
                onClick={() => navigate('/ai')}
              >
                Plan my week
              </Button>
              <Button
                leadingIcon={<GraduationCap className="h-4 w-4" />}
                onClick={() => navigate('/ai')}
              >
                Open AI assistant
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

/* ----------------------------------------------------------------------------
   Local widgets (kept inline for the dashboard; can be promoted to /components
   later if reused elsewhere).
---------------------------------------------------------------------------- */

function AttendanceWidget() {
  const attendance = 78;
  const subjects = [
    { name: 'Operating Systems',   value: 92 },
    { name: 'DBMS',                value: 81 },
    { name: 'Computer Networks',   value: 67 },
    { name: 'Mathematics',         value: 59 },
  ];
  const C = 2 * Math.PI * 46;
  const dash = C - (attendance / 100) * C;
  return (
    <Card padding="md" className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <CardEyebrow>This semester</CardEyebrow>
          <CardTitle>Attendance</CardTitle>
        </div>
        <Badge tone="success" dot>On track</Badge>
      </div>
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <div className="grid h-32 w-32 shrink-0 place-items-center">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="46" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="46" fill="none"
              stroke="hsl(var(--success))" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={dash}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute -mt-0 text-center">
            <div className="font-display text-2xl font-semibold tracking-tight">{attendance}%</div>
            <div className="text-2xs font-semibold uppercase tracking-[0.12em] text-foreground-subtle">Overall</div>
          </div>
        </div>
        <ul className="w-full flex-1 space-y-2.5">
          {subjects.map((s) => {
            const tone = s.value >= 75 ? 'success' : s.value >= 65 ? 'warning' : 'danger';
            const color = tone === 'success' ? 'bg-success' : tone === 'warning' ? 'bg-warning' : 'bg-danger';
            return (
              <li key={s.name}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{s.name}</span>
                  <span className="font-mono text-foreground-muted">{s.value}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-background-muted">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${s.value}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className={['h-full rounded-full', color].join(' ')}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}

function StreakWidget({ streak }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf, start;
    const dur = 700;
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      setDisplay(Math.floor(p * streak));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [streak]);

  return (
    <Card padding="md" className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <CardEyebrow>Consistency</CardEyebrow>
          <CardTitle>Study streak</CardTitle>
        </div>
        <Badge tone="warning" leftIcon={<Flame className="h-3 w-3" />}>
          {streak} days
        </Badge>
      </div>
      <div className="flex items-end gap-2">
        <div className="font-display text-5xl font-semibold leading-none tracking-tight text-foreground">
          {display}
        </div>
        <div className="pb-1.5 text-sm text-foreground-muted">days in a row</div>
      </div>
      <div className="mt-5">
        <div className="mb-2 text-2xs font-semibold uppercase tracking-[0.12em] text-foreground-subtle">
          Last 28 days
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {calendar.map((v, i) => (
            <div
              key={i}
              className={[
                'aspect-square rounded-md border border-border-subtle',
                v === 0 && 'bg-background-muted',
                v === 1 && 'bg-success/30',
                v === 2 && 'bg-success/55',
                v === 3 && 'bg-success/85',
              ].filter(Boolean).join(' ')}
              title={`${v} hr`}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

function NotesWidget({ onToast }) {
  // Use the same hook the Notes page uses. We fetch just the first page
  // (the default limit=20) — the widget only shows 4 rows so we don't
  // need pagination here.
  const { notes, isLoading, createNote } = useNotes();
  const navigate = useNavigate();
  const [composing, setComposing] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [saving, setSaving] = useState(false);

  const openCompose = () => {
    setDraftTitle('');
    setDraftContent('');
    setComposing(true);
  };
  const cancelCompose = () => {
    if (saving) return;
    setComposing(false);
    setDraftTitle('');
    setDraftContent('');
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    const title = draftTitle.trim() || 'Untitled';
    const content = draftContent.trim();
    if (!content) return;
    setSaving(true);
    try {
      await createNote({ title, content });
      onToast?.('success', 'Note saved.');
      setComposing(false);
      setDraftTitle('');
      setDraftContent('');
    } catch (err) {
      onToast?.('error', err?.message || 'Failed to save note.');
    } finally {
      setSaving(false);
    }
  };

  const recent = (notes || []).slice(0, 4);

  return (
    <Card padding="md" className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <CardEyebrow>Capture</CardEyebrow>
          <CardTitle>Quick notes</CardTitle>
        </div>
        {composing ? (
          <Button
            size="sm"
            variant="ghost"
            leadingIcon={<X className="h-3.5 w-3.5" />}
            onClick={cancelCompose}
            disabled={saving}
          >
            Cancel
          </Button>
        ) : (
          <Button
            size="sm"
            leadingIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={openCompose}
          >
            New note
          </Button>
        )}
      </div>

      {composing ? (
        <form onSubmit={handleSave} className="space-y-2">
          <Input
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            placeholder="Title (optional)"
            maxLength={120}
            autoFocus
          />
          <textarea
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={4}
            className="w-full resize-y rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground-subtle transition-all duration-150 focus:border-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/10"
          />
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={cancelCompose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              leadingIcon={<Save className="h-3.5 w-3.5" />}
              isLoading={saving}
              disabled={!draftContent.trim()}
            >
              Save
            </Button>
          </div>
        </form>
      ) : isLoading ? (
        <div className="space-y-2">
          <Skeleton variant="block" className="h-14" />
          <Skeleton variant="block" className="h-14" />
          <Skeleton variant="block" className="h-14" />
        </div>
      ) : recent.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="No notes yet"
          description="Capture a thought before it's gone."
          actionLabel="New note"
          onAction={openCompose}
        />
      ) : (
        <ul className="space-y-2">
          {recent.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => navigate('/notes')}
                className="block w-full rounded-xl border border-border-subtle bg-background-subtle/40 p-3 text-left transition-colors hover:border-border hover:bg-background-subtle/70"
              >
                <div className="line-clamp-1 text-sm font-semibold text-foreground">
                  {n.title || 'Untitled'}
                </div>
                <div className="mt-0.5 line-clamp-2 text-xs text-foreground-muted">
                  {n.content || 'No content'}
                </div>
                <div className="mt-1 text-2xs uppercase tracking-[0.12em] text-foreground-subtle">
                  {n.updatedAt ? new Date(n.updatedAt).toLocaleDateString() : ''}
                </div>
              </button>
            </li>
          ))}
          {notes.length > 4 ? (
            <li>
              <button
                type="button"
                onClick={() => navigate('/notes')}
                className="block w-full rounded-xl border border-dashed border-border-subtle px-3 py-2 text-center text-xs text-foreground-muted transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                + {notes.length - 4} more — open Notes
              </button>
            </li>
          ) : null}
        </ul>
      )}
    </Card>
  );
}

/* ----------------------------------------------------------------------------
   Safe stub data — replaced by real API in useDashboard / useAssignments
---------------------------------------------------------------------------- */

const studyTrend = [
  { day: 'Mon', hrs: 1.0 },
  { day: 'Tue', hrs: 2.2 },
  { day: 'Wed', hrs: 1.5 },
  { day: 'Thu', hrs: 2.5 },
  { day: 'Fri', hrs: 3.1 },
  { day: 'Sat', hrs: 4.0 },
  { day: 'Sun', hrs: 0.5 },
];

const deadlines = [
  { title: 'OS Process Scheduler Report', subject: 'Operating Systems', days: 1 },
  { title: 'DBMS ER Diagram',             subject: 'DBMS',              days: 2 },
  { title: 'CN Lab Submission',           subject: 'Computer Networks', days: 4 },
  { title: 'Maths Tutorial 6',            subject: 'Mathematics',       days: 5 },
];

// pseudo-random heatmap values 0–3
const calendar = Array.from({ length: 28 }, (_, i) => {
  const x = Math.sin(i * 1.7) + Math.cos(i * 0.6) + 2;
  return Math.max(0, Math.min(3, Math.round(x)));
});

export default DashboardPage;
