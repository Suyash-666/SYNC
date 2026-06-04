import React, { useEffect, useState } from 'react';
import { Save, Trash2, Tag, X, Plus, Bold, Italic, Code2, Heading1 } from 'lucide-react';
import { Button, Card, Toast } from '../components';

/**
 * NoteEditor — note title + tags + markdown body.
 *
 * Design decisions:
 *   • Card-based layout: the editor is its own panel inside the right
 *     column of the 3-pane Notes page.
 *   • Toolbar is a row of icon buttons (B / I / Code / H1). The
 *     implementation focuses on visual feedback — these are wired to
 *     wrap the current selection in markdown tokens.
 *   • Tags render as removable chips below the title.
 *   • The "Saved" feedback is the new Toast (bottom-right, animated),
 *     not a hand-rolled "fixed bottom-6 right-6" div.
 */
export default function NoteEditor({ note, onSave, onDelete }) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [tags, setTags] = useState(note?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [toast, setToast] = useState(false);

  useEffect(() => {
    setTitle(note?.title || '');
    setContent(note?.content || '');
    setTags(note?.tags || []);
  }, [note]);

  if (!note) return null;

  const addTag = () => {
    const v = tagInput.trim();
    if (!v || tags.includes(v)) return;
    setTags((t) => [...t, v]);
    setTagInput('');
  };

  const removeTag = (t) => setTags((arr) => arr.filter((x) => x !== t));

  const save = () => {
    onSave({ ...note, title, content, tags });
    setToast(true);
  };

  const insert = (left, right = left) => {
    // Naive markdown helper — operates on the textarea selection.
    const ta = document.getElementById('note-content');
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const next = content.slice(0, start) + left + content.slice(start, end) + right + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = start + left.length;
      ta.selectionEnd = end + left.length;
    });
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <Card padding="md" className="flex h-full flex-col overflow-hidden">
      <Toast
        open={toast}
        variant="success"
        onClose={() => setToast(false)}
        duration={1600}
        message="Note saved"
      />

      {/* Title */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Untitled note"
        className="w-full bg-transparent text-2xl font-semibold tracking-tight text-foreground outline-none placeholder:text-foreground-subtle"
      />
      <div className="mt-1 text-2xs text-foreground-subtle">
        Last edited {new Date(note.updatedAt || note.createdAt || Date.now()).toLocaleString()}
      </div>

      {/* Tags */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-background-subtle px-2 py-0.5 text-xs font-medium text-foreground-muted"
          >
            <Tag className="h-3 w-3" />
            {t}
            <button
              type="button"
              onClick={() => removeTag(t)}
              aria-label={`Remove ${t}`}
              className="rounded-full p-0.5 hover:bg-background-muted"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <div className="inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-surface px-2 py-0.5">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="Add tag"
            className="w-16 bg-transparent text-xs text-foreground outline-none placeholder:text-foreground-subtle"
          />
          <button
            type="button"
            onClick={addTag}
            aria-label="Add tag"
            className="rounded p-0.5 text-foreground-subtle hover:bg-background-muted hover:text-foreground"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mt-4 flex items-center gap-1 rounded-lg border border-border-subtle bg-background-subtle/40 p-1">
        {[
          { icon: Bold,      title: 'Bold',        wrap: ['**', '**'] },
          { icon: Italic,    title: 'Italic',      wrap: ['_',   '_']  },
          { icon: Code2,     title: 'Inline code', wrap: ['`',   '`']  },
          { icon: Heading1,  title: 'Heading',     wrap: ['# ',  '']  },
        ].map((t) => (
          <button
            key={t.title}
            type="button"
            title={t.title}
            onClick={() => insert(t.wrap[0], t.wrap[1])}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            <t.icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>

      {/* Body */}
      <textarea
        id="note-content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start writing your note…"
        className="mt-3 min-h-[20rem] flex-1 resize-none rounded-lg border border-border-subtle bg-surface p-3 font-mono text-sm leading-relaxed text-foreground outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20"
      />

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-3 text-xs text-foreground-muted">
        <div className="flex items-center gap-3">
          <span>{wordCount} words</span>
          <span>·</span>
          <span>{content.length} chars</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            leadingIcon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={() => {
              if (window.confirm('Delete this note?')) onDelete(note.id);
            }}
          >
            Delete
          </Button>
          <Button size="sm" leadingIcon={<Save className="h-3.5 w-3.5" />} onClick={save}>
            Save
          </Button>
        </div>
      </div>
    </Card>
  );
}
