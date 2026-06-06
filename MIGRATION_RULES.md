# SYNC → Supabase Migration: Standing Rules

These rules apply to every Checkpoint from 3 through 8. They were locked in
during the post-Checkpoint 2 target-architecture review on 2026-06-05.

## 1. Feature flags gate every frontend module

Environment variable: `VITE_USE_SUPABASE`

Accepted values (comma-separated or single):

| Value | Effect |
|---|---|
| `auth` | Frontend uses Supabase Auth directly (Checkpoint 8) |
| `storage` | Frontend uploads files directly to Supabase Storage (Checkpoint 3) |
| `notifications` | Frontend subscribes via Supabase Realtime (Checkpoint 4) |
| `crud` | Frontend CRUD modules talk to Supabase PostgREST (Checkpoint 5+) |
| `study-rooms` | Study-room HTTP CRUD via Supabase; socket unchanged (Checkpoint 6) |
| `analytics` | Analytics endpoints read Postgres views (Checkpoint 7) |
| `all` | Every flag enabled |
| (unset) / `0` / empty | All flags off — legacy Node backend handles everything |

A single value `auth,storage,notifications,crud` enables four flags at once.

Implementation: `frontend/design-system/src/lib/featureFlags.js` exports
`isEnabled(flag)` and `withFallback(flag, legacyPath, supabasePath)` helpers.
Each rewritten `xxx.api.js` calls `isEnabled('xxx')` once at the top of every
exported function and returns either the Supabase-backed or legacy path.

## 2. Storage CORS — deployment concern, not application logic

Documented in `DEPLOYMENT.md` (Checkpoint 3). Required bucket CORS origins:

- `http://localhost:5173` (Vite dev)
- `https://<your-vercel-domain>.vercel.app` (production)
- Any future custom domain (added at purchase time)

Allowed methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`.
Allowed headers: `Authorization, Content-Type, x-client-info, apikey`.

## 3. Schema columns `User.password_hash` and `User.refresh_token`

**Kept through Checkpoint 8.** Drop them only after:

- Production deployment is live
- Several weeks of stable usage with no rollback
- No active incident referencing either column

Storage is cheap. Rollbacks are expensive. The columns hold a placeholder
string (`'supabase-managed'`) and are not read at runtime.

Removal is one SQL file: `supabase/migrations/0011_drop_legacy_columns.sql`
(deferred — not part of the Checkpoint 3–7 work).

## 4. Refresh token storage

Supabase default — `localStorage`. The Node legacy compatibility layer
(httpOnly cookie + legacy JWT) remains in place through Checkpoint 8.
After Checkpoint 8, the frontend talks to Supabase directly and the refresh
token is managed by `@supabase/supabase-js` in `localStorage`.

Do **not** build a custom cookie-based auth flow as part of this migration.
Defer to a possible future Checkpoint 9 if the product scales.

## 5. Analytics — one Postgres view per endpoint

`supabase/migrations/0009_analytics_views.sql` creates:

- `analytics_overview` (returns the 4 numbers from the current
  `GET /api/v1/analytics/overview` endpoint)
- `analytics_attendance` (returns rows from the current
  `GET /api/v1/analytics/attendance` endpoint, parameterised by period via
  filter expressions in the frontend)
- `analytics_assignments` (rows for the current
  `GET /api/v1/analytics/assignments` endpoint)
- `analytics_productivity` (the breakdown + total for the current
  `GET /api/v1/analytics/productivity` endpoint)
- `analytics_subjects` (rows for the current
  `GET /api/v1/analytics/subjects` endpoint)

Parameterised `period=7d|30d|semester` is handled in the frontend by
different `select` filters against the same view — the views are
SQL-equivalent to what the current `analytics.service.js` produces.

## 6. Per-module discipline (the cardinal rule)

For every module migrated to Supabase, follow this exact sequence:

1. **Implement the Supabase version** of the API module / hook / slice.
2. **Verify the frontend behavior is identical** to the legacy path
   (manual smoke + the testing checklist from each Checkpoint's plan).
3. **Keep the old backend route / controller / service / repository
   intact** on disk. They are not deleted in this Checkpoint.
4. **Add a feature flag** (`VITE_USE_SUPABASE=module-name`) so the new path
   is opt-in.
5. **Only after all Checkpoints pass** should deletion be considered —
   and deletion is centralized in **Checkpoint 8** with a single
   `git tag pre-checkpoint-8` marker for rollback.

**Frontend behavior preservation has higher priority than backend cleanup.**

If a frontend feature breaks, flip one flag — do not revert the entire
migration. If the flag-flip recovery doesn't work, revert that Checkpoint's
source files with `git checkout -- ...` — no other code is affected because
the old backend is still alive.

## 7. Checkpoint sequence reminder

| # | Module(s) | Frontend touches | Backend touches (additive only) |
|---|---|---|---|
| 3 | Storage | `resources.api.js`, `lib/supabase.js` | `0005_storage_policies.sql` |
| 4 | Notifications | `notifications.api.js`, `useNotifications.js`, `notificationsSlice.js` | none (0003 already covers) |
| 5a | Assignments | `assignments.api.js` | none |
| 5b | Notes | `notes.api.js` | none |
| 5c | Attendance | `attendance.api.js` | none |
| 5d | Subjects | `subjects.api.js` | none |
| 5e | Semesters | `semesters.api.js` | none |
| 5f | Placement | `placement.api.js` | none |
| 5g | Onboarding | `onboarding.api.js` | `0007_rpc_onboard_user.sql` |
| 6 | Study rooms (HTTP) | `studyRooms.api.js`, `socket.js` (JWT source) | `0008_study_room_rls.sql` |
| 7 | Analytics + Users | `analytics.api.js`, `users.api.js` | `0009_analytics_views.sql`, `0010_users_rls.sql` |
| 8 | Auth + final deprecation | `auth.api.js`, `App.jsx`, `authSlice.js`, `client.js` | mass deletion of legacy files |

## 8. What "verify" means in this migration

A Checkpoint is verified when:

- The legacy path still works (because we never deleted it).
- The new Supabase path produces the same response shape (`{data, pagination}`)
  for at least one happy-path test against every endpoint in the module.
- The mappers in `frontend/design-system/src/lib/mappers.js` do not need to
  change (i.e., Supabase returns snake_case fields the mappers expect).
- React Query keys match the legacy (`['assignments', params]`,
  `['notifications', params]`, etc.) so consumers don't need to change.
- The feature flag correctly switches between paths.
- The Supabase console shows the expected rows / storage objects / realtime
  events arriving.

Until all six are green, the Checkpoint is incomplete and the next one does
not start.
