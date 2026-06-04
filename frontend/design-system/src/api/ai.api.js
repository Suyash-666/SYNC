import { apiClient } from './client';
import { unwrap } from './helpers';

export const aiApi = {
  chat: async (payload) => unwrap(await apiClient.post('/ai/chat', payload)),
  getHistory: async () => unwrap(await apiClient.get('/ai/history')),
  getConversation: async (conversationId) => unwrap(await apiClient.get(`/ai/history/${conversationId}`)),
  deleteConversation: async (conversationId) => unwrap(await apiClient.delete(`/ai/history/${conversationId}`)),
  generateStudyPlan: async (payload) => unwrap(await apiClient.post('/ai/study-plan', payload)),
};

// backward-compatibility aliases
aiApi.history = aiApi.getHistory;
aiApi.historyById = aiApi.getConversation;
aiApi.removeHistory = aiApi.deleteConversation;
aiApi.studyPlan = aiApi.generateStudyPlan;

export default aiApi;
