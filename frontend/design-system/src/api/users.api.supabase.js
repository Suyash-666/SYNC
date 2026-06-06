// ============================================================================
// src/api/users.api.supabase.js
// Supabase-backed implementation of the usersApi interface.
//
// Activated when VITE_USE_SUPABASE=crud (or 'all'). See featureFlags.js.
// The `onboarding` method is intentionally left pointing at the legacy
// backend (it's a separate path from `onboardingApi.submit` and is
// unused per the current consumer audit).
// ============================================================================

import { getSupabaseForUser, getSupabaseAccessToken } from '../lib/supabase';
import { apiClient } from './client';
import { unwrap } from './helpers';

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
// getProfile() -> User row
// ---------------------------------------------------------------------------
export async function getProfile() {
  const userId = await currentUserId();
  const c = client();
  const { data, error } = await c
    .from('User')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ---------------------------------------------------------------------------
// updateProfile(payload) -> User row
//
// Defensive against silent RLS rejection: the User table is gated by a
// `user_update_own` policy that resolves the caller's id via
// public.current_app_user_id(). If the indirection table is stale (or
// RLS is otherwise broken), PostgREST returns the *intended* row from
// `RETURNING` even when 0 rows were actually updated, and the call
// appears to succeed — a classic Supabase trap.
//
// We now ask for an exact count and bail with a clear error if no
// row was updated. The user sees "Failed to save profile" instead of
// a silent no-op.
// ---------------------------------------------------------------------------
export async function updateProfile(payload = {}) {
  const userId = await currentUserId();
  const c = client();
  const row = {};
  if ('full_name' in payload) row.full_name = payload.full_name;
  if ('avatar_url' in payload) row.avatar_url = payload.avatar_url;
  if ('college' in payload) row.college = payload.college;
  if ('degree' in payload) row.degree = payload.degree;
  if ('total_semesters' in payload) row.total_semesters = payload.total_semesters;

  const { data, error, count } = await c
    .from('User')
    .update(row)
    .eq('id', userId)
    .select('*', { count: 'exact' })
    .single();
  if (error) throw new Error(error.message);
  if (count === 0) {
    throw new Error(
      'Profile save was blocked by a row-level security policy. ' +
      'The public.app_user_id indirection is out of sync with auth.users — ' +
      'run supabase/migrations/0016_rebuild_app_user_id_indirection.sql.',
    );
  }
  return data;
}

// ---------------------------------------------------------------------------
// deleteAccount()  — soft delete via is_active=false (matches legacy)
// ---------------------------------------------------------------------------
export async function deleteAccount() {
  const userId = await currentUserId();
  const c = client();
  const { error } = await c
    .from('User')
    .update({ is_active: false })
    .eq('id', userId);
  if (error) throw new Error(error.message);
  return null;
}

// ---------------------------------------------------------------------------
// onboarding()  — legacy only (separate path from onboardingApi.submit;
// see Checkpoint 7 plan §"usersApi.onboarding")
// ---------------------------------------------------------------------------
export const onboarding = async (payload) =>
  unwrap(await apiClient.post('/users/onboarding', payload));

const usersApi = {
  getProfile,
  updateProfile,
  deleteAccount,
  onboarding,
};

export default usersApi;
