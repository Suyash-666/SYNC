// ============================================================================
// src/api/semesters.api.js
// Facade: picks the legacy or Supabase-backed implementation based on the
// 'crud' feature flag. When VITE_USE_SUPABASE is unset / empty / 0 / false,
// the legacy default below is used and behavior is byte-for-byte identical
// to before Checkpoint 5e.
//
// Exports the SAME `semestersApi` object the rest of the frontend imports,
// so no caller needs to change.
// ============================================================================

import { isEnabled } from '../lib/featureFlags';
import legacy from './semesters.api.legacy';
import supabaseImpl from './semesters.api.supabase';

const useSupabase = isEnabled('crud');

export const semestersApi = useSupabase ? supabaseImpl : legacy;

export const getAll = semestersApi.getAll;
export const getById = semestersApi.getById;
export const create = semestersApi.create;
export const update = semestersApi.update;
export const deleteSemester = semestersApi.delete;
export const remove = semestersApi.remove;
export const setCurrent = semestersApi.setCurrent;

export default semestersApi;
