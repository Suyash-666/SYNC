import React, { useEffect, useState } from 'react';
import ConversationHistory from './ConversationHistory';
import ChatInterface from './ChatInterface';
import StudyPlannerPanel from './StudyPlannerPanel';
import { aiApi } from '../src/api/ai.api';

/**
 * AIStudyAssistant — three-pane chat workspace.
 *
 * Loads the user's real conversation history from /ai/history on mount
 * and lets the user start a new chat. No fake placeholders.
 */
export default function AIStudyAssistant() {
  const [conversations, setConversations] = useState(null); // null = loading
  const [activeId, setActiveId] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // Load real history on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await aiApi.getHistory();
        if (cancelled) return;
        // /ai/history returns one row per conversation with a `preview`.
        const rows = Array.isArray(res) ? res : (res?.data || []);
        const list = rows.map((row) => ({
          id: row.conversation_id,
          serverId: row.conversation_id,
          title: row.preview ? row.preview.slice(0, 60) : 'Chat',
          messages: [],
          updatedAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
        }));
        setConversations(list);
        setActiveId(list[0]?.id || null);
      } catch (err) {
        if (cancelled) return;
        // Non-fatal — fall back to a single empty chat so the UI is still usable.
        setLoadError(err?.response?.data?.message || err?.message || 'Failed to load history');
        setConversations([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function newChat() {
    const id = 'c' + Date.now();
    const conv = { id, serverId: null, title: 'New chat', messages: [], updatedAt: Date.now() };
    setConversations((c) => [conv, ...(c || [])]);
    setActiveId(id);
  }

  function updateConversation(id, patch) {
    setConversations((all) => (all || []).map((c) => (c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c)));
  }

  async function removeConversation(id) {
    if (!window.confirm('Delete this conversation?')) return;
    const conv = conversations.find((c) => c.id === id);
    try {
      if (conv?.serverId) await aiApi.deleteConversation(conv.serverId);
    } catch {
      // Best-effort: still remove from the UI so the user is unblocked.
    }
    setConversations((all) => (all || []).filter((c) => c.id !== id));
    if (activeId === id) {
      const remaining = (conversations || []).filter((c) => c.id !== id);
      setActiveId(remaining[0]?.id || null);
    }
  }

  const active = (conversations || []).find((c) => c.id === activeId) || null;

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-4 lg:h-[calc(100vh-9rem)] lg:flex-row">
      <div className="w-full shrink-0 lg:w-60">
        <ConversationHistory
          conversations={conversations || []}
          activeId={activeId}
          onSelect={setActiveId}
          onNew={newChat}
          onDelete={removeConversation}
        />
      </div>

      <div className="min-w-0 flex-1">
        {active ? (
          <ChatInterface
            conversation={active}
            onTitleUpdate={(id, patch) => updateConversation(id, patch)}
          />
        ) : (
          <div className="grid h-full place-items-center rounded-2xl border border-border bg-surface text-sm text-foreground-muted">
            {conversations === null
              ? 'Loading conversations…'
              : loadError
                ? `Couldn't load history — ${loadError}`
                : (
                  <div className="flex flex-col items-center gap-3 p-6 text-center">
                    <div className="text-base font-semibold text-foreground">No conversations yet</div>
                    <div className="max-w-sm text-xs text-foreground-muted">
                      Start a new chat and SYNC AI will remember it for next time.
                    </div>
                    <button
                      type="button"
                      onClick={newChat}
                      className="mt-1 inline-flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-brand-600"
                    >
                      Start a new chat
                    </button>
                  </div>
                )}
          </div>
        )}
      </div>

      <div className="w-full shrink-0 overflow-y-auto scrollbar-subtle lg:w-72">
        <StudyPlannerPanel />
      </div>
    </div>
  );
}
