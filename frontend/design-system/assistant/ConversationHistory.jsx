import React, { useMemo, useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ConvItem({ c, active, onClick, onDelete }) {
  return (
    <div className="group relative mb-1">
      <button
        type="button"
        onClick={onClick}
        className={[
          'block w-full rounded-lg border px-2.5 py-2 text-left transition-colors',
          active
            ? 'border-brand-300 bg-brand-50 text-brand-700'
            : 'border-transparent text-foreground-muted hover:bg-background-muted hover:text-foreground',
        ].join(' ')}
      >
        {active ? <span className="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-brand-500" /> : null}
        <div className="truncate pl-1 text-xs font-semibold">{c.title || 'New chat'}</div>
        <div className="mt-0.5 flex items-center justify-between pl-1">
          <span className="font-mono text-2xs text-foreground-subtle">{timeAgo(c.updatedAt)}</span>
        </div>
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
        aria-label="Delete conversation"
        className="absolute right-1.5 top-1.5 hidden rounded-md p-1 text-foreground-subtle transition-colors hover:bg-danger-soft hover:text-danger group-hover:block"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

function Section({ label, items, activeId, onSelect, onDelete }) {
  if (!items.length) return null;
  return (
    <div className="mb-4">
      <div className="mb-1 px-1 text-2xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">
        {label}
      </div>
      {items.map((c) => (
        <ConvItem key={c.id} c={c} active={activeId === c.id} onClick={() => onSelect(c.id)} onDelete={onDelete} />
      ))}
    </div>
  );
}

export default function ConversationHistory({ conversations, activeId, onSelect, onNew, onDelete }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return conversations;
    const q = query.toLowerCase();
    return conversations.filter((c) => (c.title || '').toLowerCase().includes(q));
  }, [conversations, query]);

  const DAY = 86400000;
  const now = Date.now();
  const today = filtered.filter((c) => now - (c.updatedAt || 0) < DAY);
  const week  = filtered.filter((c) => now - (c.updatedAt || 0) >= DAY && now - (c.updatedAt || 0) < 7 * DAY);
  const older = filtered.filter((c) => now - (c.updatedAt || 0) >= 7 * DAY);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <div>
          <div className="text-2xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">History</div>
          <div className="mt-0.5 text-sm font-semibold text-foreground">Chats</div>
        </div>
        <button
          type="button"
          onClick={onNew}
          className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-glow"
        >
          <Plus className="h-3 w-3" /> New
        </button>
      </div>

      <div className="border-b border-border-subtle p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-subtle" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations…"
            className="h-8 w-full rounded-lg border border-border bg-background-subtle pl-8 pr-3 text-xs text-foreground placeholder:text-foreground-subtle focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-subtle p-3">
        <Section label="Today"     items={today} activeId={activeId} onSelect={onSelect} onDelete={onDelete} />
        <Section label="This Week" items={week}  activeId={activeId} onSelect={onSelect} onDelete={onDelete} />
        <Section label="Older"     items={older} activeId={activeId} onSelect={onSelect} onDelete={onDelete} />
        {conversations.length === 0 ? (
          <div className="mt-10 text-center text-2xs text-foreground-subtle">
            <div className="mb-2 text-2xl">💬</div>
            No conversations yet
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-10 text-center text-2xs text-foreground-subtle">
            No chats match "{query}"
          </div>
        ) : null}
      </div>

      <div className="border-t border-border-subtle px-3 py-2 text-center font-mono text-2xs text-foreground-subtle">
        {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
