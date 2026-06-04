import { apiClient } from './client';
import { unwrap } from './helpers';

export const subjectsApi = {
  getBySemester: async (semesterId) => unwrap(await apiClient.get(`/semesters/${semesterId}/subjects`)),
  getById: async (id) => unwrap(await apiClient.get(`/subjects/${id}`)),
  create: async (semesterId, payload) => unwrap(await apiClient.post(`/semesters/${semesterId}/subjects`, payload)),
  update: async (id, payload) => unwrap(await apiClient.patch(`/subjects/${id}`, payload)),
  delete: async (id) => unwrap(await apiClient.delete(`/subjects/${id}`)),
  addModule: async (subjectId, payload) => unwrap(await apiClient.post(`/subjects/${subjectId}/modules`, payload)),
  updateModule: async (subjectId, moduleId, payload) => unwrap(await apiClient.patch(`/subjects/${subjectId}/modules/${moduleId}`, payload)),
  deleteModule: async (subjectId, moduleId) => unwrap(await apiClient.delete(`/subjects/${subjectId}/modules/${moduleId}`)),
  toggleTopic: async (subjectId, topicId) => unwrap(await apiClient.patch(`/subjects/${subjectId}/topics/${topicId}/toggle`)),
};

// backward-compatibility aliases
subjectsApi.listBySemester = subjectsApi.getBySemester;
subjectsApi.remove = subjectsApi.delete;
subjectsApi.removeModule = subjectsApi.deleteModule;

export default subjectsApi;
