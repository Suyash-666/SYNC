import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Copy, Check } from 'lucide-react';
import PromptSuggestions from './PromptSuggestions';

/**
 * ChatInterface — AI Assistant chat panel.
 *
 * Design decisions:
 *   • Light theme. The previous version was a dark glass card with hard-
 *     coded `rgba(255,255,255,...)` tints and `'#fff'` text that rendered
 *     as invisible-on-white. Now everything maps to design tokens.
 *   • User bubbles use the brand color (indigo). AI bubbles use a soft
 *     surface with a subtle border. This is the same convention used by
 *     ChatGPT, Claude, and every modern AI chat.
 *   • Code blocks render with a tinted brand background and monospace.
 *   • The composer uses a single text input + send button, both styled
 *     to match the new Input primitive.
 */

const AI_RESPONSES = [
  [
    { type: 'text', text: "Here's a concise explanation of recursion: a function calls itself until it reaches a base case. It elegantly solves problems that can be broken into smaller sub-problems of the same type." },
    { type: 'list', items: ['Base case — stops the recursion', 'Recursive case — calls itself with a smaller input', 'Example: factorial, Fibonacci, tree traversal'] },
  ],
  [
    { type: 'text', text: "Here's a focused 5-day DBMS study plan:" },
    { type: 'table', rows: [['Day', 'Focus Area'], ['Day 1', 'ER Diagrams & Normalisation'], ['Day 2', 'SQL Queries & Joins'], ['Day 3', 'Transactions & ACID'], ['Day 4', 'Indexing & Query Optimisation'], ['Day 5', 'Mock test + revision']] },
  ],
  [
    { type: 'text', text: "Here's an efficient Fibonacci implementation using memoisation:" },
    { type: 'code', lang: 'javascript', code: 'const memo = {};\nfunction fib(n) {\n  if (n <= 1) return n;\n  if (memo[n]) return memo[n];\n  return (memo[n] = fib(n - 1) + fib(n - 2));\n}\n\nconsole.log(fib(10)); // 55' },
  ],
];

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
        <div className="max-w-[70%] rounded-2xl rounded-br-sm bg-brand-500 px-4 py-2.5 text-sm leading-relaxed text-brand-foreground shadow-sm">
          {m.text}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 6, x: -16 }} animate={{ opacity: 1, y: 0, x: 0 }} className="flex max-w-[80%] items-start gap-2.5">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <div className="flex flex-col gap-2">
        {m.type === 'text' && (
          <div className="rounded-2xl rounded-tl-sm border border-border bg-surface px-4 py-2.5 text-sm leading-relaxed text-foreground shadow-xs">
            {m.text}
          </div>
        )}

        {m.type === 'list' && (
          <div className="rounded-2xl rounded-tl-sm border border-border bg-surface px-4 py-3 shadow-xs">
            <ul className="flex flex-col gap-1.5">
              {m.items.map((it, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-foreground">
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-md bg-brand-50 font-mono text-2xs font-bold text-brand-700">
                    {i + 1}
                  </span>
                  {it}
                </li>
              ))}
            </ul>
          </div>
        )}

        {m.type === 'code' && <CodeBlock code={m.code} lang={m.lang} />}

        {m.type === 'table' && (
          <div className="overflow-hidden rounded-2xl rounded-tl-sm border border-border">
            <table className="w-full text-sm">
              <tbody>
                {m.rows.map((r, ri) => (
                  <tr key={ri} className={ri === 0 ? 'bg-background-subtle' : ri % 2 === 0 ? 'bg-background' : ''}>
                    {r.map((c, ci) => (
                      <td
                        key={ci}
                        className={[
                          'px-4 py-2',
                          ri === 0 ? 'font-semibold text-foreground' : 'text-foreground-muted',
                          ri < m.rows.length - 1 ? 'border-b border-border-subtle' : '',
                          ci < r.length - 1 ? 'border-r border-border-subtle' : '',
                        ].join(' ')}
                      >
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ChatInterface({ conversations, activeId, setConversations, setActiveId }) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  const active = conversations.find((c) => c.id === activeId) || conversations[0];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [active?.messages, isTyping]);

  const send = () => {
    const text = input.trim();
    if (!text || isTyping || !active) return;

    const userMsg = { id: 'u' + Date.now(), sender: 'user', type: 'text', text, ts: Date.now() };
    setConversations((all) =>
      all.map((c) => (c.id === active.id ? { ...c, messages: [...c.messages, userMsg] } : c)),
    );
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
      const aiMsg = {
        id: 'a' + Date.now(),
        sender: 'ai',
        type: 'multi',
        blocks: response,
        ts: Date.now(),
      };
      setConversations((all) =>
        all.map((c) => (c.id === active.id ? { ...c, messages: [...c.messages, aiMsg] } : c)),
      );
      setIsTyping(false);
    }, 1100);
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
            <div className="text-sm font-semibold text-foreground">{active?.title || 'New chat'}</div>
            <div className="text-2xs text-foreground-muted">Powered by SYNC AI</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto scrollbar-subtle p-4">
        <AnimatePresence initial={false}>
          {active?.messages.map((m) => (
            <MessageBubble key={m.id} m={m} />
          ))}
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
        <PromptSuggestions onSelect={(s) => setInput(s)} />
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="mt-2 flex items-end gap-2"
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
