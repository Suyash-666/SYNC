// ============================================================================
// src/api/semesters.api.legacy.js
// Pre-Checkpoint-5e implementation. Talks to the Node backend via axios.
// Selected when the 'crud' feature flag is OFF.
//
// Behavior is byte-for-byte identical to the file that lived at
// semesters.api.js before Checkpoint 5e.
// ============================================================================

import { apiClient } from './client';
import { unwrap } from './helpers';

export const getAll = async () => unwrap(await apiClient.get('/semesters'));

export const getById = async (id) => unwrap(await apiClient.get(`/semesters/${id}`));

export const create = async (payload) => unwrap(await apiClient.post('/semesters', payload));

export const update = async (id, payload) => unwrap(await apiClient.patch(`/semesters/${id}`, payload));

export const remove = async (id) => unwrap(await apiClient.delete(`/semesters/${id}`));

export const setCurrent = async (id) => unwrap(await apiClient.patch(`/semesters/${id}/set-current`));

const semestersApi = {
  getAll,
  getById,
  create,
  update,
  delete: remove,
  remove,
  setCurrent,
};

export default semestersApi;
