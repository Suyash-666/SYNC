// ============================================================================
// src/api/analytics.api.supabase.js
// Supabase-backed implementation of the analyticsApi interface.
//
// Reads from the analytics_* views created in
// supabase/migrations/0007_analytics_views.sql. Views are SECURITY INVOKER
// so RLS on the underlying tables still applies.
//
// Activated when VITE_USE_SUPABASE=analytics (or 'all'). See featureFlags.js.
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
// getOverview() -> { attendancePct, pendingAssignments, studyStreak, assignmentCompletionRate }
// ---------------------------------------------------------------------------
const DEFAULT_OVERVIEW = {
  attendancePct: 0,
  pendingAssignments: 0,
  studyStreak: 0,
  assignmentCompletionRate: 0,
};

export async function getOverview() {
  const userId = await currentUserId();
  const c = client();
  // .maybeSingle() returns null on zero rows instead of throwing the
  // "Cannot coerce the result to a single JSON object" error that .single()
  // produces when the view happens to return no rows for this user
  // (e.g. before the User row is fully provisioned, or RLS hides it).
  const { data, error } = await c
    .from('analytics_overview')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return { ...DEFAULT_OVERVIEW };
  // Strip the user_id column from the response
  const { user_id, ...rest } = data;
  return { ...DEFAULT_OVERVIEW, ...rest };
}

// ---------------------------------------------------------------------------
// getAttendance(period) -> [{ date, present, absent, total }]
// ---------------------------------------------------------------------------
export async function getAttendance(period = '7d') {
  const userId = await currentUserId();
  const c = client();
  const { data, error } = await c
    .from('analytics_attendance')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });
  if (error) throw new Error(error.message);

  let days = 7;
  if (period === '30d') days = 30;
  // `semester` period would require looking up the semester start date;
  // for parity with the legacy, default to 7d if the start date is unavailable.
  const rows = (data || []).slice(-days);
  return rows.map((r) => ({
    date: r.date,
    present: r.present,
    absent: r.absent,
    total: r.total,
  }));
}

// ---------------------------------------------------------------------------
// getAssignments(period) -> [{ week, assigned, submitted, overdue }]
// ---------------------------------------------------------------------------
export async function getAssignments(period = '30d') {
  const userId = await currentUserId();
  const c = client();
  const { data, error } = await c
    .from('analytics_assignments')
    .select('*')
    .eq('user_id', userId)
    .order('week', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map((r) => ({
    week: r.week,
    assigned: r.assigned,
    submitted: r.submitted,
    overdue: r.overdue,
  }));
}

// ---------------------------------------------------------------------------
// getStudyHours() -> { daily: [{date, hours: 2}] }   (hardcoded placeholder)
// ---------------------------------------------------------------------------
export async function getStudyHours() {
  const today = new Date().toISOString().slice(0, 10);
  return { daily: [{ date: today, hours: 2 }] };
}

// ---------------------------------------------------------------------------
// getProductivity() -> { total, breakdown: { attendanceScore, assignmentScore, streakScore, notesScore } }
// ---------------------------------------------------------------------------
const DEFAULT_PRODUCTIVITY = {
  total: 0,
  breakdown: {
    attendanceScore: 0,
    assignmentScore: 0,
    streakScore: 0,
    notesScore: 0,
  },
};

export async function getProductivity() {
  const userId = await currentUserId();
  const c = client();
  const { data, error } = await c
    .from('analytics_productivity')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return JSON.parse(JSON.stringify(DEFAULT_PRODUCTIVITY));
  return {
    total: data.total ?? 0,
    breakdown: {
      attendanceScore: data.attendanceScore ?? 0,
      assignmentScore: data.assignmentScore ?? 0,
      streakScore: data.streakScore ?? 0,
      notesScore: data.notesScore ?? 0,
    },
  };
}

// ---------------------------------------------------------------------------
// getSubjects() -> [{ subject: {id, name}, modules, topicsCompleted, topicsTotal }]
// ---------------------------------------------------------------------------
export async function getSubjects() {
  const userId = await currentUserId();
  const c = client();
  const { data, error } = await c
    .from('analytics_subjects')
    .select('*')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return (data || []).map((r) => ({
    subject: { id: r.subject_id, name: r.subject_name },
    modules: r.modules,
    topicsCompleted: r.topicsCompleted,
    topicsTotal: r.topicsTotal,
  }));
}

const analyticsApi = {
  getOverview,
  overview: getOverview,
  getAttendance,
  attendance: getAttendance,
  getAssignments,
  assignments: getAssignments,
  getStudyHours,
  getProductivity,
  productivity: getProductivity,
  getSubjects,
  subjects: getSubjects,
};

export default analyticsApi;
