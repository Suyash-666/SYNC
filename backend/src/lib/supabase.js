// ============================================================================
// src/lib/supabase.js
// Thin factory module for the two Supabase clients the Node service needs.
//
//   supabaseAdmin     - service-role key; bypasses RLS.  Use ONLY for:
//                        * AI study-plan context assembly (Checkpoint 7)
//                        * Study-room membership lookups by socket handler
//                          (Checkpoint 6)
//                        * Any operation that explicitly needs to act on
//                          behalf of a user.
//   createUserClient  - per-request client built with the caller's access
//                        token.  Honours RLS.  Use this for everything else.
//
// This module is purely additive: it does not import or replace any existing
// file.  Existing controllers, services, and repositories keep using Prisma.
// ============================================================================

const { createClient } = require('@supabase/supabase-js');
const {
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  SUPABASE_KEY,
} = require('../config/env');

// Service-role key.  Prefer the new name; fall back to legacy SUPABASE_KEY
// (which the storage service already uses).
const SERVICE_KEY = SUPABASE_SERVICE_KEY || SUPABASE_KEY;

let adminClient = null;

/**
 * Service-role Supabase client.  Bypasses RLS.  Never expose to the network.
 * Returns null if Supabase is not configured — callers must handle this.
 */
function supabaseAdmin() {
  if (!SUPABASE_URL || !SERVICE_KEY) return null;
  if (!adminClient) {
    adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}

/**
 * Per-request client.  The access token is the caller's Supabase JWT
 * (after Checkpoint 2).  RLS applies.  We do not cache this client because
 * each request may carry a different token.
 *
 * @param {string} accessToken - Supabase user access token (Bearer)
 */
function createUserClient(accessToken) {
  if (!SUPABASE_URL || !SERVICE_KEY) return null;
  if (!accessToken) return null;
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}

module.exports = { supabaseAdmin, createUserClient };
