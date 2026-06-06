// ============================================================================
// src/api/notes.api.js
// Facade: picks the legacy or Supabase-backed implementation based on the
// 'crud' feature flag. When VITE_USE_SUPABASE is unset / empty / 0 / false,
// the legacy default below is used and behavior is byte-for-byte identical
// to before Checkpoint 5b.
//
// Exports the SAME `notesApi` object the rest of the frontend imports,
// so no caller needs to change.
// ============================================================================

import { isEnabled } from '../lib/featureFlags';
import legacy from './notes.api.legacy';
import supabaseImpl from './notes.api.supabase';

const useSupabase = isEnabled('crud');

export const notesApi = useSupabase ? supabaseImpl : legacy;

export const getAll = notesApi.getAll;
export const getById = notesApi.getById;
export const create = notesApi.create;
export const update = notesApi.update;
export const deleteNote = notesApi.delete;
export const remove = notesApi.remove;
export const getFolders = notesApi.getFolders;
export const folders = notesApi.folders;

export default notesApi;
