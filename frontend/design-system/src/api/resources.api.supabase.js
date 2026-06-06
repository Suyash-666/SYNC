// ============================================================================
// src/api/resources.api.supabase.js
// Supabase-backed implementation of the resourcesApi interface.
//
// Returns the SAME shapes as the legacy implementation in resources.api.js:
//
//   getAll(params)    -> { data: [...], pagination: { total, page, limit, totalPages } }
//   upload({...})     -> the inserted Resource row
//   addLink(payload)  -> the inserted Resource row  (alias: link)
//   delete(id)        -> { message: 'Resource deleted' }  (alias: remove)
//
// Activated when VITE_USE_SUPABASE=storage (or 'all'). See featureFlags.js.
// ============================================================================

import { getSupabaseForUser, getSupabaseAccessToken } from '../lib/supabase';

const BUCKET = 'resources';

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function client() {
  const token = getSupabaseAccessToken();
  const c = getSupabaseForUser(token);
  if (!c) {
    throw new Error('Not signed in');
  }
  return c;
}

function inferFileType(mime) {
  if (!mime) return 'LINK';
  if (mime.includes('pdf')) return 'PDF';
  if (mime.includes('image')) return 'IMAGE';
  if (mime.startsWith('video/')) return 'VIDEO';
  return 'LINK';
}

function buildPagination(rows, page, limit) {
  const total = rows.length;
  return {
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

function publicUrl(path) {
  const base = import.meta.env.VITE_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}

function unwrapList(result) {
  if (result.error) throw new Error(result.error.message);
  return result.data || [];
}

// ---------------------------------------------------------------------------
// getAll(params)
// ---------------------------------------------------------------------------
export async function getAll(params = {}) {
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(params.limit || '20', 10) || 20));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const c = client();
  let query = c
    .from('Resource')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.subject_id) query = query.eq('subject_id', params.subject_id);
  if (params.file_type) query = query.eq('file_type', params.file_type);

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
// upload({ file, title, subject_id })
// ---------------------------------------------------------------------------
export async function upload({ file, title, subject_id } = {}) {
  if (!file) throw new Error('No file provided');
  if (file.size > MAX_BYTES) throw new Error('File too large (max 10 MB)');
  if (!ALLOWED_MIME.has(file.type)) throw new Error('File type not allowed');

  const c = client();
  const { data: { user } } = await c.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const safeName = encodeURIComponent(file.name || 'file');
  const path = `${user.id}/${Date.now()}_${safeName}`;

  // 1. Upload bytes directly to Supabase Storage
  const up = await c.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (up.error) throw new Error(up.error.message);

  // 2. Insert the metadata row. RLS enforces user_id = auth.uid().
  const row = {
    user_id: user.id,
    subject_id: subject_id || null,
    title: title || file.name,
    file_url: publicUrl(path),
    file_type: inferFileType(file.type),
    file_size: file.size,
  };

  const ins = await c
    .from('Resource')
    .insert(row)
    .select('*')
    .single();
  if (ins.error) {
    // Best-effort cleanup of the orphan storage object
    try { await c.storage.from(BUCKET).remove([path]); } catch (_) {}
    throw new Error(ins.error.message);
  }
  return ins.data;
}

// ---------------------------------------------------------------------------
// addLink(payload) / link(payload)
// ---------------------------------------------------------------------------
export async function addLink(payload = {}) {
  const c = client();
  const { data: { user } } = await c.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const row = {
    user_id: user.id,
    subject_id: payload.subject_id || null,
    title: payload.title,
    file_url: payload.file_url || payload.url,
    file_type: payload.file_type || 'LINK',
    file_size: payload.file_size || null,
  };

  const ins = await c.from('Resource').insert(row).select('*').single();
  if (ins.error) throw new Error(ins.error.message);
  return ins.data;
}

// ---------------------------------------------------------------------------
// delete(id) / remove(id)
// ---------------------------------------------------------------------------
export async function remove(id) {
  const c = client();
  // Look up first to derive the storage path from the URL
  const got = await c.from('Resource').select('file_url').eq('id', id).single();
  if (got.error) throw new Error(got.error.message);

  const marker = '/object/public/resources/';
  if (got.data?.file_url && got.data.file_url.includes(marker)) {
    const path = got.data.file_url.substring(
      got.data.file_url.indexOf(marker) + marker.length
    );
    // Storage delete is best-effort; we don't fail the API call on errors
    try { await c.storage.from(BUCKET).remove([path]); } catch (_) {}
  }

  const del = await c.from('Resource').delete().eq('id', id);
  if (del.error) throw new Error(del.error.message);
  return { message: 'Resource deleted' };
}

const resourcesApi = {
  getAll,
  upload,
  addLink,
  link: addLink,
  delete: remove,
  remove,
};

export default resourcesApi;
