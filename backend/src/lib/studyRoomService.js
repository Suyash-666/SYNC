// ============================================================================
// backend/src/lib/studyRoomService.js
// Service-role helper for the study-room socket handler.
//
// All functions use the Supabase admin client (which bypasses RLS) —
// the handler is responsible for any auth checks it needs.
// The /study-rooms socket is authenticated via the legacy JWT (see
// backend/src/sockets/auth.socket.js), so the user id is known.
// ============================================================================

const { supabaseAdmin } = require('./supabase');

function admin() {
  const c = supabaseAdmin();
  if (!c) {
    throw new Error('Supabase admin client not configured');
  }
  return c;
}

async function findRoom(roomId) {
  const c = admin();
  const { data, error } = await c
    .from('StudyRoom')
    .select('*')
    .eq('id', roomId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data || null;
}

async function findMembership(roomId, userId) {
  const c = admin();
  const { data, error } = await c
    .from('StudyRoomMembership')
    .select('*')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data || null;
}

async function listMembers(roomId) {
  const c = admin();
  // The frontend renders members via `member.user.full_name` / `email`.
  // We need the `User` join in the same query, not a separate round-trip.
  // Supabase PostgREST supports nested selects: `User:user_id(...)` exposes
  // the joined row under the `User` key — we then re-key it to `user` to
  // match the mappers.
  const { data, error } = await c
    .from('StudyRoomMembership')
    .select('id, room_id, user_id, joined_at, User:user_id ( id, email, full_name, avatar_url )')
    .eq('room_id', roomId);
  if (error) throw new Error(error.message);
  return (data || []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    joined_at: row.joined_at,
    user: row.User || null,
  }));
}

async function listRecentMessages(roomId, limit = 50) {
  const c = admin();
  const { data, error } = await c
    .from('StudyRoomMessage')
    .select('id, room_id, user_id, content, created_at, User:user_id ( id, full_name, avatar_url )')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data || []).reverse().map((row) => ({
    id: row.id,
    room_id: row.room_id,
    user_id: row.user_id,
    content: row.content,
    created_at: row.created_at,
    user: row.User || null,
  }));
}

async function insertMessage(roomId, userId, content) {
  const c = admin();
  const { data, error } = await c
    .from('StudyRoomMessage')
    .insert({ room_id: roomId, user_id: userId, content })
    .select('id, room_id, user_id, content, created_at, User:user_id ( id, full_name, avatar_url )')
    .single();
  if (error) throw new Error(error.message);
  return {
    id: data.id,
    room_id: data.room_id,
    user_id: data.user_id,
    content: data.content,
    created_at: data.created_at,
    user: data.User || null,
  };
}

async function findUser(userId) {
  const c = admin();
  const { data, error } = await c
    .from('User')
    .select('id, full_name, avatar_url')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data || null;
}

module.exports = {
  findRoom,
  findMembership,
  listMembers,
  listRecentMessages,
  insertMessage,
  findUser,
};
