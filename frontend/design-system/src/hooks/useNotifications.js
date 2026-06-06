// ============================================================================
// src/hooks/useNotifications.js
// Facade: picks the legacy or Supabase-Realtime-backed implementation
// based on the 'notifications' feature flag. When VITE_USE_SUPABASE is
// unset / empty / 0 / false, the legacy default is used and behavior
// is byte-for-byte identical to before Checkpoint 4.
//
// Exports the SAME `useNotifications` hook the rest of the frontend
// imports, so no caller needs to change.
// ============================================================================

import { isEnabled } from '../lib/featureFlags';
import { useNotifications as legacyHook } from './useNotifications.legacy';
import { useNotifications as supabaseHook } from './useNotifications.supabase';

const useSupabase = isEnabled('notifications');

export const useNotifications = useSupabase ? supabaseHook : legacyHook;
export default useNotifications;
