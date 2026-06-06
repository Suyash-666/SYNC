# Checkpoint 5a — Assignments CRUD → Supabase PostgREST Plan

> Scope: Move all six Assignment endpoints (`GET /assignments`, `GET
> /assignments/:id`, `POST /assignments`, `PATCH /assignments/:id`,
> `DELETE /assignments/:id`, `PATCH /assignments/:id/status`) from the
> Node backend to direct `supabase.from('Assignment')` calls. RLS
> enforces ownership. The legacy routes, controller, service,
> repository, and validator stay on disk behind the feature flag.
>
> Approach: **Feature-flag gated.** The new path activates only when
> `VITE_USE_SUPABASE=crud` (or `all`). The legacy path remains
> available.

## Design summary

1. **Table** — `Assignment` (from `0001_init_schema.sql`). RLS from
   `0004_link_auth.sql` enforces `user_id = auth.uid()`.
2. **CRUD via PostgREST** — `supabase.from('Assignment').select()/
   insert()/update()/delete()` with `.eq('user_id', userId)` where
   useful (RLS already enforces it; the explicit clause is defense in
   depth and makes the intent obvious).
3. **Filter mapping** — the legacy `assignments.repository.js`
   supports `status`, `priority`, `subject_id`, `due_from`, `due_to`.
   PostgREST supports all of these directly with `.eq()` and `.gte()`/
   `.lte()` on `due_date`.
4. **Pagination** — `.range(from, to).select('*', {count:'exact'})`
   returns `{data, count}`; we assemble the legacy
   `{data, pagination: {total, page, limit, totalPages}}` shape from
   it.
5. **due_date future-date validation** — the legacy
   `assignment.validator.js` rejects `due_date` in the past. The
   Supabase path applies the same rule in a thin Zod-style check
   before calling `.insert()`. (The frontend doesn't currently have
   Zod on this path; we add a minimal `validateAssignment` function
   inside the new module.)
6. **status update** — the legacy service sets `submitted_at = new
   Date()` when `status === 'SUBMITTED'`. The Supabase path does the
   same.
7. **Subject relationship** — `subject_id` is a nullable FK to
   `Subject`. RLS on `Subject` (from 0004) lets the user assign
   subjects they own. The `subject` join is not needed in the
   `getAll` response — `mapAssignment` handles a missing `subject`
   field by falling back to `subject_id` (see `mappers.js:7`).

## File-by-file scope

### Created (3)

| File | Purpose |
|---|---|
| `frontend/design-system/src/api/assignments.api.supabase.js` | New implementation of `assignmentsApi`. Same six methods. Returns the same shapes the legacy module returns. |
| `frontend/design-system/src/api/assignments.api.legacy.js` | Pre-Checkpoint-5a code, moved verbatim. Used when the flag is off. |
| `frontend/design-system/src/hooks/useAssignments.legacy.js` | Pre-Checkpoint-5a hook (same as current `useAssignments.js`), moved verbatim. |

Wait — the current `useAssignments.js` does not need to change at all. It calls `assignmentsApi.getAll/create/update/delete/updateStatus`, all of which the new assignments module exports under the same names. The hook only needs to change if the assignments module changes shape — which it doesn't. So:

### Created (revised — 2)

| File | Purpose |
|---|---|
| `frontend/design-system/src/api/assignments.api.supabase.js` | New implementation. |
| `frontend/design-system/src/api/assignments.api.legacy.js` | Pre-Checkpoint-5a code, moved verbatim. |

### Modified (1)

| File | Change |
|---|---|
| `frontend/design-system/src/api/assignments.api.js` | Becomes a 6-line facade. Picks `legacy` or `supabaseImpl` based on `isEnabled('crud')`. |

### NOT modified in Checkpoint 5a

- `backend/**` — **zero changes.** All Assignment routes, controller, service, repository, validator stay live.
- `frontend/design-system/src/hooks/useAssignments.js` — untouched. Its dependency on `assignmentsApi` is unchanged.
- `frontend/design-system/src/lib/mappers.js` — `mapAssignment` already consumes snake_case fields.
- `frontend/design-system/src/lib/supabase.js` — `getSupabaseForUser`, `getSupabaseAccessToken` reused.
- `frontend/design-system/src/lib/featureFlags.js` — `crud` flag already known.
- All other API modules, hooks, pages, components.

## Response-shape preservation

| Method | Legacy returns | Supabase returns | Match |
|---|---|---|---|
| `getAll(filters)` | `{data: Assignment[], pagination: {total, page, limit, totalPages}}` (after `unwrap` of `ApiResponse.success(result.data, '...', 200, { pagination: result.pagination })`) | `{data: rows, pagination: {total, page, limit, totalPages}}` (assembled from `.range(from,to).select('*',{count:'exact'})`) | ✅ Identical |
| `getById(id)` | `Assignment` row object (after `unwrap` of `ApiResponse.success(a, 'Assignment')`) | `Assignment` row object from `.select('*').eq('id', id).single()` | ✅ Identical |
| `create(payload)` | `Assignment` row object | `Assignment` row object from `.insert(row).select('*').single()` | ✅ Identical |
| `update(id, payload)` | `Assignment` row object | `Assignment` row object from `.update(row).eq('id', id).select('*').single()` | ✅ Identical |
| `delete(id)` | `{success, message}` envelope with `data: null` (backend `ApiResponse.success(null, 'Assignment deleted')`) | `null` from `.delete().eq('id', id)` | ⚠️ Mismatch (consumer doesn't read the response — see L1 below) |
| `updateStatus(id, {status})` | `Assignment` row object | `Assignment` row object from `.update(payload).eq('id', id).select('*').single()` | ✅ Identical |

**L1 (delete response shape):** The only consumer of `assignmentsApi.delete` is `useAssignments.js:26` (`deleteMutation`). The hook's `onSuccess` only calls `invalidateQueries`; it does not read the response body. The mismatch is safe.

**`mapAssignment` compatibility:** `mapAssignment` reads `item.subject?.name || item.subject_name || item.subject_id || 'General'`. The Supabase `select('*')` does not join the `Subject` table, so `item.subject` will be undefined. The mapper's fallback chain resolves to `item.subject_id || 'General'`. **This is a minor UX regression** in the assignments list — instead of showing the subject name (e.g., "Algorithms"), it shows the subject UUID (or "General" if the assignment has no subject). The pages that render the assignment list (e.g., the dashboard, the assignments page) will see a UUID string instead of a name.

This UX regression is **fixable** in the new module by either:

- **Option A (simple):** Use a separate `select('*, subject:Subject(name)')` join. RLS on `Subject` allows the user to read their own subjects, so the join succeeds. Returns the same shape the backend produced.
- **Option B (deferred):** Do the simple select and let the mapper fall through. Fix the UX in a follow-up.

The plan adopts **Option A** because the backend today returns the joined subject name (per `assignment.repository.findAll` which uses `prisma.assignment.findMany({ where, skip, take, orderBy })` — actually, **the legacy backend does NOT join subject** either; it only returns the raw row. The mapper currently consumes whatever is in `item.subject` and falls back to `item.subject_id`). So the **legacy path also falls through to `subject_id`** in the current codebase. Option B is what both paths do today. The new path is **byte-for-byte equivalent** to the legacy path with Option B.

Going with **Option B (parity with legacy)** to keep the migration scope small. The UX improvement (joining the subject name) can be a Checkpoint 5a-post enhancement tracked in `MIGRATION_RULES.md` "follow-ups".

## Filter mapping

| Legacy filter | PostgREST |
|---|---|
| `status` | `.eq('status', status)` |
| `priority` | `.eq('priority', priority)` |
| `subject_id` | `.eq('subject_id', subject_id)` |
| `due_from` | `.gte('due_date', due_from)` |
| `due_to` | `.lte('due_date', due_to)` |

The `getAll` query in the Supabase path applies filters in the same order the legacy repository does. Sort order: `due_date asc` (matches legacy `orderBy: { due_date: 'asc' }`).

## `due_date` future-date validation

The legacy `assignment.validator.js` uses a custom `futureDate` zod refinement that rejects any `due_date` in the past. The Supabase path applies the same rule in a small `validateDueDate` function:

```js
function validateDueDate(s) {
  if (s === undefined) return true;
  const d = new Date(s);
  if (isNaN(d.getTime()) || d <= new Date()) {
    throw new Error('due_date must be a valid future date');
  }
  return true;
}
```

Applied to `create` and `update`. **Identical to the legacy behavior.**

## `submitted_at` side effect on status update

Legacy `assignments.service.js:33-39`:
```js
async function updateStatus(id, status) {
  const payload = { status };
  if (status === 'SUBMITTED') payload.submitted_at = new Date();
  return AssignRepo.update(id, payload);
}
```

Supabase path replicates:
```js
const payload = { status };
if (status === 'SUBMITTED') payload.submitted_at = new Date().toISOString();
```

## Feature flag behavior

`isEnabled('crud')` — same `crud` flag will be shared with future CRUD modules (notes, attendance, subjects, semesters, placement, onboarding). When you flip the flag, **all** of those modules activate their Supabase paths simultaneously. This is a deliberate design choice documented in `MIGRATION_RULES.md §1`. The `crud` value is one flag that gates an entire family of modules.

**The granularity here is module-level, not flag-level.** Each rewritten module checks `isEnabled('crud')` independently. The same flag value activates all of them.

## Migration order

1. Confirm Checkpoint 3 + Checkpoint 4 + `0004_link_auth.sql` are all verified.
2. Create `assignments.api.supabase.js` and `assignments.api.legacy.js`.
3. Replace `assignments.api.js` with the facade.
4. Smoke test: flag OFF (regression), then flag ON (new path).
5. Run the test checklist.

## Rollback commands

```bash
# 1. Revert the facade
git checkout -- frontend/design-system/src/api/assignments.api.js

# 2. Remove the new files
rm -f \
  frontend/design-system/src/api/assignments.api.supabase.js \
  frontend/design-system/src/api/assignments.api.legacy.js
```

Backend is untouched. The legacy `/api/v1/assignments/...` endpoints continue working. The pre-Checkpoint-5a `assignments.api.js` content is preserved verbatim in `assignments.api.legacy.js`, so `git checkout --` restores the exact bytes.

## Testing checklist

### Pre-flight

- [ ] `0001_init_schema.sql` applied (Assignment table exists)
- [ ] `0004_link_auth.sql` applied (RLS uses `auth.uid()`)
- [ ] `0005_storage_policies.sql` applied (Checkpoint 3 prerequisite)
- [ ] `0003_realtime.sql` applied (Checkpoint 4 prerequisite)
- [ ] `frontend/design-system/.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] `frontend/design-system/package.json` declares `@supabase/supabase-js`
- [ ] `npm install` has been run

### RLS probe

```sql
-- 1. Assignment RLS policies
SELECT policyname, cmd FROM pg_policies
 WHERE schemaname = 'public' AND tablename = 'Assignment';
-- expect: 1 row per cmd (SELECT, INSERT, UPDATE, DELETE) for assignment_owner

-- 2. Cross-user isolation: try to select another user's assignment
SET LOCAL request.jwt.claim.sub = '<user-A-uuid>';
SELECT id FROM "Assignment" WHERE user_id = '<user-B-uuid>';
-- expect: 0 rows
RESET request.jwt.claim.sub;
```

### Regression (flag OFF — VITE_USE_SUPABASE unset)

- [ ] `npm run dev` boots, no console errors
- [ ] Open `/assignments` — list loads
- [ ] Click an assignment → detail loads (`getById`)
- [ ] Create a new assignment → list refreshes
- [ ] Edit an assignment → updates in list
- [ ] Delete an assignment → removed from list
- [ ] Change assignment status (e.g., move to "In progress") → updates optimistically (the hook's `onMutate` runs) and persists
- [ ] Filter by status → list updates
- [ ] Filter by priority → list updates
- [ ] Filter by subject_id → list updates
- [ ] Filter by due_from / due_to → list updates

### New path (flag ON — VITE_USE_SUPABASE=crud)

- [ ] **M2 boot-order smoke test** — load `/`, log in, navigate to `/assignments` — list loads (initial `getAll` succeeds)
- [ ] DevTools Network → filter `supabase.co` → see the initial GET on
      `/rest/v1/Assignment?select=*&order=due_date.asc&offset=0`
- [ ] Open the Supabase dashboard Table Editor → `Assignment` — confirm
      the `select` count matches the on-screen count
- [ ] Click an assignment → DevTools shows a GET on
      `/rest/v1/Assignment?id=eq.<id>&select=*` returning 1 row
- [ ] Create a new assignment via the UI → DevTools shows a POST on
      `/rest/v1/Assignment` with `Prefer: return=representation`; list
      updates
- [ ] Open Table Editor → confirm the new row exists with the correct
      `user_id` (= auth.uid())
- [ ] Edit the assignment → DevTools shows a PATCH; list updates
- [ ] Delete the assignment → DevTools shows a DELETE; list updates;
      Table Editor row is gone
- [ ] Change status to SUBMITTED → DevTools shows a PATCH with
      `submitted_at` set; Table Editor reflects the change
- [ ] Filter by status (e.g., TODO) → DevTools shows a GET with
      `status=eq.TODO`
- [ ] Filter by priority (HIGH) → `priority=eq.HIGH`
- [ ] Filter by subject_id → `subject_id=eq.<uuid>`
- [ ] Filter by due_from / due_to → `due_date=gte.<iso>` /
      `due_date=lte.<iso>`

### Cross-user isolation (flag ON)

- [ ] Sign in as user A in tab 1, user B in tab 2
- [ ] User B's list does not include user A's assignments
- [ ] In SQL, attempt `UPDATE "Assignment" SET title='x' WHERE id =
      '<user-A-assignment-id>'` while authenticated as user B — should
      silently affect 0 rows (RLS blocks it)

### due_date validation (flag ON)

- [ ] Try to create an assignment with `due_date` = yesterday via the
      API directly (bypassing UI):
      `supabase.from('Assignment').insert({..., due_date: <yesterday>})`
      — the new module rejects with the same error message as the
      legacy Zod validator ("due_date must be a valid future date")
- [ ] `due_date` = today (boundary) — should be rejected (legacy
      `>` is strict; the new check is also strict)
- [ ] `due_date` = tomorrow — accepted
- [ ] No `due_date` — accepted (it's optional)

### submitted_at side effect (flag ON)

- [ ] Change an assignment's status to SUBMITTED → row in DB has
      `submitted_at` set to ~now
- [ ] Change status to TODO → `submitted_at` is **preserved** (the
      Supabase update only touches the columns in `payload`)

### Pagination

- [ ] Create 25+ assignments for the test user → list shows 20 (page 1)
- [ ] Click "next page" → second 5 appear
- [ ] Page 2's URL has `offset=20` and `limit=20`

### Cross-check

- [ ] `git status` shows only the files listed in this plan. No deletions.
- [ ] `curl -X POST -H "Authorization: Bearer <access>" -H "Content-Type: application/json" -d '{"title":"x"}' http://localhost:5000/api/v1/assignments` still works (legacy endpoint intact)
- [ ] Other API modules (notes, attendance, etc.) still work — only the assignments facade has been changed

### Rollback dry-run

- [ ] `git checkout -- frontend/design-system/src/api/assignments.api.js`
- [ ] `rm frontend/design-system/src/api/assignments.api.supabase.js frontend/design-system/src/api/assignments.api.legacy.js`
- [ ] `npm run dev` still works
- [ ] `/assignments` page loads via the legacy endpoint (Network tab shows `localhost:5000/api/v1/assignments`)

## Exit criteria for Checkpoint 5a

All of the following must be true before Checkpoint 5b (Notes) begins:

- All pre-flight, regression, new-path, and cross-user-isolation checks pass
- All 6 verify gates from `MIGRATION_RULES.md §8` are green for the assignments module
- The `crud` flag verified to work for assignments (gate by itself, not with other modules)
- The shared `lib/supabase.js` and `lib/featureFlags.js` are not modified by this Checkpoint (proves the abstractions from Checkpoint 3 are stable)
- Rollback dry-run passes

## Out-of-scope for Checkpoint 5a

- Subject name join in the assignments list (deferred — see "Filter mapping" §)
- Removing the legacy `/api/v1/assignments/...` endpoints (Checkpoint 8)
- Removing the legacy `assignments.controller.js`, `assignments.service.js`, `assignments.repository.js`, `assignments.routes.js`, `assignment.validator.js` (Checkpoint 8)
- Other CRUD modules (notes, attendance, subjects, semesters, placement, onboarding) — their own Checkpoints
- Storage, notifications (already done), study rooms, analytics, AI

## Follow-ups (tracked, not in scope)

- Add `subject:Subject(name)` join to `getAll` for UX improvement — Option A from the design summary. Defer until after Checkpoint 5a is fully verified.
