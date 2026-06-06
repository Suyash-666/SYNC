// ============================================================================
// src/api/subjects.api.supabase.js
// Supabase-backed implementation of the subjectsApi interface.
//
// Returns the SAME shapes as the legacy module. The notable difference
// is the getById nested shape: the legacy includes modules[topics[]] and
// attendance_records[] via Prisma's `include`. The new path uses
// PostgREST resource embedding: `select('*, modules(*, topics(*)),
// attendance_records(*)')`. RLS automatically filters the embedded
// relations to the user's own data.
//
// Activated when VITE_USE_SUPABASE=crud (or 'all').
// ============================================================================

import { getSupabaseForUser, getSupabaseAccessToken } from '../lib/supabase';

function client() {
  const token = getSupabaseAccessToken();
  const c = getSupabaseForUser(token);
  if (!c) throw new Error('Not signed in');
  return c;
}

// ---------------------------------------------------------------------------
// getBySemester(semesterId) -> Subject[]
// ---------------------------------------------------------------------------
export async function getBySemester(semesterId) {
  const c = client();
  const { data, error } = await c
    .from('Subject')
    .select('*')
    .eq('semester_id', semesterId);
  if (error) throw new Error(error.message);
  return data || [];
}

// ---------------------------------------------------------------------------
// getById(id) -> Subject with nested modules[topics[]] and attendance records.
//
// The original implementation tried to do everything in one PostgREST
// call: `select('*, modules(*, topics(*)), AttendanceRecord(*)')`. That
// breaks on this schema with the error
//   "Could not find a relationship between 'Subject' and 'modules'
//    in the schema cache"
// because the FK `Module.subject_id -> Subject.id` isn't surfaced to
// PostgREST under the simple plural embed name (the case-folded quoted
// table name `"Subject"` / `"Module"` interferes with relationship
// detection).
//
// The page already does a separate `attendanceApi.getBySubject` call
// rather than relying on the `AttendanceRecord(*)` embed — see the
// comment block in SemesterWorkspacePage.jsx. We mirror that pattern
// here for modules+topics: three plain queries that are obvious, fast
// (the schema cache hits the row-level RLS and returns only the
// caller's own rows), and never trip the relationship hint.
//
// The return shape is identical to the previous embed: { ..., modules:
// [{ id, subject_id, name, order_index, topics: [{ id, module_id, name,
// is_completed }] }] }. The SubjectDrawer reads it without changes.
// ---------------------------------------------------------------------------
export async function getById(id) {
  const c = client();

  // 1. Subject row itself.
  const subjRes = await c
    .from('Subject')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (subjRes.error) throw new Error(subjRes.error.message);
  if (!subjRes.data) {
    // Subject not found / not visible under RLS. Return null so the
    // caller can render a clean empty state instead of a 400-ish
    // "no rows" error.
    return null;
  }
  const subject = subjRes.data;

  // 2. Modules belonging to this subject.
  const modRes = await c
    .from('Module')
    .select('*')
    .eq('subject_id', id)
    .order('order_index', { ascending: true });
  if (modRes.error) throw new Error(modRes.error.message);
  const modules = modRes.data || [];

  // 3. Topics for those modules — fetched in a single IN query and
  // grouped client-side. Avoids N round-trips for a subject with many
  // modules. RLS still filters to the caller's own data.
  let topicsByModule = new Map();
  if (modules.length > 0) {
    const moduleIds = modules.map((m) => m.id);
    const topicRes = await c
      .from('Topic')
      .select('*')
      .in('module_id', moduleIds);
    if (topicRes.error) throw new Error(topicRes.error.message);
    for (const t of topicRes.data || []) {
      if (!topicsByModule.has(t.module_id)) topicsByModule.set(t.module_id, []);
      topicsByModule.get(t.module_id).push(t);
    }
  }

  return {
    ...subject,
    modules: modules.map((m) => ({
      ...m,
      topics: topicsByModule.get(m.id) || [],
    })),
  };
}

// ---------------------------------------------------------------------------
// create(semesterId, payload) -> Subject row
// ---------------------------------------------------------------------------
export async function create(semesterId, payload = {}) {
  const c = client();
  const row = {
    semester_id: semesterId,
    name: payload.name,
    subject_code: payload.subject_code || null,
    total_modules: payload.total_modules || 0,
    completed_modules: 0,
    internal_max_marks: payload.internal_max_marks || null,
    internal_scored: payload.internal_scored || null,
  };

  const { data, error } = await c
    .from('Subject')
    .insert(row)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ---------------------------------------------------------------------------
// update(id, payload) -> Subject row
// ---------------------------------------------------------------------------
export async function update(id, payload = {}) {
  const c = client();
  const row = {};
  if ('name' in payload) row.name = payload.name;
  if ('subject_code' in payload) row.subject_code = payload.subject_code;
  if ('total_modules' in payload) row.total_modules = payload.total_modules;
  if ('completed_modules' in payload) row.completed_modules = payload.completed_modules;
  if ('internal_max_marks' in payload) row.internal_max_marks = payload.internal_max_marks;
  if ('internal_scored' in payload) row.internal_scored = payload.internal_scored;

  const { data, error } = await c
    .from('Subject')
    .update(row)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ---------------------------------------------------------------------------
// delete(id)
// ---------------------------------------------------------------------------
export async function remove(id) {
  const c = client();
  const { error } = await c
    .from('Subject')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  return null;
}

// ---------------------------------------------------------------------------
// addModule(subjectId, payload) -> Module row
// ---------------------------------------------------------------------------
export async function addModule(subjectId, payload = {}) {
  const c = client();
  const row = {
    subject_id: subjectId,
    name: payload.name,
    order_index: payload.order_index || 0,
  };

  const { data, error } = await c
    .from('Module')
    .insert(row)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ---------------------------------------------------------------------------
// updateModule(subjectId, moduleId, payload) -> Module row
//   The `subjectId` parameter is accepted for URL symmetry with the
//   legacy API; the schema's `module_id → subject_id` is the actual
//   authorization path (enforced by RLS).
// ---------------------------------------------------------------------------
export async function updateModule(subjectId, moduleId, payload = {}) {
  const c = client();
  const row = {};
  if ('name' in payload) row.name = payload.name;
  if ('order_index' in payload) row.order_index = payload.order_index;

  const { data, error } = await c
    .from('Module')
    .update(row)
    .eq('id', moduleId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ---------------------------------------------------------------------------
// deleteModule(subjectId, moduleId)
// ---------------------------------------------------------------------------
export async function deleteModule(subjectId, moduleId) {
  const c = client();
  const { error } = await c
    .from('Module')
    .delete()
    .eq('id', moduleId);
  if (error) throw new Error(error.message);
  return null;
}

// ---------------------------------------------------------------------------
// toggleTopic(subjectId, topicId) -> Topic row
//   Mirrors subjects.service.toggleTopic: read is_completed, flip, update.
// ---------------------------------------------------------------------------
export async function toggleTopic(subjectId, topicId) {
  const c = client();
  const { data: topic, error: e1 } = await c
    .from('Topic')
    .select('id, is_completed')
    .eq('id', topicId)
    .single();
  if (e1) throw new Error(e1.message);
  if (!topic) throw new Error('Topic not found');

  const { data, error: e2 } = await c
    .from('Topic')
    .update({ is_completed: !topic.is_completed })
    .eq('id', topicId)
    .select('*')
    .single();
  if (e2) throw new Error(e2.message);
  return data;
}

// ---------------------------------------------------------------------------
// createTopic(moduleId, payload) -> Topic row
//   The legacy backend had no createTopic endpoint; topics were never
//   persisted. The Supabase path exposes this helper so the SubjectDrawer
//   can add a topic to an existing module.
// ---------------------------------------------------------------------------
export async function createTopic(moduleId, payload = {}) {
  const c = client();
  const row = {
    module_id: moduleId,
    name: payload.name,
    is_completed: false,
  };
  const { data, error } = await c
    .from('Topic')
    .insert(row)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ---------------------------------------------------------------------------
// updateTopic(topicId, payload) -> Topic row
//   Rename or change a topic. RLS enforces user ownership via Module →
//   Subject → Semester chain.
// ---------------------------------------------------------------------------
export async function updateTopic(topicId, payload = {}) {
  const c = client();
  const row = {};
  if ('name' in payload) row.name = payload.name;
  if ('is_completed' in payload) row.is_completed = !!payload.is_completed;
  const { data, error } = await c
    .from('Topic')
    .update(row)
    .eq('id', topicId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ---------------------------------------------------------------------------
// deleteTopic(topicId)
// ---------------------------------------------------------------------------
export async function deleteTopic(topicId) {
  const c = client();
  const { error } = await c
    .from('Topic')
    .delete()
    .eq('id', topicId);
  if (error) throw new Error(error.message);
  return null;
}

const subjectsApi = {
  getBySemester,
  listBySemester: getBySemester,
  getById,
  create,
  update,
  delete: remove,
  remove,
  addModule,
  updateModule,
  deleteModule,
  removeModule: deleteModule,
  toggleTopic,
  createTopic,
  updateTopic,
  deleteTopic,
};

export default subjectsApi;
