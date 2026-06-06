// ============================================================================
// src/api/resources.api.legacy.js
// Pre-Checkpoint-3 implementation. Talks to the Node backend
// (POST /api/v1/resources/upload, etc.) via axios. Selected when the
// 'storage' feature flag is OFF.
//
// Behavior is byte-for-byte identical to the file that lived at
// resources.api.js before Checkpoint 3.
// ============================================================================

import { apiClient } from './client';
import { unwrap } from './helpers';

export const getAll = async (params = {}) => unwrap(await apiClient.get('/resources', { params }));

export const upload = async ({ file, title, subject_id }) => {
  const formData = new FormData();
  formData.append('file', file);
  if (title) formData.append('title', title);
  if (subject_id) formData.append('subject_id', subject_id);
  return unwrap(await apiClient.post('/resources/upload', formData));
};

export const addLink = async (payload) => unwrap(await apiClient.post('/resources/link', payload));

export const link = addLink;

export const deleteResource = async (id) => unwrap(await apiClient.delete(`/resources/${id}`));

export const remove = deleteResource;

const resourcesApi = {
  getAll,
  upload,
  addLink,
  link,
  delete: deleteResource,
  remove,
};

export default resourcesApi;
