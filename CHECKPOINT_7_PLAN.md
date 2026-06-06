# Checkpoint 7 — Analytics + Users → Supabase Plan

> Scope: Move all six analytics endpoints and the four user-profile
> endpoints to direct Supabase calls. Per `MIGRATION_RULES.md §5`,
> one Postgres view per analytics endpoint. Users CRUD is a flat
> `supabase.from('User')` call. The legacy routes/controller/service/
> repo stay on disk behind the `analytics` (or `crud`) feature flag.

## Design summary

1. **Five analytics views** — `analytics_overview`, `analytics_attendance`,
   `analytics_assignments`, `analytics_productivity`, `analytics_subjects`
   in `supabase/migrations/0007_analytics_views.sql`. RLS on the
   underlying tables still applies because the views are SECURITY INVOKER.
2. **`getStudyHours`** — the legacy returns a hardcoded placeholder
   (`{daily: [{date, hours: 2}]}`). The new path returns the same
   hardcoded shape for parity.
3. **Users CRUD** — `getProfile`/`updateProfile`/`deleteAccount` use
   `.from('User')` against the user's own row. RLS from `0004_link_auth.sql`
   (the `user_select_own` and `user_update_own` policies) enforces
   authorization.
4. **`onboarding`** — already migrated in Checkpoint 5g; the `usersApi.onboarding`
   alias still works because it calls the same `onboardingApi.submit` internally
   (it actually doesn't — let me check).

Actually `usersApi.onboarding` calls `apiClient.post('/users/onboarding', payload)` — a separate endpoint from the Onboarding page that goes through `onboardingApi`. The Checkpoint 5g `onboarding.api.supabase.js` covers the `onboardingApi.submit` path. **The `usersApi.onboarding` alias is a separate path that the legacy backend also exposes.** Migrating it would duplicate the RPC. Going to leave `usersApi.onboarding` pointing at the legacy backend for now (it's unused per the grep results — let me verify).

## File-by-file scope

### Created (3)
- `supabase/migrations/0007_analytics_views.sql`
- `frontend/design-system/src/api/analytics.api.supabase.js`
- `frontend/design-system/src/api/users.api.supabase.js`

### Created for legacy preservation (2)
- `frontend/design-system/src/api/analytics.api.legacy.js`
- `frontend/design-system/src/api/users.api.legacy.js`

### Modified (2)
- `frontend/design-system/src/api/analytics.api.js` — facade
- `frontend/design-system/src/api/users.api.js` — facade

### NOT modified
- `backend/**` — zero changes
- `frontend/design-system/src/hooks/useAnalytics.js` — untouched
- `frontend/design-system/src/hooks/useDashboard.js` — untouched (it consumes analytics)
- `frontend/design-system/src/lib/supabase.js` — reused

## Response-shape preservation

Analytics views are designed to produce the exact shape the legacy returns, modulo the `user_id` column the view includes. The frontend's `.analytics` files expect:

| Method | Legacy returns | Supabase returns | Match |
|---|---|---|---|
| `getOverview()` | `{attendancePct, pendingAssignments, studyStreak, assignmentCompletionRate}` | single row from `analytics_overview` filtered by `user_id` | ✅ |
| `getAttendance(period)` | `[{date, present, absent, total}]` | rows from `analytics_attendance` filtered by `user_id`, period applied in JS | ✅ |
| `getAssignments(period)` | `[{week, assigned, submitted, overdue}]` | rows from `analytics_assignments` filtered by `user_id`, period applied in JS | ✅ |
| `getStudyHours()` | `{daily: [{date, hours: 2}]}` (hardcoded) | same hardcoded shape | ✅ |
| `getProductivity()` | `{total, breakdown: {attendanceScore, assignmentScore, streakScore, notesScore}}` | single row from `analytics_productivity` filtered by `user_id` | ✅ |
| `getSubjects()` | `[{subject: {id, name}, modules, topicsCompleted, topicsTotal}]` | rows from `analytics_subjects` filtered by `user_id`, mapped to `{subject: {id, name}, ...}` | ✅ |

Users CRUD:
| Method | Legacy returns | Supabase returns | Match |
|---|---|---|---|
| `getProfile()` | `{id, email, full_name, avatar_url, role, is_onboarded, college, degree}` | row from `.from('User').select('*').eq('id', userId).single()` | ✅ |
| `updateProfile(payload)` | `{id, full_name, avatar_url, college, degree}` | row from `.update(payload).eq('id', userId).select('*').single()` | ✅ (extra fields present, not breaking) |
| `deleteAccount()` | `{success, message}` envelope (data: null) | `null` from `.update({is_active: false}).eq('id', userId)` | ⚠️ (consumer doesn't read response) |

## Rollback
```bash
git checkout -- \
  frontend/design-system/src/api/analytics.api.js \
  frontend/design-system/src/api/users.api.js
rm -f \
  frontend/design-system/src/api/analytics.api.supabase.js \
  frontend/design-system/src/api/analytics.api.legacy.js \
  frontend/design-system/src/api/users.api.supabase.js \
  frontend/design-system/src/api/users.api.legacy.js
psql "$SUPABASE_DB_URL" -c "DROP VIEW IF EXISTS public.analytics_overview; DROP VIEW IF EXISTS public.analytics_attendance; DROP VIEW IF EXISTS public.analytics_assignments; DROP VIEW IF EXISTS public.analytics_productivity; DROP VIEW IF EXISTS public.analytics_subjects;"
```

## Exit criteria
- All 6 verify gates green for analytics + users
- Legacy path still works
- Zero backend changes, zero deletions
- Rollback dry-run passes

## Out-of-scope
- Better views (e.g., real `studyStreak` computation) — future enhancement
- Removing legacy analytics endpoints (Checkpoint 8)
- `usersApi.onboarding` alias migration (separate from `onboardingApi.submit`; both eventually point at the RPC; future cleanup)
