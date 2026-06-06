// ============================================================================
// src/api/notes.api.legacy.js
// Pre-Checkpoint-5b implementation. Talks to the Node backend via axios.
// Selected when the 'crud' feature flag is OFF.
//
// Behavior is byte-for-byte identical to the file that lived at
// notes.api.js before Checkpoint 5b.
// ============================================================================

import { apiClient } from './client';
import { unwrap } from './helpers';

export const getAll = async (params = {}) => unwrap(await apiClient.get('/notes', { params }));
export const getById = async (id) => unwrap(await apiClient.get(`/notes/${id}`));
export const create = async (payload) => unwrap(await apiClient.post('/notes', payload));
export const update = async (id, payload) => unwrap(await apiClient.patch(`/notes/${id}`, payload));
export const remove = async (id) => unwrap(await apiClient.delete(`/notes/${id}`));
export const getFolders = async () => unwrap(await apiClient.get('/notes/folders'));

const notesApi = {
  getAll,
  getById,
  create,
  update,
  delete: remove,
  remove,
  getFolders,
  folders: getFolders,
};

export default notesApi;
