// ============================================================================
// src/api/subjects.api.js
// Facade: picks the legacy or Supabase-backed implementation based on the
// 'crud' feature flag. When VITE_USE_SUPABASE is unset / empty / 0 / false,
// the legacy default below is used and behavior is byte-for-byte identical
// to before Checkpoint 5d.
//
// Exports the SAME `subjectsApi` object the rest of the frontend imports,
// so no caller needs to change.
// ============================================================================

import { isEnabled } from '../lib/featureFlags';
import legacy from './subjects.api.legacy';
import supabaseImpl from './subjects.api.supabase';

const useSupabase = isEnabled('crud');

export const subjectsApi = useSupabase ? supabaseImpl : legacy;

export const getBySemester = subjectsApi.getBySemester;
export const listBySemester = subjectsApi.listBySemester;
export const getById = subjectsApi.getById;
export const create = subjectsApi.create;
export const update = subjectsApi.update;
export const deleteSubject = subjectsApi.delete;
export const remove = subjectsApi.remove;
export const addModule = subjectsApi.addModule;
export const updateModule = subjectsApi.updateModule;
export const deleteModule = subjectsApi.deleteModule;
export const removeModule = subjectsApi.removeModule;
export const toggleTopic = subjectsApi.toggleTopic;
export const createTopic = subjectsApi.createTopic;
export const updateTopic = subjectsApi.updateTopic;
export const deleteTopic = subjectsApi.deleteTopic;

export default subjectsApi;
