// ============================================================================
// src/api/placement.api.js
// Facade: picks the legacy or Supabase-backed implementation based on the
// 'crud' feature flag. When VITE_USE_SUPABASE is unset / empty / 0 / false,
// the legacy default below is used and behavior is byte-for-byte identical
// to before Checkpoint 5f.
// ============================================================================

import { isEnabled } from '../lib/featureFlags';
import legacy from './placement.api.legacy';
import supabaseImpl from './placement.api.supabase';

const useSupabase = isEnabled('crud');

export const placementApi = useSupabase ? supabaseImpl : legacy;

export const getProgress = placementApi.getProgress;
export const progress = placementApi.progress;
export const addItem = placementApi.addItem;
export const createProgress = placementApi.createProgress;
export const updateItem = placementApi.updateItem;
export const updateProgress = placementApi.updateProgress;
export const deleteProgress = placementApi.delete;
export const removeProgress = placementApi.removeProgress;
export const getStats = placementApi.getStats;
export const stats = placementApi.stats;
export const addDsaProblem = placementApi.addDsaProblem;
export const createDsa = placementApi.createDsa;
export const getDsaProblems = placementApi.getDsaProblems;
export const listDsa = placementApi.listDsa;

export default placementApi;
