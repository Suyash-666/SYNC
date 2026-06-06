// ============================================================================
// src/api/notifications.api.js
// Facade: picks the legacy or Supabase-backed implementation based on the
// 'notifications' feature flag. When VITE_USE_SUPABASE is unset / empty /
// 0 / false, the legacy default is used and behavior is byte-for-byte
// identical to before Checkpoint 4.
//
// Exports the SAME `notificationsApi` object the rest of the frontend
// imports, so no caller needs to change.
// ============================================================================

import { isEnabled } from '../lib/featureFlags';
import legacy from './notifications.api.legacy';
import supabaseImpl from './notifications.api.supabase';

const useSupabase = isEnabled('notifications');

export const notificationsApi = useSupabase ? supabaseImpl : legacy;

export const getAll = notificationsApi.getAll;
export const markRead = notificationsApi.markRead;
export const markAllRead = notificationsApi.markAllRead;
export const deleteNotification = notificationsApi.delete;
export const remove = notificationsApi.remove;

export default notificationsApi;
