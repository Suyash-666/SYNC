// ============================================================================
// src/api/assignments.api.supabase.js
// Supabase-backed implementation of the assignmentsApi interface.
//
// Returns the SAME shapes as the legacy module for all methods except
// `delete` (which returns null; the only consumer — useAssignments — does
// not read the response, so the mismatch is safe).
//
// Activated when VITE_USE_SUPABASE=crud (or 'all'). See featureFlags.js.
// ============================================================================

import { getSupabaseForUser, getSupabaseAccessToken } from '../lib/supabase';
import { notify, assignmentTitle } from '../lib/notify';

function client() {
  const token = getSupabaseAccessToken();
  const c = getSupabaseForUser(token);
  if (!c) throw new Error('Not signed in');
  return c;
}

function validateDueDate(s) {
  if (s === undefined || s === null) return true;
  const d = new Date(s);
  if (isNaN(d.getTime())) {
    throw new Error('due_date must be a valid date');
  }
  // Allow "today" (a 60-second grace window so the user can mark a task as
  // due right now without it being rejected as past). The legacy backend
  // did not enforce future-only, so this preserves prior behavior.
  const now = Date.now();
  if (d.getTime() < now - 60_000) {
    throw new Error('due_date cannot be in the past');
  }
  return true;
}

// ---------------------------------------------------------------------------
// getAll(filters) -> Assignment[]
//   Returns the inner array directly to match the legacy contract (the
//   legacy `apiClient.get('/assignments')` returns the unwrapped array via
//   helpers.unwrap). Pagination metadata is attached as a non-enumerable
//   property on the returned array so `.map` works and consumers that read
//   `data.pagination` (e.g. useAssignments) still get it.
// ---------------------------------------------------------------------------
export async function getAll(filters = {}) {
  const page = Math.max(1, parseInt(filters.page || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(filters.limit || '20', 10) || 20));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const c = client();
  let query = c
    .from('Assignment')
    .select('*', { count: 'exact' })
    .order('due_date', { ascending: true })
    .range(from, to);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.priority) query = query.eq('priority', filters.priority);
  if (filters.subject_id) query = query.eq('subject_id', filters.subject_id);
  if (filters.due_from) query = query.gte('due_date', filters.due_from);
  if (filters.due_to) query = query.lte('due_date', filters.due_to);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  const rows = data || [];
  const pagination = {
    total: count ?? rows.length,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil((count ?? rows.length) / limit)),
  };
  // Attach pagination as a non-enumerable property so `arr.map` works
  // and `arr.pagination` is also available to consumers like useAssignments.
  Object.defineProperty(rows, 'pagination', {
    value: pagination,
    enumerable: false,
    writable: true,
    configurable: true,
  });
  return rows;
}

// ---------------------------------------------------------------------------
// getById(id) -> Assignment row
// ---------------------------------------------------------------------------
export async function getById(id) {
  const c = client();
  const { data, error } = await c
    .from('Assignment')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ---------------------------------------------------------------------------
// create(payload) -> Assignment row
// ---------------------------------------------------------------------------
export async function create(payload = {}) {
  validateDueDate(payload.due_date);

  const c = client();
  const { data: { user } } = await c.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const row = {
    user_id: user.id,
    subject_id: payload.subject_id || null,
    title: payload.title,
    description: payload.description || null,
    status: payload.status || 'TODO',
    priority: payload.priority || 'MEDIUM',
    due_date: payload.due_date || null,
  };

  const { data, error } = await c
    .from('Assignment')
    .insert(row)
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  // Best-effort realtime alert. notify() swallows errors so a failure
  // here never blocks the original create.
  notify({
    type: 'ASSIGNMENT',
    title: assignmentTitle('created', data),
    body: data?.description || (data?.due_date ? `Due ${new Date(data.due_date).toLocaleDateString()}` : null),
  });
  return data;
}

// ---------------------------------------------------------------------------
// update(id, payload) -> Assignment row
// ---------------------------------------------------------------------------
export async function update(id, payload = {}) {
  if ('due_date' in payload) validateDueDate(payload.due_date);

  const c = client();
  // Build only the columns that were provided (preserves untouched fields
  // like submitted_at, status, etc.)
  const row = {};
  if ('title' in payload) row.title = payload.title;
  if ('description' in payload) row.description = payload.description;
  if ('subject_id' in payload) row.subject_id = payload.subject_id;
  if ('priority' in payload) row.priority = payload.priority;
  if ('status' in payload) row.status = payload.status;
  if ('due_date' in payload) row.due_date = payload.due_date;

  const { data, error } = await c
    .from('Assignment')
    .update(row)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ---------------------------------------------------------------------------
// updateStatus(id, { status }) -> Assignment row
//   Mirrors backend/src/services/assignments.service.js:
//     if status === 'SUBMITTED' → submitted_at = new Date()
// ---------------------------------------------------------------------------
export async function updateStatus(id, payload = {}) {
  const { status } = payload;
  if (!status) throw new Error('status required');

  const c = client();
  const row = { status };
  if (status === 'SUBMITTED') row.submitted_at = new Date().toISOString();

  const { data, error } = await c
    .from('Assignment')
    .update(row)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  // Fire a status-specific notification.
  const action =
    status === 'SUBMITTED' ? 'submitted' :
    status === 'COMPLETED' ? 'completed' :
    'updated';
  notify({
    type: 'ASSIGNMENT',
    title: assignmentTitle(action, data),
    body: data?.description || null,
  });
  return data;
}

// ---------------------------------------------------------------------------
// delete(id)
// ---------------------------------------------------------------------------
export async function remove(id) {
  const c = client();
  const { error } = await c
    .from('Assignment')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  return null;
}

const assignmentsApi = {
  getAll,
  getById,
  create,
  update,
  delete: remove,
  updateStatus,
};

export default assignmentsApi;
