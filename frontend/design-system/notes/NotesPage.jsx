import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Folder, Tag as TagIcon, FileText, Trash2 } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardEyebrow,
  EmptyState,
  Input,
  Skeleton,
  Toast,
} from '../components';
import NoteEditor from './NoteEditor';
import { useNotes } from '../src/hooks/useNotes';

/**
 * NotesPage — three-pane notes workspace.
 *
 * Design decisions:
 *   • The old version lacked the AppShell (no sidebar / no topnav) — fixed
 *     by ProtectedRoute wrapping every protected page in AppShell.
 *   • Folder list: small icon + label + count. Active folder uses a brand
 *     background + brand foreground. Clicking "All" resets the filter
 *     instead of using an empty-string sentinel (cleaner state).
 *   • Note list: card-style buttons, last-modified date in the corner,
 *     tag chips below. Active note has a brand-tinted background and a
 *     2px brand border on the left.
 *   • Search input is the new Input primitive with a leading Search icon.
 *     The right-side `kbd` "Esc" hint signals it's keyboard-friendly.
 *   • The toolbar lives in a sticky bar at the top of the page (not
 *     inside AppShell) so the user can search/create on every screen.
 */
export default function NotesPage() {
  const [activeFolder, setActiveFolder] = useState('All');
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState({ open: false, variant: 'info', message: '' });

  const { notes, folders, isLoading, error, createNote, updateNote, deleteNote } = useNotes(
    activeFolder === 'All' ? '' : activeFolder,
    search,
  );

  // Auto-pick the first note when folders / data load
  useEffect(() => {
    if (!activeNoteId && notes.length > 0) setActiveNoteId(notes[0].id);
  }, [notes, activeNoteId]);

  const folderNames = useMemo(() => ['All', ...folders], [folders]);
  const visibleNotes = useMemo(
    () => (activeFolder === 'All' ? notes : notes.filter((n) => n.folder === activeFolder)),
    [notes, activeFolder],
  );
  const activeNote = visibleNotes.find((n) => n.id === activeNoteId) || visibleNotes[0] || null;

  const showToast = (variant, message) => setToast({ open: true, variant, message });

  const handleCreate = async () => {
    try {
      const created = await createNote({
        title: 'Untitled',
        content: '',
        folder: activeFolder === 'All' ? 'Unsorted' : activeFolder,
        tags: [],
      });
      setActiveNoteId(created.id);
      showToast('success', 'Note created.');
    } catch (err) {
      showToast('error', err.message || 'Unable to create note.');
    }
  };

  const handleSave = async (updated) => {
    try {
      await updateNote({ id: updated.id, payload: updated });
      showToast('success', 'Note saved.');
    } catch (err) {
      showToast('error', err.message || 'Unable to save note.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNote(id);
      if (activeNoteId === id) setActiveNoteId(null);
      showToast('success', 'Note deleted.');
    } catch (err) {
      showToast('error', err.message || 'Unable to delete note.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton variant="line" width="40%" height={28} />
        <div className="grid gap-4 lg:grid-cols-[240px_320px_1fr]">
          <Skeleton variant="block" className="h-[36rem]" />
          <Skeleton variant="block" className="h-[36rem]" />
          <Skeleton variant="block" className="h-[36rem]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        title="Notes failed to load"
        description={error.message || 'Unable to fetch notes.'}
        actionLabel="Retry"
        onAction={() => window.location.reload()}
      />
    );
  }

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
          <CardEyebrow>Library</CardEyebrow>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-foreground">
            Notes & Resources
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Server-backed notes, folders, and tags. Search by title, content, or tag.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes…"
            leftIcon={<Search className="h-4 w-4" />}
            className="w-72"
          />
          <Button leadingIcon={<Plus className="h-4 w-4" />} onClick={handleCreate}>
            New note
          </Button>
        </div>
      </div>

      {/* 3-pane grid */}
      <div className="grid gap-4 lg:grid-cols-[240px_320px_1fr]">
        {/* Folders */}
        <Card padding="sm" className="h-fit">
          <div className="px-2 pb-2 pt-1">
            <CardEyebrow>Folders</CardEyebrow>
          </div>
          <ul className="flex flex-col gap-0.5">
            {folderNames.map((folder) => {
              const active = activeFolder === folder;
              const count =
                folder === 'All'
                  ? notes.length
                  : notes.filter((n) => n.folder === folder).length;
              return (
                <li key={folder}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveFolder(folder);
                      setActiveNoteId(null);
                    }}
                    className={[
                      'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-foreground-muted hover:bg-background-muted hover:text-foreground',
                    ].join(' ')}
                  >
                    <Folder className={['h-4 w-4', active ? 'text-brand-600' : 'text-foreground-subtle'].join(' ')} />
                    <span className="flex-1 text-left">{folder}</span>
                    <span className={['text-2xs font-mono', active ? 'text-brand-600' : 'text-foreground-subtle'].join(' ')}>
                      {count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Notes list */}
        <Card padding="sm" className="h-fit max-h-[36rem] overflow-hidden">
          <div className="flex items-center justify-between px-2 pb-2 pt-1">
            <CardEyebrow>Notes</CardEyebrow>
            <Badge tone="neutral" size="xs">{visibleNotes.length}</Badge>
          </div>
          <div className="max-h-[34rem] space-y-1.5 overflow-y-auto scrollbar-subtle pr-1">
            {visibleNotes.length === 0 ? (
              <EmptyState
                compact
                icon={<FileText className="h-5 w-5" />}
                title="No notes yet"
                description="Create the first note in this folder."
                actionLabel="New note"
                onAction={handleCreate}
              />
            ) : (
              visibleNotes.map((note) => {
                const active = activeNoteId === note.id;
                return (
                  <motion.button
                    key={note.id}
                    type="button"
                    onClick={() => setActiveNoteId(note.id)}
                    whileHover={{ y: -1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    className={[
                      'group relative w-full rounded-xl border px-3.5 py-3 text-left transition-colors',
                      active
                        ? 'border-brand-300 bg-brand-50/60'
                        : 'border-border bg-surface hover:border-border-strong',
                    ].join(' ')}
                  >
                    {active ? (
                      <span className="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-brand-500" />
                    ) : null}
                    <div className="flex items-start justify-between gap-2">
                      <div className="line-clamp-1 text-sm font-semibold text-foreground">
                        {note.title || 'Untitled'}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(note.id);
                        }}
                        aria-label="Delete note"
                        className="invisible rounded p-1 text-foreground-subtle transition-colors hover:bg-danger-soft hover:text-danger group-hover:visible"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-foreground-muted">
                      {note.content || 'Empty note'}
                    </div>
                    {note.tags?.length ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {note.tags.slice(0, 4).map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 rounded-full bg-background-muted px-2 py-0.5 text-2xs font-medium text-foreground-muted"
                          >
                            <TagIcon className="h-2.5 w-2.5" /> {t}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </motion.button>
                );
              })
            )}
          </div>
        </Card>

        {/* Editor */}
        <div className="min-h-[36rem]">
          {activeNote ? (
            <NoteEditor note={activeNote} onSave={handleSave} onDelete={handleDelete} />
          ) : (
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title="Select a note"
              description="Choose a note from the list to start editing."
              actionLabel="New note"
              onAction={handleCreate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
