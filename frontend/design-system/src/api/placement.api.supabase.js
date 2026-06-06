// ============================================================================
// src/api/placement.api.supabase.js
// Supabase-backed implementation of the placementApi interface.
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

async function currentUserId() {
  const c = client();
  const { data: { user } } = await c.auth.getUser();
  if (!user) throw new Error('Not signed in');
  return user.id;
}

// ---------------------------------------------------------------------------
// getProgress(params) -> PlacementProgress[]
// ---------------------------------------------------------------------------
export async function getProgress(params = {}) {
  const c = client();
  let query = c
    .from('PlacementProgress')
    .select('*')
    .order('created_at', { ascending: false });

  if (params.category) query = query.eq('category', params.category);
  if (params.status) query = query.eq('status', params.status);
  if (params.topic) query = query.eq('topic', params.topic);
  if (params.difficulty) query = query.eq('difficulty', params.difficulty);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

// ---------------------------------------------------------------------------
// addItem(payload) -> PlacementProgress row
// ---------------------------------------------------------------------------
export async function addItem(payload = {}) {
  const userId = await currentUserId();
  const c = client();
  const row = {
    user_id: userId,
    category: payload.category,
    topic: payload.topic,
    item_name: payload.item_name,
    status: payload.status || 'NOT_STARTED',
    difficulty: payload.difficulty || null,
    notes: payload.notes || null,
  };
  const { data, error } = await c
    .from('PlacementProgress')
    .insert(row)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ---------------------------------------------------------------------------
// updateItem(id, payload) -> PlacementProgress row
// ---------------------------------------------------------------------------
export async function updateItem(id, payload = {}) {
  const c = client();
  const row = {};
  if ('category' in payload) row.category = payload.category;
  if ('topic' in payload) row.topic = payload.topic;
  if ('item_name' in payload) row.item_name = payload.item_name;
  if ('status' in payload) row.status = payload.status;
  if ('difficulty' in payload) row.difficulty = payload.difficulty;
  if ('notes' in payload) row.notes = payload.notes;

  const { data, error } = await c
    .from('PlacementProgress')
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
    .from('PlacementProgress')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  return null;
}

// ---------------------------------------------------------------------------
// getStats() -> { perCategory, dsaDifficulty }
//   Replicates placement.repository.statsByCategory
//   (N+1: 4 categories × 3 status counts + 1 groupBy on DSA difficulty).
// ---------------------------------------------------------------------------
export async function getStats() {
  const userId = await currentUserId();
  const c = client();
  const categories = ['DSA', 'INTERVIEW', 'APTITUDE', 'RESUME'];

  const perCategory = [];
  for (const cat of categories) {
    const base = c.from('PlacementProgress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('category', cat);
    const totalRes = await base;
    if (totalRes.error) throw new Error(totalRes.error.message);
    const total = totalRes.count ?? 0;

    const completedRes = await c.from('PlacementProgress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('category', cat)
      .eq('status', 'COMPLETED');
    if (completedRes.error) throw new Error(completedRes.error.message);
    const completed = completedRes.count ?? 0;

    const inProgressRes = await c.from('PlacementProgress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('category', cat)
      .eq('status', 'IN_PROGRESS');
    if (inProgressRes.error) throw new Error(inProgressRes.error.message);
    const inProgress = inProgressRes.count ?? 0;

    const notStartedRes = await c.from('PlacementProgress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('category', cat)
      .eq('status', 'NOT_STARTED');
    if (notStartedRes.error) throw new Error(notStartedRes.error.message);
    const notStarted = notStartedRes.count ?? 0;

    const completionPct = total === 0 ? 0 : Math.round((completed / total) * 100);
    perCategory.push({ category: cat, total, completed, inProgress, notStarted, completionPct });
  }

  // DSA difficulty breakdown — Prisma's groupBy equivalent
  // PostgREST doesn't have groupBy; we pull all DSA rows and aggregate client-side.
  const dsaRowsRes = await c
    .from('PlacementProgress')
    .select('difficulty')
    .eq('user_id', userId)
    .eq('category', 'DSA');
  if (dsaRowsRes.error) throw new Error(dsaRowsRes.error.message);

  const diffCounts = new Map();
  for (const r of dsaRowsRes.data || []) {
    if (!r.difficulty) continue;
    diffCounts.set(r.difficulty, (diffCounts.get(r.difficulty) || 0) + 1);
  }
  const dsaDifficulty = Array.from(diffCounts.entries()).map(([difficulty, count]) => ({
    difficulty,
    _count: { _all: count },
  }));

  return { perCategory, dsaDifficulty };
}

// ---------------------------------------------------------------------------
// addDsaProblem(payload) — sugar for addItem with category='DSA'
// ---------------------------------------------------------------------------
export async function addDsaProblem(payload = {}) {
  return addItem({ ...payload, category: 'DSA' });
}

// ---------------------------------------------------------------------------
// getDsaProblems(params) — sugar for getProgress with category='DSA'
// ---------------------------------------------------------------------------
export async function getDsaProblems(params = {}) {
  return getProgress({ ...params, category: 'DSA' });
}

const placementApi = {
  getProgress,
  progress: getProgress,
  addItem,
  createProgress: addItem,
  updateItem,
  updateProgress: updateItem,
  delete: remove,
  removeProgress: remove,
  getStats,
  stats: getStats,
  addDsaProblem,
  createDsa: addDsaProblem,
  getDsaProblems,
  listDsa: getDsaProblems,
};

export default placementApi;
