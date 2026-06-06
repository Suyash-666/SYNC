// ============================================================================
// src/lib/supabase.js
// Centralized Supabase client factory. Used by every Checkpoint-3+ feature
// that talks to Supabase directly from the browser.
//
//   getSupabase()             - persistent anon client. Used for things that
//                               don't need a user JWT (bucket existence
//                               checks, public reads). For most code, use
//                               the user-scoped variant below.
//   getSupabaseForUser(token) - per-request client with the user's access
//                               token. RLS applies.
//   getSupabaseAccessToken()  - reads the current user's access token from
//                               the Redux auth slice. Returns null if not
//                               signed in.
//
// This module is purely additive: it does not modify or replace any
// existing file. Existing API modules and hooks keep working as-is until
// their Checkpoint migrates them.
// ============================================================================

import { createClient } from '@supabase/supabase-js';

let anonClient = null;

const URL = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

function ensureUrl() {
  if (!URL || !ANON) {
    throw new Error(
      'Supabase env not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/design-system/.env'
    );
  }
}

/**
 * Persistent anon client. Use sparingly; prefer getSupabaseForUser().
 */
export function getSupabase() {
  if (anonClient) return anonClient;
  ensureUrl();
  anonClient = createClient(URL, ANON, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return anonClient;
}

/**
 * Per-request user-scoped client. The Authorization header carries the
 * caller's access token so RLS policies apply.
 *
 * @param {string} accessToken - Supabase access token (e.g. from Redux)
 */
export function getSupabaseForUser(accessToken) {
  if (!accessToken) return null;
  ensureUrl();
  return createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}

/**
 * Read the current access token from the Redux auth slice. Returns null if
 * no user is signed in.
 *
 * This module does not import the store directly to avoid a circular
 * dependency: supabase.js may be required by api modules that the store
 * also imports. Instead, callers either pass the token explicitly or use
 * the lazy-initialized bridge set up in src/lib/supabaseStoreBridge.js.
 */
export function getSupabaseAccessToken() {
  // Imported lazily so this file has no static dependency on the store.
  // See src/lib/supabaseStoreBridge.js for the bridge.
  return bridgeGetToken ? bridgeGetToken() : null;
}

let bridgeGetToken = null;

/**
 * Wire this file to the Redux store. Called once from src/store/index.js
 * (and any future store location). The bridge is read by
 * getSupabaseAccessToken().
 */
export function bindSupabaseStore(getToken) {
  bridgeGetToken = typeof getToken === 'function' ? getToken : null;
}
