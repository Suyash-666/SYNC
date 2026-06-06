// ============================================================================
// src/api/assignments.api.js
// Facade: picks the legacy or Supabase-backed implementation based on the
// 'crud' feature flag. When VITE_USE_SUPABASE is unset / empty / 0 / false,
// the legacy default below is used and behavior is byte-for-byte identical
// to before Checkpoint 5a.
//
// Exports the SAME `assignmentsApi` object the rest of the frontend imports,
// so no caller needs to change.
// ============================================================================

import { isEnabled } from '../lib/featureFlags';
import legacy from './assignments.api.legacy';
import supabaseImpl from './assignments.api.supabase';

const useSupabase = isEnabled('crud');

export const assignmentsApi = useSupabase ? supabaseImpl : legacy;

export const getAll = assignmentsApi.getAll;
export const getById = assignmentsApi.getById;
export const create = assignmentsApi.create;
export const update = assignmentsApi.update;
export const deleteAssignment = assignmentsApi.delete;
export const updateStatus = assignmentsApi.updateStatus;

export default assignmentsApi;
