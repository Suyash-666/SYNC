import React, { memo } from 'react';

function MessageBubble({ item, currentUserId }) {
  // "You" is the current user. The mapper sets `user_id` from the row
  // returned by Supabase; we compare against the logged-in user's id.
  const isYou = Boolean(currentUserId && item?.user_id && item.user_id === currentUserId);
  return (
    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isYou ? 'ml-auto bg-[var(--color-accent)] text-white' : 'bg-[rgba(255,255,255,0.03)] text-text-primary'}`}>
      <div className="text-xs uppercase tracking-[0.18em] opacity-70">{item.sender}</div>
      <div className="mt-1 text-sm whitespace-pre-wrap">{item.text}</div>
    </div>
  );
}

export default memo(MessageBubble);
