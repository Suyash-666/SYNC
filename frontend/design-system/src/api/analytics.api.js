// ============================================================================
// src/api/analytics.api.js
// Facade: picks the legacy or Supabase-backed implementation based on the
// 'analytics' feature flag. When VITE_USE_SUPABASE is unset / empty /
// 0 / false, the legacy default below is used and behavior is byte-for-
// byte identical to before Checkpoint 7.
// ============================================================================

import { isEnabled } from '../lib/featureFlags';
import legacy from './analytics.api.legacy';
import supabaseImpl from './analytics.api.supabase';

const useSupabase = isEnabled('analytics');

export const analyticsApi = useSupabase ? supabaseImpl : legacy;

export const getOverview = analyticsApi.getOverview;
export const overview = analyticsApi.overview;
export const getAttendance = analyticsApi.getAttendance;
export const attendance = analyticsApi.attendance;
export const getAssignments = analyticsApi.getAssignments;
export const assignments = analyticsApi.assignments;
export const getStudyHours = analyticsApi.getStudyHours;
export const getProductivity = analyticsApi.getProductivity;
export const productivity = analyticsApi.productivity;
export const getSubjects = analyticsApi.getSubjects;
export const subjects = analyticsApi.subjects;

export default analyticsApi;
