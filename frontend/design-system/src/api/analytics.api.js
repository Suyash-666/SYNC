import { apiClient } from './client';
import { unwrap } from './helpers';

export const analyticsApi = {
  getOverview: async () => unwrap(await apiClient.get('/analytics/overview')),
  getAttendance: async (period = '7d') => unwrap(await apiClient.get('/analytics/attendance', { params: { period } })),
  getAssignments: async (period = '30d') => unwrap(await apiClient.get('/analytics/assignments', { params: { period } })),
  getStudyHours: async () => unwrap(await apiClient.get('/analytics/study-hours')),
  getProductivity: async () => unwrap(await apiClient.get('/analytics/productivity')),
  getSubjects: async () => unwrap(await apiClient.get('/analytics/subjects')),
};

// backward-compatibility aliases
analyticsApi.overview = analyticsApi.getOverview;
analyticsApi.attendance = analyticsApi.getAttendance;
analyticsApi.assignments = analyticsApi.getAssignments;
analyticsApi.productivity = analyticsApi.getProductivity;
analyticsApi.subjects = analyticsApi.getSubjects;

export default analyticsApi;
