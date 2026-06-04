import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Search, LayoutGrid, List, Calendar as CalendarIcon, X, KanbanSquare } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardEyebrow,
  EmptyState,
  Input,
  Select,
  Skeleton,
  Toast,
} from '../components';
import AssignmentCard from './AssignmentCard';
import AddAssignmentModal from './AddAssignmentModal';
import AssignmentDetailModal from './AssignmentDetailModal';
import { useAssignments } from '../src/hooks/useAssignments';

/**
 * AssignmentsPage — kanban-first coursework view.
 *
 * Design decisions:
 *   • Page sits inside AppShell (provided by ProtectedRoute). The old
 *     version had a giant custom `<div>` wrapper and skipped the shell.
 *   • Header is two rows: title + subtitle on the left, view toggle and
 *     "Add assignment" CTA on the right. CTAs follow the new Button API
 *     (`leadingIcon` / `trailingIcon`) — no more inline flex+gap.
 *   • View toggle uses a segmented control (soft inner background, brand
 *     highlight on the active option). Icons are real Lucide components.
 *   • Filter bar is a single Card with a horizontal layout. The "X Clear"
 *     button only appears when at least one filter is active.
 *   • Each kanban column is a Card with a colored top accent matching the
 *     column's status tone.
 */

const COLUMNS = [
  { key: 'todo',       title: 'To Do',       tone: 'info' },
  { key: 'inprogress', title: 'In Progress', tone: 'warning' },
  { key: 'review',     title: 'Review',      tone: 'brand' },
  { key: 'submitted',  title: 'Submitted',   tone: 'success' },
];

const VIEW_OPTIONS = [
  { key: 'kanban',  label: 'Kanban',  icon: KanbanSquare },
  { key: 'list',    label: 'List',    icon: List },
  { key: 'calendar',label: 'Calendar',icon: CalendarIcon },
];

export default function AssignmentsPage() {
  const { assignments, isLoading, error, createAssignment, updateStatus } = useAssignments({
    page: 1, limit: 100,
  });
  const [view, setView] = useState('kanban');
  const [isAddOpen, setAddOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [toast, setToast] = useState({ open: false, variant: 'info', message: '' });

  const [subjectFilter, setSubjectFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const subjectOptions = useMemo(
    () => ['All', ...new Set(assignments.map((a) => a.subject))],
    [assignments],
  );

  const filtered = useMemo(
    () => assignments.filter((item) => {
      if (subjectFilter !== 'All' && item.subject !== subjectFilter) return false;
      if (priorityFilter !== 'All' && item.priority !== priorityFilter) return false;
      if (fromDate && new Date(item.dueDate) < new Date(fromDate)) return false;
      if (toDate && new Date(item.dueDate) > new Date(`${toDate}T23:59:59`)) return false;
      return true;
    }),
    [assignments, subjectFilter, priorityFilter, fromDate, toDate],
  );

  const showToast = (variant, message) => setToast({ open: true, variant, message });

  const handleCreate = async (values) => {
    try {
      await createAssignment({
        title: values.title,
        description: values.description,
        priority: values.priority?.toUpperCase(),
        due_date: values.dueDate ? new Date(values.dueDate).toISOString() : new Date().toISOString(),
        status: 'TODO',
      });
      showToast('success', 'Assignment created.');
      setAddOpen(false);
    } catch (err) {
      showToast('error', err.message || 'Unable to create assignment.');
    }
  };

  const handleUpdateStatus = async (item) => {
    try {
      await updateStatus({ id: item.id, status: item.status.toUpperCase() });
      showToast('success', 'Status updated.');
    } catch (err) {
      showToast('error', err.message || 'Unable to update status.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton variant="line" width="30%" height={32} />
        <Skeleton variant="block" className="h-16" />
        <div className="grid gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="block" className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        title="Assignments failed to load"
        description={error.message}
        actionLabel="Retry"
        onAction={() => window.location.reload()}
      />
    );
  }

  const filtersActive = subjectFilter !== 'All' || priorityFilter !== 'All' || fromDate || toDate;

  return (
    <div className="space-y-5">
      <Toast
        open={toast.open}
        variant={toast.variant}
        onClose={() => setToast((c) => ({ ...c, open: false }))}
        message={toast.message}
      />

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <CardEyebrow>Coursework</CardEyebrow>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-foreground">
            Assignments
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Manage coursework with live backend data.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented view toggle */}
          <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-background-subtle p-1">
            {VIEW_OPTIONS.map((opt) => {
              const active = view === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setView(opt.key)}
                  className={[
                    'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all',
                    active
                      ? 'bg-surface text-foreground shadow-xs'
                      : 'text-foreground-muted hover:text-foreground',
                  ].join(' ')}
                >
                  <opt.icon className="h-3.5 w-3.5" />
                  {opt.label}
                </button>
              );
            })}
          </div>
          <Button leadingIcon={<Plus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>
            Add assignment
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="w-40"
          >
            {subjectOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-36"
          >
            {['All', 'High', 'Medium', 'Low'].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40" />
          <Input type="date" value={toDate}   onChange={(e) => setToDate(e.target.value)}   className="w-40" />
          {filtersActive ? (
            <Button
              variant="ghost"
              size="sm"
              leadingIcon={<X className="h-3.5 w-3.5" />}
              onClick={() => {
                setSubjectFilter('All');
                setPriorityFilter('All');
                setFromDate('');
                setToDate('');
              }}
            >
              Clear
            </Button>
          ) : null}
          <span className="ml-auto font-mono text-2xs text-foreground-subtle">
            {filtered.length} assignment{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </Card>

      {/* Kanban */}
      {view === 'kanban' ? (
        <div className="grid gap-4 lg:grid-cols-4">
          {COLUMNS.map((col) => {
            const items = filtered.filter((item) => item.status === col.key);
            return (
              <Card key={col.key} padding="none" className="flex flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full bg-${col.tone === 'brand' ? 'brand-500' : col.tone}`} />
                    <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
                  </div>
                  <Badge tone={col.tone} size="xs">
                    {items.length}
                  </Badge>
                </div>
                <div className="max-h-[60vh] min-h-[20rem] space-y-2 overflow-y-auto scrollbar-subtle p-2">
                  {items.length === 0 ? (
                    <div className="grid h-full place-items-center py-8 text-center text-sm text-foreground-subtle">
                      No assignments here
                    </div>
                  ) : (
                    <AnimatePresence>
                      {items.map((item) => (
                        <AssignmentCard
                          key={item.id}
                          item={item}
                          onOpen={setDetailItem}
                          onMove={(card, direction) =>
                            handleUpdateStatus({
                              ...card,
                              status: direction === 'next'
                                ? ({ todo: 'inprogress', inprogress: 'review', review: 'submitted' }[card.status] || card.status)
                                : ({ submitted: 'review', review: 'inprogress', inprogress: 'todo' }[card.status] || card.status),
                            })
                          }
                        />
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card padding="lg">
          <EmptyState
            icon={<LayoutGrid className="h-6 w-6" />}
            title={`${view[0].toUpperCase() + view.slice(1)} view coming soon`}
            description="Kanban is currently wired to live backend data."
            actionLabel="Switch to Kanban"
            onAction={() => setView('kanban')}
          />
        </Card>
      )}

      <AddAssignmentModal
        isOpen={isAddOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleCreate}
        subjects={subjectOptions.filter((s) => s !== 'All')}
      />
      <AssignmentDetailModal
        isOpen={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        item={detailItem}
        onSaveStatus={handleUpdateStatus}
      />
    </div>
  );
}
