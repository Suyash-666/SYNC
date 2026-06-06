// ============================================================================
// src/api/assignments.api.legacy.js
// Pre-Checkpoint-5a implementation. Talks to the Node backend via axios.
// Selected when the 'crud' feature flag is OFF.
//
// Behavior is byte-for-byte identical to the file that lived at
// assignments.api.js before Checkpoint 5a.
// ============================================================================

import { apiClient } from './client';
import { unwrap } from './helpers';

export const getAll = async (params = {}) =>
  unwrap(await apiClient.get('/assignments', { params }));

export const getById = async (id) =>
  unwrap(await apiClient.get(`/assignments/${id}`));

export const create = async (payload) =>
  unwrap(await apiClient.post('/assignments', payload));

export const update = async (id, payload) =>
  unwrap(await apiClient.patch(`/assignments/${id}`, payload));

export const remove = async (id) =>
  unwrap(await apiClient.delete(`/assignments/${id}`));

export const updateStatus = async (id, payload) =>
  unwrap(await apiClient.patch(`/assignments/${id}/status`, payload));

const assignmentsApi = {
  getAll,
  getById,
  create,
  update,
  delete: remove,
  updateStatus,
};

export default assignmentsApi;
