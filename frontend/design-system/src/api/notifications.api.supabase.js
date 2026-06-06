// ============================================================================
// src/api/notifications.api.supabase.js
// Supabase-backed implementation of the notificationsApi interface.
//
// Returns the SAME shapes as the legacy implementation in
// notifications.api.js for `getAll`. Mutations (markRead, markAllRead,
// delete) return values that are not read by any current consumer
// (useNotifications only dispatches reducers and invalidates queries),
// so a partial shape match is acceptable here.
//
// Activated when VITE_USE_SUPABASE=notifications (or 'all').
// ============================================================================

import { getSupabaseForUser, getSupabaseAccessToken } from '../lib/supabase';

function client() {
  const token = getSupabaseAccessToken();
  const c = getSupabaseForUser(token);
  if (!c) throw new Error('Not signed in');
  return c;
}

// ---------------------------------------------------------------------------
// getAll(params) -> { data, pagination }
// ---------------------------------------------------------------------------
export async function getAll(params = {}) {
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(params.limit || '20', 10) || 20));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const c = client();
  let query = c
    .from('Notification')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.type) query = query.eq('type', params.type);
  if (typeof params.is_read !== 'undefined') {
    query = query.eq('is_read', String(params.is_read) === 'true');
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  return {
    data: data || [],
    pagination: {
      total: count ?? (data ? data.length : 0),
      page,
      limit,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
    },
  };
}

// ---------------------------------------------------------------------------
// markRead(id)
// ---------------------------------------------------------------------------
export async function markRead(id) {
  const c = client();
  const { data: { user } } = await c.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await c
    .from('Notification')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', user.id)        // RLS would block anyway; defense-in-depth
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ---------------------------------------------------------------------------
// markAllRead()
// ---------------------------------------------------------------------------
export async function markAllRead() {
  const c = client();
  const { data: { user } } = await c.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await c
    .from('Notification')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)
    .select('id');

  if (error) throw new Error(error.message);
  return { count: (data || []).length };
}

// ---------------------------------------------------------------------------
// delete(id)
// ---------------------------------------------------------------------------
export async function remove(id) {
  const c = client();
  const { data: { user } } = await c.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { error } = await c
    .from('Notification')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
  return { message: 'Notification deleted' };
}

const notificationsApi = {
  getAll,
  markRead,
  markAllRead,
  delete: remove,
  remove,
};

export default notificationsApi;
