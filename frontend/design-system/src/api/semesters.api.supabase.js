// ============================================================================
// src/api/semesters.api.supabase.js
// Supabase-backed implementation of the semestersApi interface.
//
// Returns the SAME shapes as the legacy module. The `setCurrent` method
// is a two-step transaction (clear others, then set target) that
// mirrors the legacy behavior — both paths share the same atomicity
// limitation. A future Postgres RPC can wrap both steps in a single
// transaction; see CHECKPOINT_5E_PLAN.md "Follow-ups".
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

async function currentUserId() {
  const c = client();
  const { data: { user } } = await c.auth.getUser();
  if (!user) throw new Error('Not signed in');
  return user.id;
}

// ---------------------------------------------------------------------------
// getAll() -> Semester[]
// ---------------------------------------------------------------------------
export async function getAll() {
  const c = client();
  const { data, error } = await c
    .from('Semester')
    .select('*')
    .order('semester_number', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

// ---------------------------------------------------------------------------
// getById(id) -> Semester row
// ---------------------------------------------------------------------------
export async function getById(id) {
  const c = client();
  const { data, error } = await c
    .from('Semester')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ---------------------------------------------------------------------------
// create(payload) -> Semester row
// ---------------------------------------------------------------------------
export async function create(payload = {}) {
  const userId = await currentUserId();
  const c = client();

  const row = {
    user_id: userId,
    semester_number: payload.semester_number,
    academic_year: payload.academic_year,
    start_date: payload.start_date || null,
    end_date: payload.end_date || null,
    is_current: payload.is_current || false,
  };

  const { data, error } = await c
    .from('Semester')
    .insert(row)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ---------------------------------------------------------------------------
// update(id, payload) -> Semester row
// ---------------------------------------------------------------------------
export async function update(id, payload = {}) {
  const c = client();
  const row = {};
  if ('semester_number' in payload) row.semester_number = payload.semester_number;
  if ('academic_year' in payload) row.academic_year = payload.academic_year;
  if ('start_date' in payload) row.start_date = payload.start_date;
  if ('end_date' in payload) row.end_date = payload.end_date;
  if ('is_current' in payload) row.is_current = payload.is_current;

  const { data, error } = await c
    .from('Semester')
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
    .from('Semester')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  return null;
}

// ---------------------------------------------------------------------------
// setCurrent(id) -> Semester row
//   Two-step: clear `is_current` on all the user's other semesters,
//   then mark the target as current.  Mirrors the legacy
//   `setCurrentSemester` (which has the same atomicity limitation).
// ---------------------------------------------------------------------------
export async function setCurrent(id) {
  const userId = await currentUserId();
  const c = client();

  // Step 1: clear is_current on all the user's other semesters
  const { error: e1 } = await c
    .from('Semester')
    .update({ is_current: false })
    .eq('user_id', userId)
    .eq('is_current', true);
  if (e1) throw new Error(e1.message);

  // Step 2: mark the target semester as current
  const { data, error: e2 } = await c
    .from('Semester')
    .update({ is_current: true })
    .eq('id', id)
    .select('*')
    .single();
  if (e2) throw new Error(e2.message);
  return data;
}

const semestersApi = {
  getAll,
  getById,
  create,
  update,
  delete: remove,
  remove,
  setCurrent,
};

export default semestersApi;
