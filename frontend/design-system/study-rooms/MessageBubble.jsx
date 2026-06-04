import React from 'react';
import { memo } from 'react';

function MessageBubble({ item }) {
  const isYou = item.sender === 'You' || item.sender?.toLowerCase?.() === 'you';
  return (
    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isYou ? 'ml-auto bg-[var(--color-accent)] text-white' : 'bg-[rgba(255,255,255,0.03)] text-text-primary'}`}>
      <div className="text-xs uppercase tracking-[0.18em] opacity-70">{item.sender}</div>
      <div className="mt-1 text-sm">{item.text}</div>
    </div>
  );
}

export default memo(MessageBubble);
