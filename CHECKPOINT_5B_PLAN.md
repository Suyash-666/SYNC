# Checkpoint 5b — Notes CRUD → Supabase PostgREST Plan

> Scope: Move all six Note endpoints (`GET /notes`, `GET /notes/:id`,
> `POST /notes`, `PATCH /notes/:id`, `DELETE /notes/:id`,
> `GET /notes/folders`) from the Node backend to direct
> `supabase.from('Note')` calls. RLS enforces ownership. The legacy
> routes, controller, service, repository, and validator stay on disk
> behind the `crud` feature flag.
>
> Approach: **Feature-flag gated.** The new path activates only when
> `VITE_USE_SUPABASE=crud` (or `all`). The legacy path remains
> available.

## Design summary

1. **Table** — `Note` (from `0001_init_schema.sql`). RLS from
   `0004_link_auth.sql` enforces `user_id = auth.uid()`. `tags` is a
   `TEXT[]`.
2. **CRUD via PostgREST** — `supabase.from('Note').select()/insert()/
   update()/delete()` with `.eq('user_id', userId)` where useful
   (defense in depth).
3. **Soft delete** — `delete(id)` does NOT remove the row. It sets
   `is_deleted = true`. The `getAll` filter excludes `is_deleted`
   rows. This matches the legacy `softDelete` behavior.
4. **Filter mapping** — the legacy `notes.repository.js` supports
   `folder`, `tags`, `search`. PostgREST equivalents:
   - `folder` → `.eq('folder', folder)`
   - `tags` → `.overlaps('tags', [...])` (array overlap, matches Prisma's `hasSome`)
   - `search` → `.ilike('title', '*<search>*')` (case-insensitive contains)
5. **Sort order** — `updated_at desc` (matches legacy `orderBy: { updated_at: 'desc' }`).
6. **`getFolders`** — distinct folder names for the user. PostgREST
   RPC or a `select('folder')` followed by client-side dedup. We'll
   use `.select('folder').neq('folder', null)` and dedup in JS —
   matches the legacy `notes.repository.distinctFolders` exactly.
7. **Tags array** — the legacy `note.validator.js` accepts `tags` as
   `z.array(z.string())`. The Supabase path accepts the same shape
   and stores it as `TEXT[]`. Empty array is the default per
   `0001_init_schema.sql`.
8. **`useNotes.js` latent bug** — the legacy consumer at
   `useNotes.js:36` does `(notesQuery.data || []).map(mapNote)`. The
   legacy backend returns `{data: [...], pagination: {...}}` so this
   maps `mapNote` over the wrapper object, not the array. This is
   pre-existing behavior; the Supabase path will produce identical
   output. **Not a Checkpoint 5b regression.** Documented in §
   "Pre-existing latent bug" below.

## File-by-file scope

### Created (2)

| File | Purpose |
|---|---|
| `frontend/design-system/src/api/notes.api.supabase.js` | New implementation. Six methods: `getAll`, `getById`, `create`, `update`, `delete` (soft), `getFolders`. |
| `frontend/design-system/src/api/notes.api.legacy.js` | Pre-Checkpoint-5b code, moved verbatim. Used when the flag is off. |

### Modified (1)

| File | Change |
|---|---|
| `frontend/design-system/src/api/notes.api.js` | Becomes a 6-line facade. Picks `legacy` or `supabaseImpl` based on `isEnabled('crud')`. |

### NOT modified in Checkpoint 5b

- `backend/**` — **zero changes.** All Note routes, controller, service, repository, validator stay live.
- `frontend/design-system/src/hooks/useNotes.js` — untouched. Its dependency on `notesApi` is unchanged in shape.
- `frontend/design-system/src/lib/mappers.js` — `mapNote` already consumes snake_case fields.
- `frontend/design-system/src/lib/supabase.js` — `getSupabaseForUser`, `getSupabaseAccessToken` reused.
- All other API modules, hooks, pages, components.

## Response-shape preservation

| Method | Legacy returns | Supabase returns | Match |
|---|---|---|---|
| `getAll(params)` | `{data: Note[], pagination: {total, page, limit, totalPages}}` (after `unwrap` of `ApiResponse.success(result.data, 'Notes', 200, { pagination: result.pagination })`) | `{data: rows, pagination: {total, page, limit, totalPages}}` (assembled from `.range(from,to).select('*',{count:'exact'})` with `is_deleted` filter) | ✅ Identical |
| `getById(id)` | `Note` row object (after `unwrap`) | `Note` row object from `.select('*').eq('id', id).single()` | ✅ Identical |
| `create(payload)` | `Note` row object | `Note` row object from `.insert(row).select('*').single()` | ✅ Identical |
| `update(id, payload)` | `Note` row object | `Note` row object from `.update(row).eq('id', id).select('*').single()` | ✅ Identical |
| `delete(id)` | `{success, message}` envelope with `data: null` (backend `ApiResponse.success(null, 'Note deleted')`) | `null` from `.update({is_deleted:true}).eq('id', id)` | ⚠️ Mismatch (consumer doesn't read the response — see L1) |
| `getFolders()` | array of folder strings (e.g., `['Semester 4', 'Personal']`) | array of folder strings, deduped | ✅ Identical |

**L1 (delete response shape):** The only consumer of `notesApi.delete` is `useNotes.js:31` (`deleteMutation`). The hook's `onSuccess` only calls `invalidateQueries`; it does not read the response body. The mismatch is safe.

## Soft delete vs hard delete

The legacy `notes.service.deleteNote` calls `NotesRepo.softDelete(id)` which sets `is_deleted = true`. The Supabase path replicates this:

```js
const { error } = await c.from('Note').update({ is_deleted: true }).eq('id', id);
```

The `getAll` filter `is_deleted = false` (or equivalent `.is('is_deleted', false)` in PostgREST) ensures soft-deleted notes are excluded from listings.

## Filter mapping

| Legacy filter | PostgREST |
|---|---|
| `folder` | `.eq('folder', folder)` |
| `tags` (array) | `.overlaps('tags', tags)` — matches Prisma's `hasSome` semantics |
| `search` | `.ilike('title', '%' + search + '%')` — case-insensitive contains |
| (always) | `.eq('is_deleted', false)` |

## getFolders implementation

The legacy `notes.repository.distinctFolders` does:
```js
const rows = await prisma.note.findMany({ where: { user_id, is_deleted: false }, select: { folder: true } });
const set = new Set(rows.map(r => r.folder).filter(Boolean));
return Array.from(set);
```

The Supabase path:
```js
const { data, error } = await c
  .from('Note')
  .select('folder')
  .eq('user_id', userId)
  .eq('is_deleted', false);
if (error) throw new Error(error.message);
const set = new Set((data || []).map(r => r.folder).filter(Boolean));
return Array.from(set);
```

**Note:** RLS would already filter by `user_id` server-side. The explicit `.eq('user_id', userId)` is defense in depth and makes the intent clear.

## Feature flag behavior

Same as 5a. `isEnabled('crud')` flips the new path on. The same flag also activates the assignments (5a) path and all future CRUD modules (5c–5g).

## Migration order

1. Confirm Checkpoint 5a is fully verified.
2. Create `notes.api.supabase.js` and `notes.api.legacy.js`.
3. Replace `notes.api.js` with the facade.
4. Smoke test: flag OFF (regression), then flag ON (new path).
5. Run the test checklist.

## Rollback commands

```bash
git checkout -- frontend/design-system/src/api/notes.api.js
rm -f \
  frontend/design-system/src/api/notes.api.supabase.js \
  frontend/design-system/src/api/notes.api.legacy.js
```

Backend is untouched. The pre-Checkpoint-5b `notes.api.js` content is preserved verbatim in `notes.api.legacy.js`, so `git checkout --` restores the exact bytes.

## Pre-existing latent bug (NOT in scope)

`useNotes.js:36` does `(notesQuery.data || []).map(mapNote)`. The legacy backend returns `{data: [...], pagination: {...}}` (an object, not an array). So `.map` is being called on the wrapper object — `Object.prototype.map` doesn't exist, so this throws `TypeError: notesQuery.data.map is not a function` whenever the notes page loads. The `.map` call on the right-hand side `[]` only happens when `data` is null/undefined.

**However, both legacy and Supabase paths return the same `{data, pagination}` shape**, so the new path does not regress this. It is identical. The Notes page may already be broken in production; fixing it is a separate task that requires either (a) updating the hook to do `notesQuery.data?.data?.map(mapNote) || []`, or (b) having the new path return just the array.

Going with **parity (option b not taken)** to keep the migration scope small. If the Notes page is currently broken in production, the user will not see a Checkpoint 5b regression. If the Notes page is currently working, then the consumer is reading `data.data` somewhere we haven't seen — and the new path matches that.

**Action item:** confirm with the user whether the Notes page works in the legacy path today. If it does, the consumer is reading `data.data` and the new path is correct. If it doesn't, the bug is pre-existing and fixing it is a separate ticket.

## Testing checklist

### Pre-flight

- [ ] `0001_init_schema.sql` applied (Note table exists with `tags TEXT[]` column)
- [ ] `0004_link_auth.sql` applied (RLS uses `auth.uid()`)
- [ ] `0005_storage_policies.sql` applied (Checkpoint 3 prerequisite)
- [ ] `0003_realtime.sql` applied (Checkpoint 4 prerequisite)
- [ ] `frontend/design-system/.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] `frontend/design-system/package.json` declares `@supabase/supabase-js`

### RLS probe

```sql
-- 1. Note RLS policies
SELECT policyname, cmd FROM pg_policies
 WHERE schemaname = 'public' AND tablename = 'Note';
-- expect: 4 rows (one per cmd) for note_owner

-- 2. Cross-user isolation
SET LOCAL request.jwt.claim.sub = '<user-A-uuid>';
SELECT id FROM "Note" WHERE user_id = '<user-B-uuid>';
-- expect: 0 rows
```

### Regression (flag OFF — VITE_USE_SUPABASE unset)

- [ ] `npm run dev` boots, no console errors
- [ ] Open `/notes` — list loads (or known pre-existing bug; see above)
- [ ] Click a note → detail loads (`getById`)
- [ ] Create a new note → list refreshes
- [ ] Edit a note → updates in list
- [ ] Delete a note → soft-deleted (verify: row in DB has `is_deleted = true`); disappears from list
- [ ] Folders list shows existing folders
- [ ] Filter by folder → list updates
- [ ] Search by title → list updates (case-insensitive)
- [ ] Filter by tag → list updates (array overlap)

### New path (flag ON — VITE_USE_SUPABASE=crud)

- [ ] **M2 boot-order smoke test** — load `/`, log in, navigate to `/notes` — initial `getAll` succeeds
- [ ] DevTools Network → filter `supabase.co` → see GET on
      `/rest/v1/Note?select=*&order=updated_at.desc&offset=0`
- [ ] Supabase Table Editor → `Note` row count matches
- [ ] Click a note → GET on `/rest/v1/Note?id=eq.<id>&select=*` returns 1 row
- [ ] Create via UI → POST on `/rest/v1/Note`; list updates
- [ ] Table Editor shows the new row with correct `user_id` and `tags` as a TEXT array
- [ ] Edit via UI → PATCH; list updates
- [ ] Delete via UI → PATCH with `is_deleted=true`; list updates; Table Editor row has `is_deleted=true`
- [ ] Filter by folder → `folder=eq.<name>`
- [ ] Search by title → `title=ilike.*<search>*`
- [ ] Filter by tag → `tags=ov.{<tag1>,<tag2>}` (PostgREST array overlap operator)
- [ ] Soft-deleted note → excluded from list (verify `is_deleted=eq.false` in URL)
- [ ] Folders list → distinct folder names, deduped

### Cross-user isolation (flag ON)

- [ ] Sign in as user A in tab 1, user B in tab 2
- [ ] User B's note list does not include user A's notes
- [ ] User B's folders list does not include folders used only by user A
- [ ] SQL: as user B, `SELECT * FROM "Note" WHERE user_id = '<user-A-uuid>'` → 0 rows

### Soft delete (flag ON)

- [ ] Delete a note → Table Editor shows `is_deleted=true` (not row removed)
- [ ] The soft-deleted note does not appear in `getAll`
- [ ] The soft-deleted note does not appear in `getFolders` (because folder filter includes `is_deleted=false`)

### Tags (flag ON)

- [ ] Create a note with `tags: ['react', 'frontend']` → DB row has `tags = ['react', 'frontend']`
- [ ] Create a note with no tags → DB row has `tags = ARRAY[]::TEXT[]` (matches default)
- [ ] Edit a note, add a tag → tags array updated
- [ ] Filter by tag `['react']` → only notes with `react` in tags return

### Cross-check

- [ ] `git status` shows only the files listed in this plan. No deletions.
- [ ] `curl -H "Authorization: Bearer <access>" http://localhost:5000/api/v1/notes` still works
- [ ] Assignments module (Checkpoint 5a) still works with the same flag
- [ ] Other API modules (attendance, subjects, etc.) unaffected

### Rollback dry-run

- [ ] `git checkout -- frontend/design-system/src/api/notes.api.js`
- [ ] `rm frontend/design-system/src/api/notes.api.supabase.js frontend/design-system/src/api/notes.api.legacy.js`
- [ ] `npm run dev` still works
- [ ] `/notes` page loads via the legacy endpoint

## Exit criteria for Checkpoint 5b

All of the following must be true before Checkpoint 5c (Attendance) begins:

- All pre-flight, regression, new-path, and cross-user-isolation checks pass
- All 6 verify gates from `MIGRATION_RULES.md §8` are green for the notes module
- The pre-existing latent bug in `useNotes.js:36` is **not made worse** (i.e., the new path produces the same `{data, pagination}` shape the legacy does)
- The shared `lib/supabase.js` and `lib/featureFlags.js` are not modified by this Checkpoint
- Rollback dry-run passes

## Out-of-scope for Checkpoint 5b

- Fixing the pre-existing `useNotes.js:36` bug (separate ticket)
- Removing the legacy `/api/v1/notes/...` endpoints (Checkpoint 8)
- Removing the legacy `notes.controller.js`, `notes.service.js`, `notes.repository.js`, `notes.routes.js`, `note.validator.js` (Checkpoint 8)
- Other CRUD modules (attendance, subjects, semesters, placement, onboarding) — their own Checkpoints
