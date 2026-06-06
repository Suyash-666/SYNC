// ============================================================================
// src/api/studyRooms.api.supabase.js
// Supabase-backed implementation of the studyRoomsApi interface.
//
// Activated when VITE_USE_SUPABASE=study-rooms (or 'all'). See featureFlags.js.
// Socket.IO is unchanged; the legacy /study-rooms namespace continues
// to broadcast new messages. The Node socket handler reads/writes
// Supabase via the service-role client.
// ============================================================================

import { getSupabaseForUser, getSupabaseAccessToken } from '../lib/supabase';
import legacy from './studyRooms.api.legacy';

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
// getAll(params) -> StudyRoom[]
// Returns only rooms the caller is a member of. The owner's membership is
// created on room create, so owner-rooms are included. Rooms you only
// have an invite for are not listed until you redeem.
// ---------------------------------------------------------------------------
export async function getAll(params = {}) {
  const c = client();
  const userId = await currentUserId();
  // Two-step query: list the user's memberships, then fetch the rooms
  // they point at. We can't join Membership->Room in a single select
  // because the RLS policies may differ; doing two reads keeps the
  // logic obvious and works under RLS.
  const { data: mems, error: mErr } = await c
    .from('StudyRoomMembership')
    .select('room_id')
    .eq('user_id', userId);
  if (mErr) throw new Error(mErr.message);
  const ids = (mems || []).map((m) => m.room_id).filter(Boolean);
  if (ids.length === 0) return [];

  let query = c
    .from('StudyRoom')
    .select('*')
    .in('id', ids)
    .order('created_at', { ascending: false });
  if (params.active !== undefined) query = query.eq('is_active', String(params.active) === 'true');
  else query = query.eq('is_active', true);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

// ---------------------------------------------------------------------------
// getById(id) -> { ...room, members[] }
//   Matches the legacy merged shape: members are attached to the room.
// ---------------------------------------------------------------------------
export async function getById(id) {
  const c = client();
  const roomRes = await c
    .from('StudyRoom')
    .select('*')
    .eq('id', id)
    .single();
  if (roomRes.error) throw new Error(roomRes.error.message);

  const memberRes = await c
    .from('StudyRoomMembership')
    .select('*')
    .eq('room_id', id);
  if (memberRes.error) throw new Error(memberRes.error.message);

  return { ...roomRes.data, members: memberRes.data || [] };
}

// ---------------------------------------------------------------------------
// create(payload) -> StudyRoom row
// ---------------------------------------------------------------------------
export async function create(payload = {}) {
  const userId = await currentUserId();
  const c = client();
  const row = {
    name: payload.name,
    subject_tag: payload.subject_tag || null,
    created_by_id: userId,
    is_active: true,
  };
  const { data, error } = await c
    .from('StudyRoom')
    .insert(row)
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  // The legacy creates the room AND adds the creator as a member.
  // Replicate via a second insert.  Failure here is non-fatal for the
  // response — the socket layer can still let the user join.
  try {
    await c.from('StudyRoomMembership').insert({ room_id: data.id, user_id: userId });
  } catch (_) {}

  return data;
}

// ---------------------------------------------------------------------------
// join(id)
//   Upsert a membership row.  RLS ensures user_id = auth.uid().
// ---------------------------------------------------------------------------
export async function join(id) {
  const userId = await currentUserId();
  const c = client();
  const { error } = await c
    .from('StudyRoomMembership')
    .upsert(
      { room_id: id, user_id: userId },
      { onConflict: 'room_id,user_id' }
    );
  if (error) throw new Error(error.message);
  return null;
}

// ---------------------------------------------------------------------------
// leave(id)
// ---------------------------------------------------------------------------
export async function leave(id) {
  const userId = await currentUserId();
  const c = client();
  const { error } = await c
    .from('StudyRoomMembership')
    .delete()
    .eq('room_id', id)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return null;
}

// ---------------------------------------------------------------------------
// delete(id)  — only the creator can delete (RLS enforces it)
// ---------------------------------------------------------------------------
export async function remove(id) {
  const c = client();
  const { error } = await c
    .from('StudyRoom')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  return null;
}

// --- Invites ---------------------------------------------------------------
// The StudyRoomInvite table exists in Supabase, but RLS policies + an
// edge-function-style "owner-only" check haven't been written yet. To keep
// the invite UI working today we route these calls through the Node
// backend (which already enforces ownership server-side). When Supabase
// RLS is added, replace these with direct supabase.from('StudyRoomInvite')
// calls without touching the facade or UI.
const createInvite  = (roomId, payload) => legacy.createInvite(roomId, payload);
const listInvites   = (roomId)         => legacy.listInvites(roomId);
const revokeInvite  = (roomId, id)     => legacy.revokeInvite(roomId, id);
const previewInvite = (code)           => legacy.previewInvite(code);
const redeemInvite  = (code)           => legacy.redeemInvite(code);

const studyRoomsApi = {
  getAll,
  getById,
  create,
  join,
  leave,
  delete: remove,
  remove,
  // invites (routed through the legacy backend)
  createInvite,
  listInvites,
  revokeInvite,
  previewInvite,
  redeemInvite,
};

export default studyRoomsApi;
