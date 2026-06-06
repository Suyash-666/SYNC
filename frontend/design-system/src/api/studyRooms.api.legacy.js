// ============================================================================
// src/api/studyRooms.api.legacy.js
// Pre-Checkpoint-6 implementation. Talks to the Node backend via axios.
// Selected when the 'study-rooms' feature flag is OFF.
// ============================================================================

import { apiClient } from './client';
import { unwrap } from './helpers';

export const getAll = async (params = {}) =>
  unwrap(await apiClient.get('/study-rooms', { params }));

export const getById = async (id) =>
  unwrap(await apiClient.get(`/study-rooms/${id}`));

export const create = async (payload) =>
  unwrap(await apiClient.post('/study-rooms', payload));

export const join = async (id) =>
  unwrap(await apiClient.post(`/study-rooms/${id}/join`));

export const leave = async (id) =>
  unwrap(await apiClient.post(`/study-rooms/${id}/leave`));

export const remove = async (id) =>
  unwrap(await apiClient.delete(`/study-rooms/${id}`));

// --- Invites ---------------------------------------------------------------
// Owner-only: create / list / revoke.  Preview + redeem are auth-only,
// no membership required.

export const createInvite = async (roomId, payload = {}) =>
  unwrap(await apiClient.post(`/study-rooms/${roomId}/invites`, payload));

export const listInvites = async (roomId) =>
  unwrap(await apiClient.get(`/study-rooms/${roomId}/invites`));

export const revokeInvite = async (roomId, inviteId) =>
  unwrap(await apiClient.delete(`/study-rooms/${roomId}/invites/${inviteId}`));

export const previewInvite = async (code) =>
  unwrap(await apiClient.get(`/study-rooms/invites/${code}/preview`));

export const redeemInvite = async (code) =>
  unwrap(await apiClient.post(`/study-rooms/invites/${code}/redeem`));

const studyRoomsApi = {
  getAll,
  getById,
  create,
  join,
  leave,
  delete: remove,
  remove,
  // invites
  createInvite,
  listInvites,
  revokeInvite,
  previewInvite,
  redeemInvite,
};

export default studyRoomsApi;
