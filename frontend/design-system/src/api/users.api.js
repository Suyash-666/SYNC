// ============================================================================
// src/api/users.api.js
// Facade: picks the legacy or Supabase-backed implementation based on the
// 'crud' feature flag. When VITE_USE_SUPABASE is unset / empty / 0 / false,
// the legacy default below is used and behavior is byte-for-byte identical
// to before Checkpoint 7.
// ============================================================================

import { isEnabled } from '../lib/featureFlags';
import legacy from './users.api.legacy';
import supabaseImpl from './users.api.supabase';

const useSupabase = isEnabled('crud');

export const usersApi = useSupabase ? supabaseImpl : legacy;
export const getProfile = usersApi.getProfile;
export const updateProfile = usersApi.updateProfile;
export const deleteAccount = usersApi.deleteAccount;
export const onboarding = usersApi.onboarding;

export default usersApi;
