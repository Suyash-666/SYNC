// ============================================================================
// src/api/subjects.api.legacy.js
// Pre-Checkpoint-5d implementation. Talks to the Node backend via axios.
// Selected when the 'crud' feature flag is OFF.
//
// Behavior is byte-for-byte identical to the file that lived at
// subjects.api.js before Checkpoint 5d.
// ============================================================================

import { apiClient } from './client';
import { unwrap } from './helpers';

export const getBySemester = async (semesterId) =>
  unwrap(await apiClient.get(`/semesters/${semesterId}/subjects`));

export const getById = async (id) =>
  unwrap(await apiClient.get(`/subjects/${id}`));

export const create = async (semesterId, payload) =>
  unwrap(await apiClient.post(`/semesters/${semesterId}/subjects`, payload));

export const update = async (id, payload) =>
  unwrap(await apiClient.patch(`/subjects/${id}`, payload));

export const remove = async (id) =>
  unwrap(await apiClient.delete(`/subjects/${id}`));

export const addModule = async (subjectId, payload) =>
  unwrap(await apiClient.post(`/subjects/${subjectId}/modules`, payload));

export const updateModule = async (subjectId, moduleId, payload) =>
  unwrap(await apiClient.patch(`/subjects/${subjectId}/modules/${moduleId}`, payload));

export const deleteModule = async (subjectId, moduleId) =>
  unwrap(await apiClient.delete(`/subjects/${subjectId}/modules/${moduleId}`));

export const toggleTopic = async (subjectId, topicId) =>
  unwrap(await apiClient.patch(`/subjects/${subjectId}/topics/${topicId}/toggle`));

const subjectsApi = {
  getBySemester,
  listBySemester: getBySemester,
  getById,
  create,
  update,
  delete: remove,
  remove,
  addModule,
  updateModule,
  deleteModule,
  removeModule: deleteModule,
  toggleTopic,
};

export default subjectsApi;
