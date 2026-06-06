# Checkpoint 5e — Semesters CRUD → Supabase PostgREST Plan

> Scope: Move all six Semester endpoints (`GET /semesters`, `GET
> /semesters/:id`, `POST /semesters`, `PATCH /semesters/:id`, `DELETE
> /semesters/:id`, `PATCH /semesters/:id/set-current`) from the Node
> backend to direct `supabase.from('Semester')` calls. RLS replaces
> the legacy `ownershipGuard` middleware. The legacy routes,
> controller, service, repository, and validator stay on disk behind
> the `crud` feature flag.

## Design summary

1. **Table** — `Semester` (from `0001_init_schema.sql`). RLS from
   `0004_link_auth.sql` enforces `user_id = auth.uid()`.
2. **CRUD via PostgREST** — flat `.from('Semester')` calls.
3. **`setCurrent` multi-step** — the legacy does
   `unsetCurrentForUser(userId)` (clears `is_current` on all the
   user's other semesters) then `update(id, {is_current: true})`.
   The Supabase path does the same two-step:
   - `.update({is_current:false}).eq('user_id', userId).eq('is_current', true)`
   - `.update({is_current:true}).eq('id', id).select().single()`
4. **No pagination wrapper** — `getAll` returns an array directly
   (the legacy `semesters.controller.list` returns the array, not
   a paginated object).
5. **Sort order** — `semester_number desc` (matches legacy
   `orderBy: { semester_number: 'desc' }` in `SemRepo.findAllByUser`).
6. **Ownership** — handled by RLS instead of `ownershipGuard`.

## File-by-file scope

### Created (2)

| File | Purpose |
|---|---|
| `frontend/design-system/src/api/semesters.api.supabase.js` | New implementation. Six methods. |
| `frontend/design-system/src/api/semesters.api.legacy.js` | Pre-Checkpoint-5e code, moved verbatim. |

### Modified (1)

| File | Change |
|---|---|
| `frontend/design-system/src/api/semesters.api.js` | Becomes a 6-line facade. |

### NOT modified in Checkpoint 5e

- `backend/**` — **zero changes.** All Semester routes, controller, service, repository, validator stay live.
- `frontend/design-system/src/hooks/useSemester.js` — untouched. It calls `semestersApi.getById` and `semestersApi.setCurrent`, which the new module exports.
- `frontend/design-system/src/lib/mappers.js` — `mapSemester` already consumes the row shape.
- `frontend/design-system/src/lib/supabase.js` — reused.
- All other API modules, hooks, pages, components.

## Response-shape preservation

| Method | Legacy returns | Supabase returns | Match |
|---|---|---|---|
| `getAll()` | array of `Semester` rows (after `unwrap` of `ApiResponse.success(items, 'Semesters')`) | array of `Semester` rows from `.from('Semester').select('*').order('semester_number', {ascending:false})` | ✅ Identical |
| `getById(id)` | single `Semester` row (after `unwrap` of `ApiResponse.success(s, 'Semester')`) | single row from `.select('*').eq('id', id).single()` | ✅ Identical |
| `create(payload)` | single `Semester` row | single row from `.insert(row).select('*').single()` | ✅ Identical |
| `update(id, payload)` | single `Semester` row | single row from `.update(row).eq('id', id).select('*').single()` | ✅ Identical |
| `delete(id)` | `{success, message}` envelope with `data: null` | `null` from `.delete().eq('id', id)` | ⚠️ Mismatch (consumer doesn't read response — see L1) |
| `setCurrent(id)` | single `Semester` row (the one now marked current) | same | ✅ Identical |

**L1 (delete response shape):** No consumer in the codebase calls `semestersApi.delete` (verified by grep). The mismatch is theoretical.

## setCurrent implementation details

**Legacy (`backend/src/services/semesters.service.js:27-30`):**
```js
async function setCurrentSemester(userId, id) {
  await SemRepo.unsetCurrentForUser(userId);
  return SemRepo.update(id, { is_current: true });
}
```

`unsetCurrentForUser`:
```js
prisma.semester.updateMany({
  where: { user_id: userId, is_current: true },
  data: { is_current: false }
});
```

**Supabase path:**
```js
// Step 1: clear is_current on all the user's other semesters
const { error: e1 } = await c
  .from('Semester')
  .update({ is_current: false })
  .eq('user_id', userId)
  .eq('is_current', true);
if (e1) throw new Error(e1.message);

// Step 2: mark the target semester as current
const { data, error: e2 } = await c
  .from('Semester')
  .update({ is_current: true })
  .eq('id', id)
  .select('*')
  .single();
if (e2) throw new Error(e2.message);
return data;
```

**Atomicity:** the two steps are NOT in a transaction. If step 1 succeeds and step 2 fails (e.g., RLS denies because the user doesn't own the target semester), the user's other semesters will all have `is_current=false` and the target will still have `is_current=false`. Result: no semester is current.

The legacy has the same race condition. So this is **not a Checkpoint 5e regression** — it's a pre-existing limitation that can be addressed later via a Postgres RPC (Checkpoint 7g or a follow-up).

**Alternative:** use a Postgres RPC that wraps both steps in a single transaction. This would be the proper fix. Going with the two-step approach for parity with the legacy; documenting the upgrade path in the follow-ups.

## Filter mapping

| Legacy filter | PostgREST |
|---|---|
| (no filters on `getAll`) | none |
| (sort) | `.order('semester_number', {ascending:false})` |

## Feature flag behavior

Same as 5a/5b/5c/5d. `isEnabled('crud')`.

## Migration order

1. Confirm Checkpoint 5d is fully verified.
2. Create `semesters.api.supabase.js` and `semesters.api.legacy.js`.
3. Replace `semesters.api.js` with the facade.
4. Smoke test: flag OFF (regression), then flag ON (new path).
5. Run the test checklist.

## Rollback commands

```bash
git checkout -- frontend/design-system/src/api/semesters.api.js
rm -f \
  frontend/design-system/src/api/semesters.api.supabase.js \
  frontend/design-system/src/api/semesters.api.legacy.js
```

Backend is untouched. Pre-Checkpoint-5e bytes preserved in `semesters.api.legacy.js`.

## Testing checklist

### Pre-flight

- [ ] `0001_init_schema.sql` applied (Semester table with `is_current` column)
- [ ] `0004_link_auth.sql` applied (RLS uses `auth.uid()`)
- [ ] `0005_storage_policies.sql` applied (Checkpoint 3 prerequisite)
- [ ] `0003_realtime.sql` applied (Checkpoint 4 prerequisite)
- [ ] `frontend/design-system/.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] `frontend/design-system/package.json` declares `@supabase/supabase-js`

### RLS probe

```sql
-- 1. Semester policies
SELECT policyname, cmd FROM pg_policies
 WHERE schemaname = 'public' AND tablename = 'Semester';
-- expect: at least 1 row for semester_owner (FOR ALL = 4 cmds)

-- 2. Cross-user isolation
SET LOCAL request.jwt.claim.sub = '<user-A-uuid>';
SELECT id FROM "Semester" WHERE user_id = '<user-B-uuid>';
-- expect: 0 rows
```

### Regression (flag OFF)

- [ ] `npm run dev` boots, no console errors
- [ ] Navigate to a semester workspace → semester details load
- [ ] `setCurrent` (e.g., "Set as current semester" button) works → row updates with `is_current=true`, others' `is_current=false`
- [ ] List of semesters (where the UI shows them) loads
- [ ] Create / edit / delete semester (if any page exposes these)

### New path (flag ON)

- [ ] **M2 boot-order smoke test** — load `/`, log in, navigate to a semester workspace — initial `getById` succeeds
- [ ] DevTools Network → filter `supabase.co` → see GET on
      `/rest/v1/Semester?select=*&id=eq.<id>` for the active semester
- [ ] Verify the row has the correct `user_id` (= auth.uid())
- [ ] `setCurrent(<other-semester-id>)` via UI → DevTools shows two requests:
      - PATCH on `/rest/v1/Semester?user_id=eq.<uid>&is_current=eq.true` setting `is_current=false`
      - PATCH on `/rest/v1/Semester?id=eq.<id>` setting `is_current=true`
- [ ] Supabase Table Editor → both updates reflect: target row has `is_current=true`, all other rows for that user have `is_current=false`
- [ ] `getAll()` (if used by any page) → URL has `order=semester_number.desc`
- [ ] Create a semester via UI → POST; list updates; Table Editor shows new row
- [ ] Edit a semester via UI → PATCH; updates
- [ ] Delete a semester via UI → DELETE; list updates

### Cross-user isolation (flag ON)

- [ ] User B's `getById(<user-A's semester id>)` returns nothing (RLS blocks; `.single()` throws PGRST116)
- [ ] User B cannot update user A's semester
- [ ] User B cannot delete user A's semester
- [ ] User B's `setCurrent(<user-A's semester id>)` fails at step 2 (RLS blocks the update; the row's `is_current` stays at whatever it was)
- [ ] SQL: as user B, `SELECT id FROM "Semester" WHERE user_id = '<user-A-uuid>'` → 0 rows

### setCurrent edge case (flag ON)

- [ ] User has 3 semesters; none is current → set current on A → A=`true`, B/C=`false`
- [ ] Set current on B → A=`false`, B=`true`, C=`false`
- [ ] Set current on the same semester twice (idempotency) → still `is_current=true`, no others flip

### Single current per user invariant (flag ON)

- [ ] After multiple `setCurrent` calls, exactly one semester per user has `is_current=true`
- [ ] If the user has no semesters, no-op

### Cross-check

- [ ] `git status` shows only the files listed. No deletions.
- [ ] `curl -H "Authorization: Bearer <access>" http://localhost:5000/api/v1/semesters` still works
- [ ] `curl -X PATCH -H "Authorization: Bearer <access>" http://localhost:5000/api/v1/semesters/<id>/set-current` still works
- [ ] Assignments (5a), Notes (5b), Attendance (5c), Subjects (5d) still work with the same flag

### Rollback dry-run

- [ ] `git checkout -- frontend/design-system/src/api/semesters.api.js`
- [ ] `rm` the two new files
- [ ] `npm run dev` still works
- [ ] Semester workspace loads via the legacy endpoint

## Exit criteria for Checkpoint 5e

All of the following must be true before Checkpoint 5f (Placement) begins:

- All pre-flight, regression, new-path, and cross-user-isolation checks pass
- All 6 verify gates from `MIGRATION_RULES.md §8` are green for the semesters module
- The shared `lib/supabase.js` and `lib/featureFlags.js` are not modified
- The `setCurrent` two-step behavior is verified
- The "exactly one current per user" invariant is verified
- Rollback dry-run passes

## Out-of-scope for Checkpoint 5e

- Atomic `setCurrent` via Postgres RPC (future enhancement; documented in follow-ups)
- Removing the legacy `/api/v1/semesters/...` endpoints (Checkpoint 8)
- Removing the legacy `semesters.controller.js`, `semesters.service.js`, `semesters.repository.js`, `semesters.routes.js`, `semester.validator.js` (Checkpoint 8)
- Other CRUD modules (placement, onboarding) — their own Checkpoints

## Follow-ups (tracked, not in scope)

- `setCurrent` atomicity: write a Postgres RPC `set_current_semester(semester_id uuid)` that wraps the two updates in a `BEGIN; ... COMMIT;` block. Update `semesters.api.supabase.js` to call `supabase.rpc('set_current_semester', { semester_id })` instead. The RPC is added in a future migration; the API module change is a one-liner.
