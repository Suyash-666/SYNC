import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Copy, Check, AlertCircle } from 'lucide-react';
import { aiApi } from '../src/api/ai.api';
import PromptSuggestions from './PromptSuggestions';

/**
 * ChatInterface — AI Assistant chat panel.
 *
 * Talks to the real backend (POST /api/v1/ai/chat) which proxies the
 * request to the OpenAI-compatible provider configured on the server
 * (Groq + llama-3.3-70b-versatile by default). Conversation history is
 * persisted server-side and re-loaded on mount, so refreshing the page
 * does not lose the chat.
 */

function TypingIndicator() {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-border bg-surface px-4 py-3 shadow-xs">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full bg-brand-500"
          style={{ animation: 'bounce 1.2s ease-in-out infinite', animationDelay: `${i * 0.18}s` }}
        />
      ))}
      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }`}</style>
    </div>
  );
}

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch {}
  };
  return (
    <div className="overflow-hidden rounded-2xl rounded-tl-sm border border-border">
      <div className="flex items-center justify-between border-b border-border-subtle bg-background-subtle/60 px-3 py-1.5">
        <span className="font-mono text-2xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">{lang || 'code'}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-2xs text-foreground-muted transition-colors hover:bg-background-muted hover:text-foreground"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto bg-background-inverse/95 p-3 font-mono text-xs leading-relaxed text-brand-100">
        {code}
      </pre>
    </div>
  );
}

/**
 * Render a plain-text assistant reply into a sequence of blocks:
 *   - fenced ```code```        → code block
 *   - lines starting with "- " → bullet list
 *   - everything else          → paragraph
 * This keeps the message-bubble styles (text/list/code/table) used
 * elsewhere in the assistant, without us needing the AI to emit JSON.
 */
function renderBlocks(text) {
  if (!text) return [];
  const blocks = [];
  const lines = text.split(/\r?\n/);
  let i = 0;
  let buf = [];
  const flushParagraph = () => {
    if (buf.length) {
      blocks.push({ type: 'text', text: buf.join('\n') });
      buf = [];
    }
  };
  while (i < lines.length) {
    const line = lines[i];
    const fence = line.match(/^```(\w+)?\s*$/);
    if (fence) {
      flushParagraph();
      const lang = fence[1] || '';
      const codeLines = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        codeLines.push(lines[i]); i++;
      }
      i++; // skip closing fence
      blocks.push({ type: 'code', lang, code: codeLines.join('\n') });
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      flushParagraph();
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'list', items });
      continue;
    }
    if (line.trim() === '') { flushParagraph(); i++; continue; }
    buf.push(line);
    i++;
  }
  flushParagraph();
  return blocks;
}

function MessageBubble({ m }) {
  const isUser = m.sender === 'user';

  if (isUser) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 6, x: 16 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[70%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-brand-500 px-4 py-2.5 text-sm leading-relaxed text-brand-foreground shadow-sm">
          {m.text}
        </div>
      </motion.div>
    );
  }

  if (m.error) {
    return (
      <motion.div layout initial={{ opacity: 0, y: 6, x: -16 }} animate={{ opacity: 1, y: 0, x: 0 }} className="flex max-w-[80%] items-start gap-2.5">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-danger-soft text-danger">
          <AlertCircle className="h-3.5 w-3.5" />
        </div>
        <div className="rounded-2xl rounded-tl-sm border border-danger/30 bg-danger-soft px-4 py-2.5 text-sm leading-relaxed text-foreground shadow-xs">
          {m.text}
        </div>
      </motion.div>
    );
  }

  const blocks = m.blocks || renderBlocks(m.text);

  return (
    <motion.div layout initial={{ opacity: 0, y: 6, x: -16 }} animate={{ opacity: 1, y: 0, x: 0 }} className="flex max-w-[80%] items-start gap-2.5">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <div className="flex flex-col gap-2">
        {blocks.map((b, idx) => {
          if (b.type === 'code') return <CodeBlock key={idx} code={b.code} lang={b.lang} />;
          if (b.type === 'list') {
            return (
              <div key={idx} className="rounded-2xl rounded-tl-sm border border-border bg-surface px-4 py-3 shadow-xs">
                <ul className="flex flex-col gap-1.5">
                  {b.items.map((it, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-foreground">
                      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-md bg-brand-50 font-mono text-2xs font-bold text-brand-700">
                        {i + 1}
                      </span>
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            );
          }
          return (
            <div key={idx} className="whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-border bg-surface px-4 py-2.5 text-sm leading-relaxed text-foreground shadow-xs">
              {b.text}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function ChatInterface({ conversation, onTitleUpdate, onNewConversation }) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages, isTyping]);

  const send = async () => {
    const text = input.trim();
    if (!text || isTyping || !conversation) return;

    const userMsg = { id: 'u' + Date.now(), sender: 'user', type: 'text', text, ts: Date.now() };
    const tempAiId = 'a' + Date.now();

    // Optimistic update so the user sees their message immediately.
    onTitleUpdate(conversation.id, {
      ...conversation,
      messages: [
        ...conversation.messages,
        userMsg,
        { id: tempAiId, sender: 'ai', type: 'text', text: '', ts: Date.now() + 1 },
      ],
    });
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      const res = await aiApi.chat({
        message: text,
        conversation_id: conversation.serverId, // undefined for a brand-new chat
      });
      const reply = res?.response ?? res?.data?.response ?? '';

      // First user message → use it as the conversation title.
      const title = conversation.messages.length === 0
        ? text.slice(0, 60) + (text.length > 60 ? '…' : '')
        : conversation.title;

      onTitleUpdate(conversation.id, {
        ...conversation,
        title,
        serverId: res?.conversation_id ?? conversation.serverId,
        messages: [
          ...conversation.messages,
          userMsg,
          { id: tempAiId, sender: 'ai', type: 'text', text: reply, ts: Date.now() },
        ],
      });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to reach the AI service. Please try again.';
      setError(message);
      onTitleUpdate(conversation.id, {
        ...conversation,
        messages: [
          ...conversation.messages,
          userMsg,
          { id: tempAiId, sender: 'ai', error: true, type: 'text', text: message, ts: Date.now() },
        ],
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{conversation?.title || 'New chat'}</div>
            <div className="text-2xs text-foreground-muted">Powered by SYNC AI</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto scrollbar-subtle p-4">
        {error ? (
          <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-foreground">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" />
            <span>{error}</span>
          </div>
        ) : null}

        <AnimatePresence initial={false}>
          {conversation?.messages?.length ? (
            conversation.messages.map((m) => <MessageBubble key={m.id} m={m} />)
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid h-full place-items-center"
            >
              <PromptSuggestions onPick={(s) => setInput(s)} />
            </motion.div>
          )}
          {isTyping ? (
            <motion.div key="typing" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2.5">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <TypingIndicator />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Composer */}
      <div className="border-t border-border-subtle p-3">
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={1}
            placeholder="Ask SYNC AI anything…"
            className="min-h-[44px] flex-1 resize-none rounded-lg border border-border bg-background-subtle px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-subtle focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white shadow-sm transition-all hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
