import React, { useEffect, useState } from 'react';
import { Calendar, Clock, TrendingUp, CheckCircle2, Save } from 'lucide-react';
import { Modal, Input, Button, Badge, Card, CardEyebrow } from '../components';

const STATUSES = [
  { key: 'todo',       label: 'To Do',       tone: 'info' },
  { key: 'inprogress', label: 'In Progress', tone: 'warning' },
  { key: 'review',     label: 'Review',      tone: 'brand' },
  { key: 'submitted',  label: 'Submitted',   tone: 'success' },
];

function daysLeft(dueDate) {
  if (!dueDate) return 0;
  return Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
}

const priorityTone = { High: 'danger', Medium: 'warning', Low: 'success' };

export default function AssignmentDetailModal({ isOpen, onClose, item, onSaveStatus }) {
  const [status, setStatus] = useState('todo');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setStatus(item?.status || 'todo');
    setNotes('');
  }, [item]);

  if (!item) return null;
  const days = daysLeft(item.dueDate);
  const overdue = days < 0;
  const dueTone = overdue ? 'danger' : days < 2 ? 'warning' : 'success';

  const handleSubmit = (e) => {
    e?.preventDefault();
    onSaveStatus({ ...item, status, notes });
    onClose();
  };

  const handleMarkSubmitted = () => {
    onSaveStatus({ ...item, status: 'submitted', notes });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={item.title}
      description={
        <div className="mt-1 flex items-center gap-2">
          <Badge tone="brand" size="xs">{item.subject}</Badge>
          <Badge tone={priorityTone[item.priority] || 'warning'} size="xs">{item.priority}</Badge>
        </div>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button
            variant="secondary"
            leadingIcon={<CheckCircle2 className="h-4 w-4" />}
            onClick={handleMarkSubmitted}
          >
            Mark submitted
          </Button>
          <Button onClick={handleSubmit} leadingIcon={<Save className="h-4 w-4" />}>
            Save changes
          </Button>
        </>
      }
    >
      {item.description ? (
        <p className="mb-4 rounded-lg border border-border-subtle bg-background-subtle/60 p-3 text-sm leading-relaxed text-foreground-muted">
          {item.description}
        </p>
      ) : null}

      <div className="mb-5 grid grid-cols-3 gap-2">
        <Card padding="sm" className="bg-background-subtle/40">
          <CardEyebrow><Calendar className="mr-1 inline h-3 w-3" /> Due</CardEyebrow>
          <div className="mt-1 text-sm font-semibold text-foreground">
            {new Date(item.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
        </Card>
        <Card padding="sm" className="bg-background-subtle/40">
          <CardEyebrow><Clock className="mr-1 inline h-3 w-3" /> Time left</CardEyebrow>
          <div className="mt-1 text-sm font-semibold text-foreground">
            <Badge tone={dueTone} size="xs">
              {overdue ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d`}
            </Badge>
          </div>
        </Card>
        <Card padding="sm" className="bg-background-subtle/40">
          <CardEyebrow><TrendingUp className="mr-1 inline h-3 w-3" /> Progress</CardEyebrow>
          <div className="mt-1 text-sm font-semibold text-foreground">
            {item.progress ?? 0}%
          </div>
        </Card>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="mb-2 text-2xs font-semibold uppercase tracking-[0.12em] text-foreground-subtle">
            Status
          </div>
          <div className="grid grid-cols-4 gap-2">
            {STATUSES.map((s) => {
              const active = status === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStatus(s.key)}
                  className={[
                    'rounded-lg border px-2 py-2 text-xs font-semibold transition-all',
                    active
                      ? 'border-brand-300 bg-brand-50 text-brand-700'
                      : 'border-border bg-surface text-foreground-muted hover:border-border-strong hover:text-foreground',
                  ].join(' ')}
                >
                  <Badge tone={s.tone} dot size="xs">{s.label}</Badge>
                </button>
              );
            })}
          </div>
        </div>

        <Input
          as="textarea"
          rows={3}
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this assignment…"
        />
      </form>
    </Modal>
  );
}
