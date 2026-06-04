import { apiClient } from './client';
import { unwrap } from './helpers';

export const attendanceApi = {
  getBySubject: async (subjectId, params = {}) => unwrap(await apiClient.get(`/subjects/${subjectId}/attendance`, { params })),
  mark: async (subjectId, payload) => unwrap(await apiClient.post(`/subjects/${subjectId}/attendance`, payload)),
  update: async (subjectId, date, payload) => unwrap(await apiClient.put(`/subjects/${subjectId}/attendance/${date}`, payload)),
  getSummary: async () => unwrap(await apiClient.get('/users/attendance/summary')),
};

// backward-compatibility alias
attendanceApi.get = attendanceApi.getBySubject;
attendanceApi.create = attendanceApi.mark;

export default attendanceApi;
