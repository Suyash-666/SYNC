# Checkpoint 5c — Attendance CRUD → Supabase PostgREST Plan

> Scope: Move all four Attendance endpoints (`GET /subjects/:id/attendance`,
> `POST /subjects/:id/attendance`, `PUT /subjects/:id/attendance/:date`,
> `GET /users/attendance/summary`) from the Node backend to direct
> `supabase.from('AttendanceRecord')` calls. RLS enforces ownership.
> The legacy routes, controller, service, repository, and validator
> stay on disk behind the `crud` feature flag.
>
> Approach: **Feature-flag gated.** The new path activates only when
> `VITE_USE_SUPABASE=crud` (or `all`). The legacy path remains
> available.

## Design summary

1. **Table** — `AttendanceRecord` (from `0001_init_schema.sql`).
   Composite unique: `(subject_id, date)`. RLS from `0004_link_auth.sql`
   enforces `user_id = auth.uid()`.
2. **CRUD via PostgREST** — `supabase.from('AttendanceRecord').select()/
   insert()/update()/delete()`.
3. **Upsert** — `mark(subjectId, payload)` uses
   `.upsert(row, { onConflict: 'subject_id,date' })` to match the
   legacy `prisma.attendanceRecord.upsert` behavior. The legacy
   `upsert` creates if missing, updates if present.
4. **Update by date** — `update(subjectId, date, payload)` uses
   `.update({status}).eq('subject_id', id).eq('date', date)`. Note
   that `date` is stored as a TIMESTAMPTZ; the legacy code passes
   `new Date(date)` and matches on the exact value. The new path
   matches the same way.
5. **getSummary** — the legacy `attendance.service.summaryForCurrent
   Semester` queries the current semester's subjects, then per
   subject runs `calculateAttendanceStats` which does 3 `count`
   queries. The Supabase path uses a single PostgREST query per
   subject with `.select('status', { count: 'exact', head: false })`
   grouped via client-side aggregation, or three separate `.eq('status',
   'PRESENT')` / `.eq('status', 'ABSENT')` / base counts. Going with
   the three-count approach for parity with the legacy
   (predictable query plan, easy to test).
6. **Filter mapping** — `month`/`year` on `getBySubject` translate to
   a date range filter. The legacy builds `new Date(year, month-1, 1)`
   → `new Date(year, month, 1)`. PostgREST: `.gte('date', start).lt('date', end)`.
7. **Response shapes** — `getBySubject` returns an array directly
   (no pagination, no wrapper). `mark`/`update` return a single
   record. `getSummary` returns an array of
   `{subject: {id, name}, stats: {total, present, absent, percentage}}`
   objects — same as legacy.

## File-by-file scope

### Created (2)

| File | Purpose |
|---|---|
| `frontend/design-system/src/api/attendance.api.supabase.js` | New implementation. Four methods: `getBySubject`, `mark`, `update`, `getSummary`. |
| `frontend/design-system/src/api/attendance.api.legacy.js` | Pre-Checkpoint-5c code, moved verbatim. Used when the flag is off. |

### Modified (1)

| File | Change |
|---|---|
| `frontend/design-system/src/api/attendance.api.js` | Becomes a 6-line facade. Picks `legacy` or `supabaseImpl` based on `isEnabled('crud')`. |

### NOT modified in Checkpoint 5c

- `backend/**` — **zero changes.** All Attendance routes, controller, service, repository, validator stay live.
- `frontend/design-system/src/lib/mappers.js` — `mapNote`/`mapAssignment` etc. don't touch attendance.
- `frontend/design-system/src/hooks/use*.js` — there is no `useAttendance.js`; pages call `attendanceApi` directly.
- `frontend/design-system/src/lib/supabase.js` — `getSupabaseForUser`, `getSupabaseAccessToken` reused.
- All other API modules, hooks, pages, components.

## Response-shape preservation

| Method | Legacy returns | Supabase returns | Match |
|---|---|---|---|
| `getBySubject(subjectId, params)` | array of `AttendanceRecord` rows (after `unwrap` of `ApiResponse.success(records, 'Attendance records')`) | array of `AttendanceRecord` rows from `.select('*').eq('subject_id', id).order('date', {ascending:false})` | ✅ Identical |
| `mark(subjectId, payload)` | single `AttendanceRecord` row (after `unwrap` of `ApiResponse.success(rec, 'Attendance marked', 201)`) | single `AttendanceRecord` row from `.upsert(row, {onConflict:'subject_id,date'}).select('*').single()` | ✅ Identical |
| `update(subjectId, date, payload)` | single `AttendanceRecord` row (after `unwrap` of `ApiResponse.success(rec, 'Attendance updated')`) | single `AttendanceRecord` row from `.update(row).eq('subject_id', id).eq('date', date).select('*').single()` | ✅ Identical |
| `getSummary()` | array of `{subject: {id, name}, stats: {total, present, absent, percentage}}` (after `unwrap` of `ApiResponse.success(data, 'Attendance summary')`) | same shape, assembled client-side | ✅ Identical |

`mark`/`update` consumers are pages that display the result. The single-row shape is what the page expects.

## Upsert and update semantics

**Legacy `upsert` (backend/src/repositories/attendance.repository.js:17-25):**
```js
prisma.attendanceRecord.upsert({
  where: { subject_id_date: { subject_id, date } },
  update: { status },
  create: { subject_id, user_id, date, status }
});
```

**Supabase equivalent:**
```js
c.from('AttendanceRecord').upsert(
  { subject_id, user_id, date, status },
  { onConflict: 'subject_id,date' }
).select('*').single();
```

The PostgREST `onConflict` parameter must match the unique constraint name or columns. The constraint is `attendance_subject_date_unique` (named) on `(subject_id, date)` (columns). PostgREST accepts either. We use the column names.

**Legacy `updateByDate`:**
```js
prisma.attendanceRecord.updateMany({
  where: { subject_id, date },
  data: { status }
});
```

`updateMany` is mass-update (no return value, doesn't fail if 0 rows match). The Supabase equivalent:
```js
c.from('AttendanceRecord')
  .update({ status })
  .eq('subject_id', id)
  .eq('date', date)
  .select('*')           // <-- differs: this returns rows
  .single();              // <-- this throws if 0 rows
```

This is a **subtle behavioral difference**: PostgREST with `.select().single()` will throw if 0 rows match; Prisma `updateMany` does not. The legacy `attendance.controller.update` calls `updateByDate` which is a `updateMany` — it does not fail on 0 rows. The new path would throw a 0-rows error in that case.

**Mitigation:** the new path uses `.update({status}).eq(...).eq(...)` WITHOUT `.single()`. The result is either an array of updated rows or an empty array. The Supabase path returns the **first** updated row if any, or `null` if none. This matches the legacy "return whatever the controller said" — which is a record, but the record is allowed to be `null` if nothing was updated. The frontend's `markRead` and similar consumers do not actually read the response of `update`, so the difference is invisible.

**Action:** the new path does:
```js
const { data, error } = await c
  .from('AttendanceRecord')
  .update({ status })
  .eq('subject_id', subjectId)
  .eq('date', date);
if (error) throw new Error(error.message);
return data && data[0] ? data[0] : null;
```

The returned `null` on no-match is the equivalent of the legacy's silent no-op.

## getSummary implementation

Legacy `attendance.service.summaryForCurrentSemester`:
1. Find current semester for user (`is_current: true`)
2. Find subjects in that semester
3. For each subject, count total/present/absent attendance records
4. Return `[{subject: {id, name}, stats: {total, present, absent, percentage}}, ...]`

Supabase path:
1. Find current semester: `c.from('Semester').select('id').eq('user_id', userId).eq('is_current', true).single()`
2. Find subjects in that semester: `c.from('Subject').select('id, name').eq('semester_id', semesterId)`
3. For each subject, run three counts:
   - `.from('AttendanceRecord').select('*', {count:'exact', head:true}).eq('subject_id', id).eq('user_id', userId)`
   - Same with `.eq('status', 'PRESENT')`
   - Same with `.eq('status', 'ABSENT')`
4. Compute `percentage = total === 0 ? 0 : Math.round((present / total) * 100)`
5. Return assembled array

**Performance note:** the legacy does 3 queries per subject (so N+1). The new path does the same. For parity, we accept this. A future optimization could use a single PostgREST RPC.

**Edge case:** if no current semester exists, the legacy returns `[]`. The new path does the same.

**Edge case:** if a subject has zero attendance records, the legacy returns `{total:0, present:0, absent:0, percentage:0}`. The new path does the same.

## Filter mapping

| Legacy filter | PostgREST |
|---|---|
| `month` + `year` on `getBySubject` | `.gte('date', start).lt('date', end)` where start = first of month, end = first of next month |
| (always) | `.eq('subject_id', subjectId)` |
| (always) | `.order('date', {ascending:false})` — matches legacy `orderBy: { date: 'desc' }` |

## `date` handling

The legacy code stores `date` as a `TIMESTAMPTZ`. The frontend passes a string in the payload (e.g., `'2026-06-04'`). The legacy does `new Date(date)` to coerce.

PostgREST's `eq('date', value)` accepts ISO strings. The new path passes the date string directly to the filter (and lets Supabase's serializer handle it). The new path stores dates via `upsert` — Supabase expects a date or ISO string for a `timestamptz` column.

**Compatibility:** the legacy `upsert` uses `new Date(date)` which produces a JS Date. The new path passes the string. Both should round-trip through Supabase's `timestamptz` correctly.

## Feature flag behavior

Same as 5a/5b. `isEnabled('crud')` flips the new path on. Modules 5a, 5b, 5c all flip together.

## Migration order

1. Confirm Checkpoint 5b is fully verified.
2. Create `attendance.api.supabase.js` and `attendance.api.legacy.js`.
3. Replace `attendance.api.js` with the facade.
4. Smoke test: flag OFF (regression), then flag ON (new path).
5. Run the test checklist.

## Rollback commands

```bash
git checkout -- frontend/design-system/src/api/attendance.api.js
rm -f \
  frontend/design-system/src/api/attendance.api.supabase.js \
  frontend/design-system/src/api/attendance.api.legacy.js
```

Backend is untouched. The pre-Checkpoint-5c `attendance.api.js` content is preserved verbatim in `attendance.api.legacy.js`.

## Testing checklist

### Pre-flight

- [ ] `0001_init_schema.sql` applied (AttendanceRecord table exists with unique constraint on `(subject_id, date)`)
- [ ] `0004_link_auth.sql` applied (RLS uses `auth.uid()`)
- [ ] `0005_storage_policies.sql` applied (Checkpoint 3 prerequisite)
- [ ] `0003_realtime.sql` applied (Checkpoint 4 prerequisite)
- [ ] `frontend/design-system/.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] `frontend/design-system/package.json` declares `@supabase/supabase-js`

### RLS probe

```sql
-- 1. AttendanceRecord RLS policies
SELECT policyname, cmd FROM pg_policies
 WHERE schemaname = 'public' AND tablename = 'AttendanceRecord';
-- expect: 4 rows for attendance_owner

-- 2. Unique constraint exists
SELECT conname, contype FROM pg_constraint
 WHERE conrelid = '"AttendanceRecord"'::regclass AND contype = 'u';
-- expect: 1 row with conname = 'attendance_subject_date_unique'

-- 3. Cross-user isolation
SET LOCAL request.jwt.claim.sub = '<user-A-uuid>';
SELECT id FROM "AttendanceRecord" WHERE user_id = '<user-B-uuid>';
-- expect: 0 rows
```

### Regression (flag OFF — VITE_USE_SUPABASE unset)

- [ ] `npm run dev` boots, no console errors
- [ ] Open `/subjects/:id` or whichever page renders attendance — list loads
- [ ] Mark attendance for a date → record appears in list
- [ ] Update attendance for an existing date → record updates
- [ ] Filter by `month=6&year=2026` → only June 2026 records shown
- [ ] `getSummary()` (e.g., on the dashboard) returns subjects with stats

### New path (flag ON — VITE_USE_SUPABASE=crud)

- [ ] **M2 boot-order smoke test** — load `/`, log in, navigate to an attendance-bearing page — initial `getBySubject` succeeds
- [ ] DevTools Network → filter `supabase.co` → see GET on
      `/rest/v1/AttendanceRecord?select=*&subject_id=eq.<id>&order=date.desc`
- [ ] Mark attendance for a date → DevTools shows a POST or PATCH on
      `/rest/v1/AttendanceRecord?on_conflict=subject_id,date`
- [ ] Table Editor → `AttendanceRecord` shows the new row with the
      correct `user_id`, `subject_id`, `date`, `status`
- [ ] Mark the same date again with a different status → row's `status`
      updates (upsert behavior)
- [ ] Update attendance for an existing date → row updates
- [ ] Update attendance for a non-existent date → silent no-op
      (returns null; page may not show anything new — that's expected)
- [ ] Filter by `month=6&year=2026` → URL includes
      `date=gte.2026-06-01&date=lt.2026-07-01`
- [ ] `getSummary()` → returns array of `{subject: {id, name}, stats: {total, present, absent, percentage}}` for each subject in the current semester
- [ ] A subject with no attendance records → stats are `{total:0, present:0, absent:0, percentage:0}`
- [ ] A user with no current semester → returns `[]`

### Cross-user isolation (flag ON)

- [ ] Sign in as user A in tab 1, user B in tab 2
- [ ] User B's `getBySubject(<user-A's subject id>)` returns `[]` (RLS blocks)
- [ ] User B's `getSummary()` does not include user A's subjects

### Upsert edge case (flag ON)

- [ ] Insert a record with `(subject_id, date) = (X, Y)` — succeeds
- [ ] Insert again with same `(X, Y)` and a different `status` — updates
      the existing row (no duplicate)
- [ ] Table Editor shows exactly 1 row for `(X, Y)`

### updateByDate edge case (flag ON)

- [ ] `update(subjectId, '2026-06-04', {status:'PRESENT'})` when no row
      exists for that date — no error thrown (Supabase returns
      `data: []`); the call returns `null`
- [ ] `update(subjectId, '2026-06-04', {status:'PRESENT'})` when a row
      exists — row's `status` updates; call returns the row

### date handling (flag ON)

- [ ] `mark(subjectId, {date:'2026-06-04', status:'PRESENT'})` — DB row
      has `date = '2026-06-04T00:00:00Z'` (or similar ISO)
- [ ] `mark(subjectId, {date:'2026-06-04T10:30:00.000Z', status:'PRESENT'})`
      — DB row preserves the timestamp

### Cross-check

- [ ] `git status` shows only the files listed. No deletions.
- [ ] `curl -H "Authorization: Bearer <access>" 'http://localhost:5000/api/v1/subjects/<subjectId>/attendance'` still works
- [ ] Assignments (5a) and Notes (5b) modules still work with the same flag
- [ ] Other API modules unaffected

### Rollback dry-run

- [ ] `git checkout -- frontend/design-system/src/api/attendance.api.js`
- [ ] `rm` the two new files
- [ ] `npm run dev` still works
- [ ] Attendance page loads via the legacy endpoint

## Exit criteria for Checkpoint 5c

All of the following must be true before Checkpoint 5d (Subjects) begins:

- All pre-flight, regression, new-path, and cross-user-isolation checks pass
- All 6 verify gates from `MIGRATION_RULES.md §8` are green for the attendance module
- The shared `lib/supabase.js` and `lib/featureFlags.js` are not modified by this Checkpoint
- The `updateByDate` no-op behavior is verified (silent when 0 rows match)
- The upsert conflict resolution is verified (1 row, not 2)
- Rollback dry-run passes

## Out-of-scope for Checkpoint 5c

- Optimizing `getSummary` from N+1 to a single RPC (future enhancement)
- Removing the legacy `/api/v1/.../attendance/...` endpoints (Checkpoint 8)
- Removing the legacy `attendance.controller.js`, `attendance.service.js`, `attendance.repository.js`, `attendance.routes.js` (Checkpoint 8)
- Other CRUD modules (subjects, semesters, placement, onboarding) — their own Checkpoints
