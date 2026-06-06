// ============================================================================
// src/sockets/auth.socket.js
//
// Verifies a Supabase Auth (GoTrue) access token on the socket handshake.
// Replaces the legacy HS256 JWT verification that lived here before.
// ============================================================================

const { supabaseAdmin } = require('../lib/supabase');

let cachedAdmin = null;
function admin() {
  if (cachedAdmin) return cachedAdmin;
  cachedAdmin = supabaseAdmin();
  if (!cachedAdmin) throw new Error('Supabase admin client not configured');
  return cachedAdmin;
}

async function authSocket(socket, next) {
  try {
    const token = socket.handshake?.auth?.token;
    if (!token) return next(new Error('Authentication error: token required'));
    const c = admin();
    const { data, error } = await c.auth.getUser(token);
    if (error || !data?.user) return next(new Error('Authentication error'));
    const u = data.user;
    socket.user = {
      id: u.id,
      email: u.email,
      role: u.app_metadata?.role || u.user_metadata?.role || 'STUDENT',
      full_name: u.user_metadata?.full_name || '',
      avatar_url: u.user_metadata?.avatar_url || '',
    };
    return next();
  } catch (err) {
    return next(new Error('Authentication error'));
  }
}

module.exports = authSocket;
