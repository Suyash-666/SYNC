// ============================================================================
// src/api/attendance.api.legacy.js
// Pre-Checkpoint-5c implementation. Talks to the Node backend via axios.
// Selected when the 'crud' feature flag is OFF.
//
// Behavior is byte-for-byte identical to the file that lived at
// attendance.api.js before Checkpoint 5c.
// ============================================================================

import { apiClient } from './client';
import { unwrap } from './helpers';

export const getBySubject = async (subjectId, params = {}) =>
  unwrap(await apiClient.get(`/subjects/${subjectId}/attendance`, { params }));

export const mark = async (subjectId, payload) =>
  unwrap(await apiClient.post(`/subjects/${subjectId}/attendance`, payload));

export const update = async (subjectId, date, payload) =>
  unwrap(await apiClient.put(`/subjects/${subjectId}/attendance/${date}`, payload));

export const getSummary = async () =>
  unwrap(await apiClient.get('/users/attendance/summary'));

const attendanceApi = {
  getBySubject,
  get: getBySubject,
  mark,
  create: mark,
  update,
  getSummary,
};

export default attendanceApi;
