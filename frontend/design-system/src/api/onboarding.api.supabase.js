// ============================================================================
// src/api/onboarding.api.supabase.js
// Supabase-backed implementation of the onboardingApi interface.
//
// Calls the `onboard_user` RPC created in
// supabase/migrations/0006_onboard_user_rpc.sql.
//
// Activated when VITE_USE_SUPABASE=crud (or 'all'). See featureFlags.js.
// ============================================================================

import { getSupabaseForUser, getSupabaseAccessToken } from '../lib/supabase';

export async function submit(payload = {}) {
  const token = getSupabaseAccessToken();
  const c = getSupabaseForUser(token);
  if (!c) throw new Error('Not signed in');

  const { data, error } = await c.rpc('onboard_user', { payload });
  if (error) throw new Error(error.message);
  return data || null;
}

const onboardingApi = { submit };

export default onboardingApi;
