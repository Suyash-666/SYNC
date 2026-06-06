// ============================================================================
// src/middlewares/auth.middleware.js
//
// Verifies a Supabase Auth (GoTrue) access token. The token's `sub` claim
// becomes `req.user.id` and the rest of the user metadata is attached.
//
// The middleware accepts the token in two places:
//   1. `Authorization: Bearer <jwt>`         (used by the axios client)
//   2. `?access_token=<jwt>` query string    (used by Supabase Realtime /
//                                            WebSocket fallbacks; included
//                                            for symmetry with the socket
//                                            middleware in src/sockets/)
//
// Verification is done with the service-role client via getUser(jwt), which
// asks GoTrue "is this token valid for this user?". This avoids depending on
// the Supabase project's JWKS endpoint and is robust to key rotation.
// ============================================================================

const { supabaseAdmin } = require('../lib/supabase');
const ApiError = require('../utils/ApiError');

let cachedAdmin = null;
function admin() {
  if (cachedAdmin) return cachedAdmin;
  const c = supabaseAdmin();
  if (!c) throw new ApiError('Supabase admin client not configured', 500);
  cachedAdmin = c;
  return c;
}

async function resolveUserFromToken(token) {
  const c = admin();
  const { data, error } = await c.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

function extractToken(req) {
  const auth = req.headers?.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice('Bearer '.length).trim();
  if (req.query?.access_token) return String(req.query.access_token);
  return null;
}

async function required(req, res, next) {
  const token = extractToken(req);
  if (!token) return next(new ApiError('Authorization required', 401));
  const user = await resolveUserFromToken(token);
  if (!user) return next(new ApiError('Invalid token', 401));
  req.user = {
    id: user.id,
    email: user.email,
    role: user.app_metadata?.role || user.user_metadata?.role || 'STUDENT',
    full_name: user.user_metadata?.full_name || '',
    avatar_url: user.user_metadata?.avatar_url || '',
  };
  return next();
}

async function optional(req, res, next) {
  const token = extractToken(req);
  if (!token) return next();
  const user = await resolveUserFromToken(token);
  if (user) {
    req.user = {
      id: user.id,
      email: user.email,
      role: user.app_metadata?.role || user.user_metadata?.role || 'STUDENT',
      full_name: user.user_metadata?.full_name || '',
      avatar_url: user.user_metadata?.avatar_url || '',
    };
  }
  return next();
}

module.exports = { required, optional };
