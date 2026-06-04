import React, { useEffect, useState } from 'react';
import { Modal, Input, Select, Button, Badge } from '../components';
import { Plus } from 'lucide-react';

const PRIORITIES = [
  { value: 'High',   tone: 'danger'  },
  { value: 'Medium', tone: 'warning' },
  { value: 'Low',    tone: 'success' },
];

export default function AddAssignmentModal({ isOpen, onClose, onSubmit, subjects = [] }) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(subjects[0] || 'General');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(''); setDescription(''); setDueDate('');
      setPriority('Medium'); setSubject(subjects[0] || 'General');
    }
  }, [isOpen, subjects]);

  function handleSubmit(e) {
    e?.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title, subject, priority, description,
      dueDate: dueDate || new Date().toISOString(),
      progress: 0,
    });
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Add assignment"
      description="Track a new piece of coursework."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} leadingIcon={<Plus className="h-4 w-4" />}>
            Add assignment
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Database schema design"
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            {subjects.length ? subjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            )) : <option value="General">General</option>}
          </Select>
          <Input
            label="Due date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div>
          <div className="mb-2 text-2xs font-semibold uppercase tracking-[0.12em] text-foreground-subtle">
            Priority
          </div>
          <div className="grid grid-cols-3 gap-2">
            {PRIORITIES.map((p) => {
              const active = priority === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={[
                    'flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-all',
                    active
                      ? 'border-brand-300 bg-brand-50 text-brand-700'
                      : 'border-border bg-surface text-foreground-muted hover:border-border-strong hover:text-foreground',
                  ].join(' ')}
                >
                  <Badge tone={p.tone} dot size="xs">{p.value}</Badge>
                </button>
              );
            })}
          </div>
        </div>

        <Input
          as="textarea"
          rows={3}
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional details, requirements, or notes…"
        />
      </form>
    </Modal>
  );
}
