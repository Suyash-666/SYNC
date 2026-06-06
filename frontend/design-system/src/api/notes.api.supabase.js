// ============================================================================
// src/api/notes.api.supabase.js
// Supabase-backed implementation of the notesApi interface.
//
// Returns the SAME shapes as the legacy module for all methods except
// `delete` (which returns null; the only consumer — useNotes — does
// not read the response, so the mismatch is safe).
//
// Soft delete: `delete(id)` sets `is_deleted = true` (does NOT remove
// the row). `getAll` filters `is_deleted = false`.
//
// Activated when VITE_USE_SUPABASE=crud (or 'all'). See featureFlags.js.
// ============================================================================

import { getSupabaseForUser, getSupabaseAccessToken } from '../lib/supabase';

function client() {
  const token = getSupabaseAccessToken();
  const c = getSupabaseForUser(token);
  if (!c) throw new Error('Not signed in');
  return c;
}

// ---------------------------------------------------------------------------
// getAll(params) -> { data: Note[], pagination: {total, page, limit, totalPages} }
// ---------------------------------------------------------------------------
export async function getAll(params = {}) {
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(params.limit || '20', 10) || 20));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const c = client();
  let query = c
    .from('Note')
    .select('*', { count: 'exact' })
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false })
    .range(from, to);

  if (params.folder) query = query.eq('folder', params.folder);
  if (params.search) query = query.ilike('title', `%${params.search}%`);

  // tags filter — supports array or single value (matches the legacy
  // behavior: Array.isArray ? array : [single])
  let tags = params.tags;
  if (tags !== undefined && tags !== null) {
    if (!Array.isArray(tags)) tags = [tags];
    if (tags.length > 0) query = query.overlaps('tags', tags);
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
// getById(id) -> Note row
// ---------------------------------------------------------------------------
export async function getById(id) {
  const c = client();
  const { data, error } = await c
    .from('Note')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ---------------------------------------------------------------------------
// create(payload) -> Note row
// ---------------------------------------------------------------------------
export async function create(payload = {}) {
  const c = client();
  const { data: { user } } = await c.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const row = {
    user_id: user.id,
    title: payload.title,
    content: payload.content || null,
    folder: payload.folder || null,
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    is_deleted: false,
  };

  const { data, error } = await c
    .from('Note')
    .insert(row)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ---------------------------------------------------------------------------
// update(id, payload) -> Note row
// ---------------------------------------------------------------------------
export async function update(id, payload = {}) {
  const c = client();
  const row = {};
  if ('title' in payload) row.title = payload.title;
  if ('content' in payload) row.content = payload.content;
  if ('folder' in payload) row.folder = payload.folder;
  if ('tags' in payload) {
    row.tags = Array.isArray(payload.tags) ? payload.tags : [];
  }

  const { data, error } = await c
    .from('Note')
    .update(row)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ---------------------------------------------------------------------------
// delete(id) — soft delete: sets is_deleted = true
// ---------------------------------------------------------------------------
export async function remove(id) {
  const c = client();
  const { error } = await c
    .from('Note')
    .update({ is_deleted: true })
    .eq('id', id);
  if (error) throw new Error(error.message);
  return null;
}

// ---------------------------------------------------------------------------
// getFolders() -> string[]
//   Distinct folder names for the current user, excluding null and
//   soft-deleted notes.  Mirrors backend/src/repositories/notes.repository.js
//   .distinctFolders().
// ---------------------------------------------------------------------------
export async function getFolders() {
  const c = client();
  const { data, error } = await c
    .from('Note')
    .select('folder')
    .eq('is_deleted', false);
  if (error) throw new Error(error.message);
  const set = new Set((data || []).map((r) => r.folder).filter(Boolean));
  return Array.from(set);
}

const notesApi = {
  getAll,
  getById,
  create,
  update,
  delete: remove,
  remove,
  getFolders,
  folders: getFolders,
};

export default notesApi;
