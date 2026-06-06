// ============================================================================
// src/lib/supabaseRealtime.js
// Module-level singleton that owns the Supabase Realtime channel for the
// `Notification` table. Multiple components mounting the same hook will
// share one channel; only one `phx_join` is sent.
//
// Activated by VITE_USE_SUPABASE=notifications (or 'all'). See featureFlags.
// ============================================================================

import { getSupabaseForUser, getSupabaseAccessToken } from './supabase';

let channel = null;
let currentToken = null;
let subscribedUserId = null;

const listeners = {
  insert: new Set(),
  update: new Set(),
  delete: new Set(),
};

function emit(eventType, payload) {
  const set = listeners[eventType];
  if (!set) return;
  for (const fn of set) {
    try { fn(payload); } catch (e) { /* swallow listener errors */ }
  }
}

function userIdFromToken(token) {
  if (!token) return null;
  // The Supabase access token is a JWT. The `sub` claim is the auth user id.
  // We decode the payload only (no signature check — RLS enforces correctness
  // server-side, and the token came from a trusted source: the user's session).
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(
      typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf8')
    );
    return json.sub || null;
  } catch (_) {
    return null;
  }
}

/**
 * Subscribe to INSERT/UPDATE/DELETE events on the `Notification` table.
 *
 * @param {object} callbacks
 * @param {(payload: object) => void} [callbacks.onInsert]
 * @param {(payload: object) => void} [callbacks.onUpdate]
 * @param {(payload: object) => void} [callbacks.onDelete]
 * @returns {() => void} unsubscribe function
 */
export function subscribeNotifications({ onInsert, onUpdate, onDelete } = {}) {
  if (onInsert) listeners.insert.add(onInsert);
  if (onUpdate) listeners.update.add(onUpdate);
  if (onDelete) listeners.delete.add(onDelete);

  ensureChannel();

  return () => {
    listeners.insert.delete(onInsert);
    listeners.update.delete(onUpdate);
    listeners.delete.delete(onDelete);
    // If no listeners remain, we leave the channel alive — it is cheap and
    // other components may subscribe later. The channel is torn down on
    // full page reload, which is acceptable for a notifications feed.
  };
}

function ensureChannel() {
  if (channel) return;

  const token = getSupabaseAccessToken();
  if (!token) return; // not signed in; will retry on next subscribeNotifications call
  const userId = userIdFromToken(token);
  if (!userId) return;

  const c = getSupabaseForUser(token);
  if (!c) return;

  currentToken = token;
  subscribedUserId = userId;

  try {
    channel = c
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Notification',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Supabase Realtime wraps the new/old row in payload.new / payload.old.
          // We emit the full payload so the consumer can inspect `eventType`.
          const evt = payload?.eventType; // 'INSERT' | 'UPDATE' | 'DELETE'
          if (evt === 'INSERT') emit('insert', payload);
          else if (evt === 'UPDATE') emit('update', payload);
          else if (evt === 'DELETE') emit('delete', payload);
        }
      )
      .subscribe((status, err) => {
        // Status: 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED'.
        // Don't throw — an unhandled rejection here would crash the whole app.
        if (err) {
          // eslint-disable-next-line no-console
          console.warn('[supabaseRealtime] channel error:', err);
        }
      });
  } catch (e) {
    // Defensive: never let realtime setup bring down the page.
    // eslint-disable-next-line no-console
    console.warn('[supabaseRealtime] ensureChannel failed:', e);
    channel = null;
  }
}

/**
 * Force-unsubscribe. Not normally needed; kept for symmetry and tests.
 */
export async function unsubscribeAll() {
  if (channel) {
    try { await channel.unsubscribe(); } catch (_) {}
    channel = null;
  }
  currentToken = null;
  subscribedUserId = null;
  listeners.insert.clear();
  listeners.update.clear();
  listeners.delete.clear();
}

/**
 * For tests: returns the currently subscribed user id, or null.
 */
export function _debugSubscribedUserId() {
  return subscribedUserId;
}
