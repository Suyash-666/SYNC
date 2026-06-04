import React, { useState } from 'react';
import { motion } from 'framer-motion';

const SUGGESTIONS = [
  { text: 'Explain recursion with examples',                icon: '🔁' },
  { text: 'Create a study plan for DBMS exam in 5 days',    icon: '📅' },
  { text: 'Summarize Chapter 3 of Operating Systems',       icon: '📖' },
  { text: 'Quiz me on Data Structures',                     icon: '🧠' },
  { text: 'What should I study today?',                     icon: '✨' },
  { text: "Help me understand Dijkstra's algorithm",        icon: '🗺️' },
];

export default function PromptSuggestions({ onPick }) {
  return (
    <div>
      <div className="mb-3 text-center">
        <div className="mb-1 text-2xl">👋</div>
        <div className="font-display text-lg font-semibold text-foreground">What do you want to learn?</div>
        <div className="text-xs text-foreground-muted">Pick a suggestion or type your own question below</div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <motion.button
            key={s.text}
            type="button"
            onClick={() => onPick?.(s.text)}
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="rounded-xl border border-border bg-surface p-3 text-left transition-colors hover:border-brand-300 hover:bg-brand-50"
          >
            <div className="mb-2 grid h-8 w-8 place-items-center rounded-lg bg-background-muted text-base">
              {s.icon}
            </div>
            <div className="text-xs font-semibold leading-relaxed text-foreground-muted">{s.text}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
