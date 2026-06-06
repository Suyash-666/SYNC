// ============================================================================
// src/api/studyRooms.api.js
// Facade: picks the legacy or Supabase-backed implementation based on the
// 'study-rooms' feature flag. When VITE_USE_SUPABASE is unset / empty /
// 0 / false, the legacy default below is used and behavior is byte-for-
// byte identical to before Checkpoint 6.
// ============================================================================

import { isEnabled } from '../lib/featureFlags';
import legacy from './studyRooms.api.legacy';
import supabaseImpl from './studyRooms.api.supabase';

const useSupabase = isEnabled('study-rooms');

export const studyRoomsApi = useSupabase ? supabaseImpl : legacy;

export const getAll = studyRoomsApi.getAll;
export const getById = studyRoomsApi.getById;
export const create = studyRoomsApi.create;
export const join = studyRoomsApi.join;
export const leave = studyRoomsApi.leave;
export const deleteRoom = studyRoomsApi.delete;
export const remove = studyRoomsApi.remove;

// Invite helpers — only the legacy backend has the dedicated endpoints
// today. The Supabase implementation is intentionally a no-op stub so the
// facade still exports them; the UI gracefully hides invite features when
// the Supabase variant is active and these throw "Not implemented".
export const createInvite = studyRoomsApi.createInvite;
export const listInvites = studyRoomsApi.listInvites;
export const revokeInvite = studyRoomsApi.revokeInvite;
export const previewInvite = studyRoomsApi.previewInvite;
export const redeemInvite = studyRoomsApi.redeemInvite;

export default studyRoomsApi;
