# Checkpoint 5g — Onboarding → Supabase RPC Plan

> Scope: Move the single onboarding endpoint (`POST /users/onboarding`)
> from the Node backend to a Supabase Postgres RPC. The RPC performs
> an atomic `User` update + `Semester` insert. The legacy route,
> controller, service, and validator stay on disk behind the `crud`
> feature flag.

## Design summary

1. **RPC** — `public.onboard_user(payload jsonb) returns jsonb`.
   Created in `supabase/migrations/0006_onboard_user_rpc.sql`.
2. **Atomicity** — single transaction (the legacy has no transaction
   — the new path is actually MORE correct).
3. **Auth check** — `auth.uid()` inside the function. SECURITY DEFINER
   to bypass RLS for the write (the function checks that the caller
   is the affected user; no escalation possible).
4. **Response shape** — `{ semester: <Semester row> }` — matches the
   legacy `onboarding.controller.onboard` which returns
   `ApiResponse.success({semester}, 'Onboarding saved')`. After
   `unwrap`, the consumer receives `{semester: {...}}`.
5. **Constraint validation** — `current_semester > total_semesters`
   is rejected, matching the legacy service's check.

## File-by-file scope

### Created (3)
- `supabase/migrations/0006_onboard_user_rpc.sql` — the RPC
- `frontend/design-system/src/api/onboarding.api.supabase.js`
- `frontend/design-system/src/api/onboarding.api.legacy.js`

### Modified (1)
- `frontend/design-system/src/api/onboarding.api.js` — facade

### NOT modified
- `backend/**` — zero changes
- `frontend/design-system/src/hooks/useOnboarding.js` — untouched
- `frontend/design-system/src/lib/supabase.js` — reused

## Response-shape preservation

| Method | Legacy returns | Supabase returns | Match |
|---|---|---|---|
| `submit(payload)` | `{semester: <Semester row>}` (after unwrap of `ApiResponse.success({semester}, ...)`) | `{semester: <Semester row>}` (from `.rpc('onboard_user', {payload})`) | ✅ |

The legacy returns `{result}` where `result = {semester}`; after `unwrap` the consumer gets `{semester}`. The new path returns `{data}` where `data = {semester: <row>}`; the consumer gets `{semester}` after `unwrap`. ✅

## Migration order
1. Apply `0006_onboard_user_rpc.sql` to the Supabase project.
2. Create the three new files.
3. Smoke test.

## Rollback
```bash
git checkout -- frontend/design-system/src/api/onboarding.api.js
rm -f \
  frontend/design-system/src/api/onboarding.api.supabase.js \
  frontend/design-system/src/api/onboarding.api.legacy.js
psql "$SUPABASE_DB_URL" -c "DROP FUNCTION IF EXISTS public.onboard_user(jsonb);"
```

## Exit criteria
- All 6 verify gates green for onboarding
- Legacy path still works
- Zero backend changes, zero deletions
- Rollback dry-run passes
