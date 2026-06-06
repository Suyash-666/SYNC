// ============================================================================
// src/api/resources.api.js
// Facade: picks the legacy or Supabase-backed implementation based on the
// 'storage' feature flag. When VITE_USE_SUPABASE is unset / empty / 0 / false,
// the legacy default below is used and behavior is byte-for-byte identical
// to before Checkpoint 3.
//
// Exports the SAME `resourcesApi` object the rest of the frontend imports,
// so no caller needs to change.
// ============================================================================

import { isEnabled } from '../lib/featureFlags';
import legacy from './resources.api.legacy';
import supabaseImpl from './resources.api.supabase';

const useSupabase = isEnabled('storage');

export const resourcesApi = useSupabase ? supabaseImpl : legacy;

export const getAll = resourcesApi.getAll;
export const upload = resourcesApi.upload;
export const addLink = resourcesApi.addLink;
export const link = resourcesApi.link;
export const deleteResource = resourcesApi.delete;
export const remove = resourcesApi.remove;

export default resourcesApi;
