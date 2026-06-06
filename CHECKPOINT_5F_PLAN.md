# Checkpoint 5f — Placement CRUD → Supabase PostgREST Plan

> Scope: Move all seven Placement endpoints from the Node backend to
> direct `supabase.from('PlacementProgress')` calls. RLS enforces
> ownership. Legacy routes/controller/service/repo stay on disk
> behind the `crud` feature flag.

## Design summary

1. **Table** — `PlacementProgress` (from `0001_init_schema.sql`).
   RLS from `0004_link_auth.sql` enforces `user_id = auth.uid()`.
2. **CRUD via PostgREST** — flat `.from('PlacementProgress')` calls.
3. **DSA endpoints** — `addDsaProblem` is sugar for `addItem` with
   `category='DSA'` forced. `getDsaProblems` is sugar for
   `getProgress` with `category='DSA'` forced.
4. **`getStats`** — the legacy `PlacementRepo.statsByCategory`
   does 4 categories × 3 counts = 12 queries, plus a `groupBy` for
   DSA difficulty. The new path replicates the N+1 pattern for
   parity. A future optimization: a single RPC or a Postgres view
   (Checkpoint 7 will create analytics views; `getStats` is a
   candidate).

## File-by-file scope

### Created (2)
- `frontend/design-system/src/api/placement.api.supabase.js`
- `frontend/design-system/src/api/placement.api.legacy.js`

### Modified (1)
- `frontend/design-system/src/api/placement.api.js` — facade

### NOT modified
- `backend/**` — zero changes.
- `frontend/design-system/src/hooks/usePlacement.js` — untouched.
- `frontend/design-system/src/lib/mappers.js` — no `mapPlacement` exists; consumers handle raw rows.
- `frontend/design-system/src/lib/supabase.js` — reused.

## Response-shape preservation

| Method | Legacy returns | Supabase returns | Match |
|---|---|---|---|
| `getProgress(params)` | array of `PlacementProgress` rows (after `unwrap` of `ApiResponse.success(data, 'Placement progress')`) | array of rows from `.from('PlacementProgress').select('*').eq('user_id', userId).order('created_at', {ascending:false})` with optional category filter | ✅ |
| `addItem(payload)` | `PlacementProgress` row | row from `.insert({user_id, ...}).select('*').single()` | ✅ |
| `updateItem(id, payload)` | `PlacementProgress` row | row from `.update(payload).eq('id', id).select('*').single()` | ✅ |
| `delete(id)` | `{success, message}` envelope with `data: null` | `null` from `.delete().eq('id', id)` | ⚠️ (consumer doesn't read) |
| `getStats()` | `{perCategory: [{category, total, completed, inProgress, notStarted, completionPct}], dsaDifficulty: [...]}` | same shape, assembled client-side | ✅ |
| `addDsaProblem(payload)` | `PlacementProgress` row (with `category='DSA'`) | row from `addItem` with `category='DSA'` merged | ✅ |
| `getDsaProblems(params)` | array of rows where `category='DSA'` | array from `getProgress({category:'DSA', ...})` | ✅ |

## Stats implementation

The legacy `statsByCategory` returns:
```js
{
  perCategory: [
    { category: 'DSA', total, completed, inProgress, notStarted, completionPct },
    { category: 'INTERVIEW', ... },
    { category: 'APTITUDE', ... },
    { category: 'RESUME', ... }
  ],
  dsaDifficulty: [ { difficulty, _count: { _all } }, ... ]
}
```

The Supabase path replicates the same 12 + N queries. For 4 categories × 3 status counts + 1 groupBy on DSA, this is acceptable for parity.

## Rollback
```bash
git checkout -- frontend/design-system/src/api/placement.api.js
rm frontend/design-system/src/api/placement.api.supabase.js \
   frontend/design-system/src/api/placement.api.legacy.js
```

## Exit criteria
- All 6 verify gates from MIGRATION_RULES.md §8 green for placement
- Legacy path still works
- Zero backend changes, zero deletions
- Rollback dry-run passes

## Out-of-scope
- Atomic `getStats` via a single RPC or view (Checkpoint 7 candidate)
- Removing legacy placement endpoints (Checkpoint 8)
