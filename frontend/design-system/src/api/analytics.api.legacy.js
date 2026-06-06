// ============================================================================
// src/api/analytics.api.legacy.js
// Pre-Checkpoint-7 implementation. Talks to the Node backend via axios.
// Selected when the 'analytics' feature flag is OFF.
// ============================================================================

import { apiClient } from './client';
import { unwrap } from './helpers';

export const getOverview = async () => unwrap(await apiClient.get('/analytics/overview'));
export const getAttendance = async (period = '7d') => unwrap(await apiClient.get('/analytics/attendance', { params: { period } }));
export const getAssignments = async (period = '30d') => unwrap(await apiClient.get('/analytics/assignments', { params: { period } }));
export const getStudyHours = async () => unwrap(await apiClient.get('/analytics/study-hours'));
export const getProductivity = async () => unwrap(await apiClient.get('/analytics/productivity'));
export const getSubjects = async () => unwrap(await apiClient.get('/analytics/subjects'));

const analyticsApi = {
  getOverview,
  overview: getOverview,
  getAttendance,
  attendance: getAttendance,
  getAssignments,
  assignments: getAssignments,
  getStudyHours,
  getProductivity,
  productivity: getProductivity,
  getSubjects,
  subjects: getSubjects,
};

export default analyticsApi;
