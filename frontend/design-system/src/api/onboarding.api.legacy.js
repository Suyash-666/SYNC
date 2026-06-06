// ============================================================================
// src/api/onboarding.api.legacy.js
// Pre-Checkpoint-5g implementation. Talks to the Node backend via axios.
// Selected when the 'crud' feature flag is OFF.
// ============================================================================

import { apiClient } from './client';
import { unwrap } from './helpers';

export const submit = async (payload) => unwrap(await apiClient.post('/users/onboarding', payload));

const onboardingApi = { submit };

export default onboardingApi;
