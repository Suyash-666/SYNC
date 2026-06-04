import React, { useState } from 'react';
import ConversationHistory from './ConversationHistory';
import ChatInterface from './ChatInterface';
import StudyPlannerPanel from './StudyPlannerPanel';

/**
 * AIStudyAssistant — three-pane chat workspace.
 *
 * Design decisions:
 *   • Removed the full-height dark `100vh` wrapper — AppShell (provided by
 *     ProtectedRoute) now supplies the layout chrome, so the assistant
 *     just renders its three-pane content.
 *   • Removed the DM Sans/Mono font injection — Inter + Outfit are loaded
 *     once via globals.css.
 *   • The three panes use surface Cards so they read as panels, not free
 *     blocks of color. The conversation history and planner panels are
 *     `w-fit` width rather than fixed pixels, so they shrink responsively.
 */
export default function AIStudyAssistant() {
  const [conversations, setConversations] = useState([
    {
      id: 'c1',
      title: 'DSA study plan',
      messages: [
        { id: 'm1', sender: 'ai', type: 'text', text: 'Hi! Ready to plan your DSA study session? Tell me what topics you want to cover.', ts: Date.now() - 3600 * 1000 },
      ],
      updatedAt: Date.now() - 3600 * 1000,
    },
    {
      id: 'c2',
      title: 'OS Summary',
      messages: [
        { id: 'm1', sender: 'user', type: 'text', text: 'Summarize Chapter 3', ts: Date.now() - 86400000 },
      ],
      updatedAt: Date.now() - 86400000,
    },
  ]);

  const [activeId, setActiveId] = useState(conversations[0]?.id || null);

  function newChat() {
    const id = 'c' + Date.now();
    const conv = { id, title: 'New chat', messages: [], updatedAt: Date.now() };
    setConversations((c) => [conv, ...c]);
    setActiveId(id);
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-4 lg:h-[calc(100vh-9rem)] lg:flex-row">
      <div className="w-full shrink-0 lg:w-60">
        <ConversationHistory
          conversations={conversations}
          setConversations={setConversations}
          activeId={activeId}
          setActiveId={setActiveId}
          onNew={newChat}
        />
      </div>

      <div className="min-w-0 flex-1">
        <ChatInterface
          conversations={conversations}
          activeId={activeId}
          setConversations={setConversations}
          setActiveId={setActiveId}
        />
      </div>

      <div className="w-full shrink-0 overflow-y-auto scrollbar-subtle lg:w-72">
        <StudyPlannerPanel />
      </div>
    </div>
  );
}