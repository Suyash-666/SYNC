// ============================================================================
// src/api/attendance.api.supabase.js
// Supabase-backed implementation of the attendanceApi interface.
//
// Returns the SAME shapes as the legacy module for all four methods.
// No consumer reads the response of `update` (which is now allowed to
// return null on no-match — the legacy `prisma.updateMany` is also
// a no-op when 0 rows match).
//
// Activated when VITE_USE_SUPABASE=crud (or 'all'). See featureFlags.js.
// ============================================================================

import { getSupabaseForUser, getSupabaseAccessToken } from '../lib/supabase';
import { notify, attendanceTitle } from '../lib/notify';

function client() {
  const token = getSupabaseAccessToken();
  const c = getSupabaseForUser(token);
  if (!c) throw new Error('Not signed in');
  return c;
}

function coerceDate(d) {
  // Accept strings (ISO or date-only) and Date objects.
  // Pass through to Supabase, which serializes to timestamptz.
  return d instanceof Date ? d.toISOString() : String(d);
}

// ---------------------------------------------------------------------------
// getBySubject(subjectId, params) -> AttendanceRecord[]
//   Legacy: GET /subjects/:id/attendance with optional month/year filters
//   Returns: array of records (no pagination wrapper)
// ---------------------------------------------------------------------------
export async function getBySubject(subjectId, params = {}) {
  const c = client();
  let query = c
    .from('AttendanceRecord')
    .select('*')
    .eq('subject_id', subjectId)
    .order('date', { ascending: false });

  if (params.month && params.year) {
    const start = new Date(parseInt(params.year, 10), parseInt(params.month, 10) - 1, 1);
    const end = new Date(parseInt(params.year, 10), parseInt(params.month, 10), 1);
    query = query.gte('date', start.toISOString()).lt('date', end.toISOString());
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

// ---------------------------------------------------------------------------
// mark(subjectId, payload) -> AttendanceRecord
//   Legacy: POST /subjects/:id/attendance with {date, status}
//   Mirrors prisma.attendanceRecord.upsert — creates if missing, updates
//   if (subject_id, date) already exists.
//
//   We previously used .upsert(row, { onConflict: 'subject_id,date' }),
//   but PostgREST requires a *unique index* (not just a named UNIQUE
//   constraint) to resolve the onConflict shorthand. The migration
//   `0001_init_schema.sql` only declares the constraint:
//     CONSTRAINT attendance_subject_date_unique UNIQUE (subject_id, date)
//   which PostgREST can't use for ON CONFLICT. Result: every "mark"
//   attempt threw `there is no unique or exclusion constraint matching
//   the ON CONFLICT specification`.
//
//   Rather than depend on a schema migration to add a supporting
//   unique index, we do an explicit select → insert-or-update. The
//   date is uniquely identified by (subject_id, date) at the app
//   layer — concurrent re-marks of the same date are already an
//   edge case and the worst that happens is a brief flicker between
//   the two clients' last-write-wins. RLS still applies to both
//   queries so a user can only see / write their own records.
// ---------------------------------------------------------------------------
export async function mark(subjectId, payload = {}) {
  const c = client();
  const { data: { user } } = await c.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const date = coerceDate(payload.date);
  const status = payload.status;

  // 1. Look for an existing row on (subject_id, date).
  const existingRes = await c
    .from('AttendanceRecord')
    .select('id')
    .eq('subject_id', subjectId)
    .eq('date', date)
    .maybeSingle();
  if (existingRes.error) throw new Error(existingRes.error.message);

  let record;
  if (existingRes.data) {
    // 2a. Update in place.
    const upd = await c
      .from('AttendanceRecord')
      .update({ status })
      .eq('id', existingRes.data.id)
      .select('*')
      .single();
    if (upd.error) throw new Error(upd.error.message);
    record = upd.data;
  } else {
    // 2b. Insert a new row.
    const ins = await c
      .from('AttendanceRecord')
      .insert({ subject_id: subjectId, user_id: user.id, date, status })
      .select('*')
      .single();
    if (ins.error) throw new Error(ins.error.message);
    record = ins.data;
  }

  // Best-effort realtime alert. Look up the subject's friendly name
  // for the notification body, but don't block on it.
  let subjectName = null;
  try {
    const sub = await c.from('Subject').select('name').eq('id', subjectId).maybeSingle();
    if (!sub.error && sub.data) subjectName = sub.data.name;
  } catch (_) {}

  notify({
    type: 'ATTENDANCE',
    title: attendanceTitle(status, subjectName),
    body: subjectName ? `${subjectName} — ${new Date(date).toLocaleDateString()}` : null,
  });
  return record;
}

// ---------------------------------------------------------------------------
// update(subjectId, date, payload) -> AttendanceRecord | null
//   Legacy: PUT /subjects/:id/attendance/:date with {status}
//   Mirrors prisma.attendanceRecord.updateMany — mass-update, no error
//   if 0 rows match.  The new path returns the first updated row, or
//   null if nothing matched.  No consumer reads the response.
// ---------------------------------------------------------------------------
export async function update(subjectId, date, payload = {}) {
  const c = client();
  const { error, data } = await c
    .from('AttendanceRecord')
    .update({ status: payload.status })
    .eq('subject_id', subjectId)
    .eq('date', coerceDate(date));
  if (error) throw new Error(error.message);
  return data && data[0] ? data[0] : null;
}

// ---------------------------------------------------------------------------
// remove(recordId) -> null
//   Legacy: DELETE /subjects/:id/attendance/:date
//   Delete a single attendance record by id. The frontend uses this from
//   the subject drawer to allow users to undo a mis-marked day.
// ---------------------------------------------------------------------------
export async function remove(recordId) {
  const c = client();
  const { error } = await c
    .from('AttendanceRecord')
    .delete()
    .eq('id', recordId);
  if (error) throw new Error(error.message);
  return null;
}

// ---------------------------------------------------------------------------
// getSummary() -> [{ subject: {id, name}, stats: {total, present, absent, percentage} }]
//   Legacy: GET /users/attendance/summary
//   Replicates attendance.service.summaryForCurrentSemester
//   (N+1: 3 counts per subject in the current semester).
// ---------------------------------------------------------------------------
export async function getSummary() {
  const c = client();
  const { data: { user } } = await c.auth.getUser();
  if (!user) throw new Error('Not signed in');

  // 1. Find current semester
  const semRes = await c
    .from('Semester')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_current', true)
    .maybeSingle();
  if (semRes.error) throw new Error(semRes.error.message);
  if (!semRes.data) return [];

  // 2. Find subjects in that semester
  const subjRes = await c
    .from('Subject')
    .select('id, name')
    .eq('semester_id', semRes.data.id);
  if (subjRes.error) throw new Error(subjRes.error.message);
  const subjects = subjRes.data || [];

  // 3. For each subject, three counts
  const out = [];
  for (const s of subjects) {
    const base = c
      .from('AttendanceRecord')
      .select('*', { count: 'exact', head: true })
      .eq('subject_id', s.id)
      .eq('user_id', user.id);

    const totalRes = await base;
    if (totalRes.error) throw new Error(totalRes.error.message);
    const total = totalRes.count ?? 0;

    const presentRes = await c
      .from('AttendanceRecord')
      .select('*', { count: 'exact', head: true })
      .eq('subject_id', s.id)
      .eq('user_id', user.id)
      .eq('status', 'PRESENT');
    if (presentRes.error) throw new Error(presentRes.error.message);
    const present = presentRes.count ?? 0;

    const absentRes = await c
      .from('AttendanceRecord')
      .select('*', { count: 'exact', head: true })
      .eq('subject_id', s.id)
      .eq('user_id', user.id)
      .eq('status', 'ABSENT');
    if (absentRes.error) throw new Error(absentRes.error.message);
    const absent = absentRes.count ?? 0;

    const percentage = total === 0 ? 0 : Math.round((present / total) * 100);
    out.push({
      subject: { id: s.id, name: s.name },
      stats: { total, present, absent, percentage },
    });
  }
  return out;
}

const attendanceApi = {
  getBySubject,
  get: getBySubject,
  mark,
  create: mark,
  update,
  remove,
  delete: remove,
  getSummary,
};

export default attendanceApi;
