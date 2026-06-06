// ============================================================================
// src/api/onboarding.api.js
// Facade: picks the legacy or Supabase-backed implementation based on the
// 'crud' feature flag. When VITE_USE_SUPABASE is unset / empty / 0 / false,
// the legacy default below is used and behavior is byte-for-byte identical
// to before Checkpoint 5g.
// ============================================================================

import { isEnabled } from '../lib/featureFlags';
import legacy from './onboarding.api.legacy';
import supabaseImpl from './onboarding.api.supabase';

const useSupabase = isEnabled('crud');

export const onboardingApi = useSupabase ? supabaseImpl : legacy;

export const submit = onboardingApi.submit;

export default onboardingApi;
