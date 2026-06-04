import { apiClient } from './client';
import { unwrap } from './helpers';

export const onboardingApi = {
  submit: async (payload) => unwrap(await apiClient.post('/users/onboarding', payload)),
};

export default onboardingApi;
