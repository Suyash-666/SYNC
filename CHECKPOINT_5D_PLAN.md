# Checkpoint 5d — Subjects CRUD → Supabase PostgREST Plan

> Scope: Move all ten Subject-related endpoints from the Node backend
> to direct PostgREST calls. The endpoints are mounted in two
> different ways:
>   - Nested: `/semesters/:semesterId/subjects` (getBySemester, create)
>   - Standalone: `/subjects/:id` (getById, update, delete)
>   - Nested under subject: `/subjects/:subjectId/modules/...` and
>     `/topics/:topicId/toggle` (module CRUD + topic toggle)
> All become flat `supabase.from('Subject'/'Module'/'Topic')` calls.
> RLS enforces ownership. The legacy routes, controller, service,
> repository, and validator stay on disk behind the `crud` feature flag.

## Design summary

1. **Tables** — `Subject`, `Module`, `Topic` (from `0001_init_schema.sql`).
   RLS from `0004_link_auth.sql`:
   - `Subject` is owned transitively via `Semester` (`subject_via_semester`)
   - `Module` is owned transitively via `Subject → Semester` (`module_via_subject`)
   - `Topic` is owned transitively via `Module → Subject → Semester` (`topic_via_module`)
2. **CRUD via PostgREST** — flat `.from('Subject'/'Module'/'Topic')` calls.
3. **`getById` nested shape** — the legacy
   `subjects.repository.findByIdWithRelations(id)` returns:
   ```js
   { id, semester_id, name, ..., modules: [{id, name, order_index, topics:[{id,name,is_completed}]}], attendance_records: [...] }
   ```
   The Supabase path uses PostgREST resource embedding:
   `select('*, modules(*, topics(*)), attendance_records(*)')`
   to return the same nested shape. RLS will filter the embedded
   relations to the user's own data automatically.
4. **Module/topic mutations** — drop the `/subjects/:subjectId` URL
   prefix. The schema already has `subject_id` on `Module` and
   `module_id` on `Topic`. Operations become:
   - `addModule(subjectId, {name, order_index})` → `.from('Module').insert({subject_id, ...}).select().single()`
   - `updateModule(subjectId, moduleId, payload)` → `.from('Module').update(payload).eq('id', moduleId)`
   - `deleteModule(subjectId, moduleId)` → `.from('Module').delete().eq('id', moduleId)`
   - `toggleTopic(subjectId, topicId)` → read current `is_completed`, flip, update
5. **No pagination wrapper** — `getBySemester` returns an array directly
   (the legacy `subjects.controller.list` returns the array, not a
   paginated object).

## File-by-file scope

### Created (2)

| File | Purpose |
|---|---|
| `frontend/design-system/src/api/subjects.api.supabase.js` | New implementation. Ten methods matching the legacy module. |
| `frontend/design-system/src/api/subjects.api.legacy.js` | Pre-Checkpoint-5d code, moved verbatim. |

### Modified (1)

| File | Change |
|---|---|
| `frontend/design-system/src/api/subjects.api.js` | Becomes a 6-line facade. |

### NOT modified in Checkpoint 5d

- `backend/**` — **zero changes.**
- `frontend/design-system/src/hooks/useSemester.js` — untouched. It calls `subjectsApi.getBySemester(semesterId)`, which the new module exports.
- `frontend/design-system/src/lib/supabase.js` — reused.
- All other API modules, hooks, pages, components.

## Response-shape preservation

| Method | Legacy returns | Supabase returns | Match |
|---|---|---|---|
| `getBySemester(semesterId)` | array of `Subject` rows | array of `Subject` rows from `.from('Subject').select('*').eq('semester_id', semesterId)` | ✅ Identical |
| `getById(id)` | subject with nested `modules[topics[]]` and `attendance_records[]` | subject with same nested shape from `select('*, modules(*, topics(*)), attendance_records(*)')` | ✅ Identical |
| `create(semesterId, payload)` | `Subject` row | `Subject` row from `.insert({semester_id, ...}).select().single()` | ✅ Identical |
| `update(id, payload)` | `Subject` row | `Subject` row from `.update().eq('id', id).select().single()` | ✅ Identical |
| `delete(id)` | `{success, message}` envelope with `data: null` | `null` from `.delete().eq('id', id)` | ⚠️ Mismatch (consumer doesn't read response — see L1) |
| `addModule(subjectId, payload)` | `Module` row | `Module` row from `.insert({subject_id, ...}).select().single()` | ✅ Identical |
| `updateModule(subjectId, moduleId, payload)` | `Module` row | `Module` row from `.update(payload).eq('id', moduleId).select().single()` | ✅ Identical |
| `deleteModule(subjectId, moduleId)` | `{success, message}` envelope with `data: null` | `null` from `.delete().eq('id', moduleId)` | ⚠️ Mismatch (consumer doesn't read response) |
| `toggleTopic(subjectId, topicId)` | `Topic` row (the toggled one) | `Topic` row from read-then-flip-then-update | ✅ Identical |
| `getBySemester` (alias `listBySemester`), `delete` (alias `remove`), `deleteModule` (alias `removeModule`) | n/a | n/a (aliases are wired at the module level) | ✅ Identical |

**L1 / L2 (delete response shapes):** No consumer in the codebase reads the response of `subjectsApi.delete` or `subjectsApi.deleteModule`. The hook at `useSemester.js` (which the only grep hit reveals) calls `subjectsApi.getBySemester` and does not call delete. Pages that delete subjects/modules do not read the response — they invalidate React Query. Safe mismatch.

## getById nested-shape details

Legacy shape:
```js
{
  id, semester_id, name, subject_code, total_modules, completed_modules,
  internal_max_marks, internal_scored,
  modules: [
    { id, name, order_index, topics: [{ id, name, is_completed }] }
  ],
  attendance_records: [{ id, date, status, ... }]
}
```

Supabase path uses PostgREST resource embedding. Two equivalent syntaxes:

**Option A (recommended — string syntax):**
```js
c.from('Subject')
  .select('*, modules(*, topics(*)), attendance_records(*)')
  .eq('id', id)
  .single()
```

**Option B (nested-array syntax — works in v2.106.x):**
```js
.select(`*, modules:Module(*, topics:Topic(*)), attendance_records:AttendanceRecord(*)`)
```

Option A is the standard PostgREST shorthand and the only fully portable form. Option B requires the FK relationship to be detectable by PostgREST (which it is in our schema since `Module.subject_id → Subject.id` and `Topic.module_id → Module.id` are defined). Going with **Option A**.

The returned rows from Option A look like:
```js
{
  id, semester_id, name, ...,
  modules: [{ id, subject_id, name, order_index, topics: [{ id, module_id, name, is_completed }] }],
  attendance_records: [{ id, subject_id, user_id, date, status, created_at }]
}
```

**Field order note:** the legacy has `subject_id` on the modules and topics; the Supabase shape has the same. ✅

## toggleTopic implementation

The legacy `subjects.service.toggleTopic`:
```js
const topic = await prisma.topic.findUnique({ where: { id: topicId } });
if (!topic) throw new ApiError('Topic not found', 404);
return prisma.topic.update({ where: { id: topicId }, data: { is_completed: !topic.is_completed } });
```

Supabase path:
```js
const { data: topic, error: e1 } = await c
  .from('Topic')
  .select('id, is_completed')
  .eq('id', topicId)
  .single();
if (e1) throw new Error(e1.message);
if (!topic) throw new Error('Topic not found');

const { data, error: e2 } = await c
  .from('Topic')
  .update({ is_completed: !topic.is_completed })
  .eq('id', topicId)
  .select('*')
  .single();
if (e2) throw new Error(e2.message);
return data;
```

The `subjectId` parameter is not used server-side (the topic's own `module_id` resolves the parent chain), but the legacy API requires it for URL symmetry. The new path accepts it but ignores it. This matches the legacy controller's behavior — `subjects.controller.toggleTopic` does not use `subjectId` either.

**404 handling:** the legacy throws `ApiError('Topic not found', 404)`. The new path throws `Error('Topic not found')` — a plain error, not a 404. The consumer (a page or hook) will see this as a generic error, not a specific "not found" code. This is an acceptable difference — the consumer typically just shows "could not toggle" and re-fetches.

## Module/topic route simplification

The legacy routes are nested for REST aesthetics (`/subjects/:id/modules/:moduleId`). The Supabase path doesn't need URL nesting because the schema already encodes the relationships. The methods just take the IDs that matter and operate on the relevant table.

For example, `deleteModule(subjectId, moduleId)`:
- Legacy: `DELETE /subjects/:id/modules/:moduleId` → backend verifies `moduleId` belongs to `subjectId` (via the controller's lack of explicit check, actually — the controller just calls `SubjectsRepo.deleteModule(moduleId)`, which doesn't verify the parent relationship)
- Supabase: `.from('Module').delete().eq('id', moduleId)` — RLS ensures the user owns the module's parent subject. The `subjectId` parameter is unused in the new path (like in the legacy path).

This means a user who supplies a wrong `subjectId` for a module they own will still succeed in both paths. The behavior is identical (both legacy and new paths ignore the parent-id check). Not a Checkpoint 5d regression.

## Feature flag behavior

Same as 5a/5b/5c. `isEnabled('crud')`.

## Migration order

1. Confirm Checkpoint 5c is fully verified.
2. Create `subjects.api.supabase.js` and `subjects.api.legacy.js`.
3. Replace `subjects.api.js` with the facade.
4. Smoke test: flag OFF (regression), then flag ON (new path).
5. Run the test checklist.

## Rollback commands

```bash
git checkout -- frontend/design-system/src/api/subjects.api.js
rm -f \
  frontend/design-system/src/api/subjects.api.supabase.js \
  frontend/design-system/src/api/subjects.api.legacy.js
```

Backend is untouched. Pre-Checkpoint-5d bytes preserved in `subjects.api.legacy.js`.

## Testing checklist

### Pre-flight

- [ ] `0001_init_schema.sql` applied (Subject, Module, Topic tables with FKs)
- [ ] `0004_link_auth.sql` applied (RLS uses `auth.uid()` transitively)
- [ ] `0005_storage_policies.sql` applied (Checkpoint 3 prerequisite)
- [ ] `0003_realtime.sql` applied (Checkpoint 4 prerequisite)
- [ ] `frontend/design-system/.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] `frontend/design-system/package.json` declares `@supabase/supabase-js`

### RLS probe

```sql
-- 1. Subject policies (transitive via Semester)
SELECT policyname, cmd FROM pg_policies
 WHERE schemaname = 'public' AND tablename = 'Subject';
-- expect: at least 1 row for subject_via_semester (FOR ALL = 4 cmds)

-- 2. Module policies (transitive via Subject → Semester)
SELECT policyname, cmd FROM pg_policies
 WHERE schemaname = 'public' AND tablename = 'Module';
-- expect: at least 1 row for module_via_subject

-- 3. Topic policies (transitive via Module → Subject → Semester)
SELECT policyname, cmd FROM pg_policies
 WHERE schemaname = 'public' AND tablename = 'Topic';
-- expect: at least 1 row for topic_via_module

-- 4. Cross-user isolation
SET LOCAL request.jwt.claim.sub = '<user-A-uuid>';
SELECT id FROM "Subject" WHERE semester_id IN (
  SELECT id FROM "Semester" WHERE user_id = '<user-B-uuid>'
);
-- expect: 0 rows
```

### Regression (flag OFF)

- [ ] `npm run dev` boots, no console errors
- [ ] Navigate to a semester workspace → list of subjects loads
- [ ] Click a subject → detail loads (with modules + topics + attendance)
- [ ] Create a subject → list updates
- [ ] Edit a subject → updates in list and detail
- [ ] Delete a subject → removed from list
- [ ] Add a module → appears in subject detail
- [ ] Edit a module → updates
- [ ] Delete a module → removed
- [ ] Toggle a topic → flips is_completed

### New path (flag ON)

- [ ] **M2 boot-order smoke test** — load `/`, log in, navigate to a semester workspace — initial `getBySemester` succeeds
- [ ] DevTools Network → filter `supabase.co` → see GET on
      `/rest/v1/Subject?select=*&semester_id=eq.<id>`
- [ ] Click a subject → see GET on
      `/rest/v1/Subject?select=*,modules(*,topics(*)),attendance_records(*)&id=eq.<id>`
- [ ] Verify the response has nested `modules` and `attendance_records` arrays
- [ ] Supabase Table Editor → `Subject` row count matches
- [ ] Create via UI → POST on `/rest/v1/Subject`; list updates
- [ ] Table Editor shows new row with correct `semester_id`
- [ ] Edit via UI → PATCH; list updates
- [ ] Delete via UI → DELETE; list updates
- [ ] Add a module via UI → POST on `/rest/v1/Module` with `subject_id`; subject detail updates
- [ ] Edit a module via UI → PATCH on `/rest/v1/Module?id=eq.<id>`
- [ ] Delete a module via UI → DELETE on `/rest/v1/Module?id=eq.<id>`
- [ ] Toggle a topic via UI → PATCH on `/rest/v1/Topic?id=eq.<id>` with flipped `is_completed`

### Cross-user isolation (flag ON)

- [ ] User B cannot read user A's subjects (RLS via Semester)
- [ ] User B cannot add a module to user A's subject
- [ ] User B cannot toggle user A's topics
- [ ] SQL: as user B, `SELECT id FROM "Subject" WHERE semester_id IN (SELECT id FROM "Semester" WHERE user_id = '<user-A-uuid>')` → 0 rows

### Nested getById (flag ON)

- [ ] Response includes `modules` array; each module has `topics` array
- [ ] Response includes `attendance_records` array
- [ ] Empty subject (no modules, no attendance) → both arrays are `[]`
- [ ] Module ordering matches `order_index`

### toggleTopic edge case (flag ON)

- [ ] Toggle a topic with `is_completed=false` → returns row with `is_completed=true`
- [ ] Toggle again → returns row with `is_completed=false`
- [ ] Toggle a non-existent topic → throws "Topic not found" (or similar)

### Module ownership (flag ON)

- [ ] A module can be added only to a subject the user owns (RLS blocks otherwise)
- [ ] A module cannot be moved between subjects (no `subject_id` change in update; that's the only safety)
- [ ] A user cannot delete another user's module

### Cross-check

- [ ] `git status` shows only the files listed. No deletions.
- [ ] `curl -H "Authorization: Bearer <access>" http://localhost:5000/api/v1/subjects/<id>` still works
- [ ] `curl -H "Authorization: Bearer <access>" 'http://localhost:5000/api/v1/semesters/<id>/subjects'` still works
- [ ] Assignments (5a), Notes (5b), Attendance (5c) still work with the same flag
- [ ] Other API modules unaffected

### Rollback dry-run

- [ ] `git checkout -- frontend/design-system/src/api/subjects.api.js`
- [ ] `rm` the two new files
- [ ] `npm run dev` still works
- [ ] Semester workspace loads subjects via the legacy endpoint

## Exit criteria for Checkpoint 5d

All of the following must be true before Checkpoint 5e (Semesters) begins:

- All pre-flight, regression, new-path, and cross-user-isolation checks pass
- All 6 verify gates from `MIGRATION_RULES.md §8` are green for the subjects module
- The shared `lib/supabase.js` and `lib/featureFlags.js` are not modified
- The nested `getById` shape (with `modules[topics[]]` and `attendance_records[]`) is verified
- The `toggleTopic` flip behavior is verified
- Rollback dry-run passes

## Out-of-scope for Checkpoint 5d

- Removing the legacy `/api/v1/.../subjects/...` endpoints (Checkpoint 8)
- Removing the legacy `subjects.controller.js`, `subjects.service.js`, `subjects.repository.js`, `subjects.routes.js`, `subject.validator.js` (Checkpoint 8)
- Other CRUD modules (semesters, placement, onboarding) — their own Checkpoints
- Frontend reordering of modules by `order_index` (server returns them in DB order; the consumer may sort if it wants display order)
