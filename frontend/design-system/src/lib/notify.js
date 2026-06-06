// ============================================================================
// src/lib/notify.js
//
// Lightweight client-side helper that inserts a row into the `Notification`
// table. The Supabase Realtime channel on `Notification` (enabled in
// migration 0003_realtime.sql) is already subscribed by `useNotifications`,
// so a successful insert here will:
//   1. Show up at the top of the user's Notifications page within ~1s.
//   2. Bump the unread badge in the header and side panel.
//
// RLS on `Notification` (see migration 0002_rls_policies.sql — `notif_owner`)
// permits `FOR ALL TO authenticated` so any signed-in user can write their
// own rows. We only ever write rows for the current user.
//
// Call this from API modules right after a successful write so the user
// gets a real-time alert for their own action (e.g. they mark themselves
// present, the page lights up).
// ============================================================================

import { getSupabaseForUser, getSupabaseAccessToken } from './supabase';

/**
 * Insert a notification row for the current user.
 *
 * @param {object} opts
 * @param {'ASSIGNMENT'|'ATTENDANCE'|'AI_SUGGESTION'|'COLLABORATION'|'SYSTEM'} opts.type
 * @param {string} opts.title   Short headline (≤ 80 chars recommended)
 * @param {string} [opts.body]  Optional longer description
 * @returns {Promise<object|null>}  The inserted row, or null on failure.
 *
 * Failures here MUST NOT propagate: if the user is offline, the table
 * has an RLS regression, or the realtime channel is down, we still want
 * the original action (assignment create, attendance mark) to succeed.
 * We log + swallow any error and let the original promise resolve.
 */
export async function notify({ type, title, body = null }) {
  if (!type || !title) return null;
  try {
    const token = getSupabaseAccessToken();
    const c = getSupabaseForUser(token);
    if (!c) return null;

    const { data: { user } } = await c.auth.getUser();
    if (!user) return null;

    const { data, error } = await c
      .from('Notification')
      .insert({
        user_id: user.id,
        type,
        title: String(title).slice(0, 140),
        body: body ? String(body).slice(0, 500) : null,
      })
      .select('*')
      .single();

    if (error) {
      // eslint-disable-next-line no-console
      console.warn('[notify] insert failed:', error.message);
      return null;
    }
    return data;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[notify] threw:', e?.message || e);
    return null;
  }
}

/**
 * Best-effort subject formatter for an assignment notification.
 * Keeps the title short and human-friendly without truncating manually
 * in every caller.
 */
export function assignmentTitle(action, item) {
  const name = item?.title || 'Assignment';
  switch (action) {
    case 'created':  return `New assignment: ${name}`;
    case 'submitted':return `Submitted: ${name}`;
    case 'completed':return `Completed: ${name}`;
    case 'updated':  return `Updated: ${name}`;
    case 'deleted':  return `Deleted: ${name}`;
    default:         return name;
  }
}

export function attendanceTitle(status, subjectName) {
  const subj = subjectName || 'class';
  if (status === 'PRESENT') return `Marked present in ${subj}`;
  if (status === 'ABSENT')  return `Marked absent in ${subj}`;
  if (status === 'LATE')    return `Marked late in ${subj}`;
  return `Attendance updated for ${subj}`;
}

export function collaborationTitle(action, payload = {}) {
  switch (action) {
    case 'invite_redeemed':  return `${payload.by || 'Someone'} joined ${payload.room || 'your study room'}`;
    case 'room_created':     return `You created “${payload.room || 'a study room'}”`;
    case 'member_joined':    return `${payload.by || 'A new member'} joined ${payload.room || 'the room'}`;
    case 'member_left':      return `${payload.by || 'A member'} left ${payload.room || 'the room'}`;
    default:                 return payload.title || 'Collaboration update';
  }
}

export function aiTitle(payload = {}) {
  if (payload.title) return payload.title;
  if (payload.kind === 'study_plan')  return 'New study plan ready';
  if (payload.kind === 'tip')         return 'New AI study tip';
  if (payload.kind === 'insight')     return 'New AI insight';
  return 'AI suggestion';
}
