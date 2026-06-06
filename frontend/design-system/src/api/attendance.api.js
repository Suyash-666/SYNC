// ============================================================================
// src/api/attendance.api.js
// Facade: picks the legacy or Supabase-backed implementation based on the
// 'crud' feature flag. When VITE_USE_SUPABASE is unset / empty / 0 / false,
// the legacy default below is used and behavior is byte-for-byte identical
// to before Checkpoint 5c.
//
// Exports the SAME `attendanceApi` object the rest of the frontend imports,
// so no caller needs to change.
// ============================================================================

import { isEnabled } from '../lib/featureFlags';
import legacy from './attendance.api.legacy';
import supabaseImpl from './attendance.api.supabase';

const useSupabase = isEnabled('crud');

export const attendanceApi = useSupabase ? supabaseImpl : legacy;

export const getBySubject = attendanceApi.getBySubject;
export const get = attendanceApi.get;
export const mark = attendanceApi.mark;
export const create = attendanceApi.create;
export const update = attendanceApi.update;
export const remove = attendanceApi.remove;
export const deleteAttendance = attendanceApi.delete;
export const getSummary = attendanceApi.getSummary;

export default attendanceApi;
