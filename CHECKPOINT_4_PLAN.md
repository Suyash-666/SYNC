# Checkpoint 4 — Notifications → Supabase Realtime Plan

> Scope: Move notification reads from the `/notifications` Socket.IO
> namespace to Supabase Realtime `postgres_changes` subscriptions on the
> `Notification` table. Mark-as-read and delete mutations move from the
> Node REST endpoints to direct `supabase.from('Notification').update()`
> and `.delete()` calls. The legacy Socket.IO path stays alive behind the
> feature flag and is selected when the `notifications` flag is OFF.
>
> Approach: **Feature-flag gated.** The new path activates only when
> `VITE_USE_SUPABASE=notifications` (or `all`). The legacy Socket.IO +
> REST path keeps working until you flip the flag.

## Design summary

1. **Reads** — replaced by `supabase.from('Notification').select('*')`
   (initial fetch) plus a `supabase.channel('notifications').on(
   'postgres_changes', { event: '*', schema: 'public', table: 'Notification',
   filter: 'user_id=eq.<auth.uid>' }, payload => ...)` subscription.
2. **Mutations** — `markRead`, `markAllRead`, `delete` move from REST to
   `supabase.from('Notification').update({is_read:true}).eq('id', id)`,
   `.update({is_read:true}).eq('user_id', userId)`, and
   `.delete().eq('id', id)` respectively. RLS enforces ownership.
3. **Filter on Realtime** — `filter: 'user_id=eq.<auth.uid>'` keeps the
   client from receiving other users' rows. (Defense-in-depth: RLS would
   block them anyway, but the filter saves the roundtrip.)
4. **Singleton channel** — One channel per app, owned by a module-level
   singleton in `lib/supabaseRealtime.js`. Multiple component mounts do
   not cause duplicate subscriptions.
5. **Realtime publication** — already set in `0003_realtime.sql`:
   `Notification` has `REPLICA IDENTITY FULL` and is added to
   `supabase_realtime`. RLS is in place from `0004_link_auth.sql`.
6. **Legacy path** — `src/sockets/handlers/notification.handler.js`,
   `backend/src/sockets/index.js` (the `/notifications` namespace), and
   the Node `notification.service.js` are **all unchanged**.

## File-by-file scope

### Created (4)

| File | Purpose |
|---|---|
| `frontend/design-system/src/lib/supabaseRealtime.js` | Module-level singleton that owns the `notifications` channel. Exports `subscribeNotifications(onInsert, onUpdate, onDelete)` and `unsubscribe()`. |
| `frontend/design-system/src/api/notifications.api.supabase.js` | Supabase-backed `notificationsApi`: `getAll`, `markRead`, `markAllRead`, `delete`. Returns the same shapes as the legacy module. |
| `frontend/design-system/src/hooks/useNotifications.supabase.js` | Supabase-backed `useNotifications(params)` hook. Same return shape as the legacy hook. |
| `frontend/design-system/src/store/notificationsSlice.js` (edited additively) | No code removed; a new `realtimeSync` action is added that, given a payload, applies the right reducer (insert/update/delete) by inspecting the payload's `eventType`. |

Wait — `notificationsSlice.js` already has the needed reducers (`setNotifications`, `prependNotification`, `markNotificationRead`, `markAllNotificationsRead`). The Supabase path uses them as-is. **No edit to the slice is required.** The plan now lists only the files that actually need to change.

### Created (revised — 3 files)

| File | Purpose |
|---|---|
| `frontend/design-system/src/lib/supabaseRealtime.js` | Singleton channel owner (see above). |
| `frontend/design-system/src/api/notifications.api.supabase.js` | New `notificationsApi` implementation. |
| `frontend/design-system/src/hooks/useNotifications.supabase.js` | New hook implementation. |

### Modified (3)

| File | Change |
|---|---|
| `frontend/design-system/src/api/notifications.api.js` | Becomes a facade. Picks `legacy` or `supabaseImpl` based on `isEnabled('notifications')`. |
| `frontend/design-system/src/hooks/useNotifications.js` | Becomes a facade. Picks `legacy` or `supabaseImpl` based on `isEnabled('notifications')`. |
| `src/lib/socket.js` | **Light edit only.** The `getNotificationsSocket` function is left intact but is no longer imported by `useNotifications` when the flag is on. No call-site change required. **This is a "shrink-only" edit — the file keeps all its exports.** |

Actually — `useNotifications` is the only importer of `getNotificationsSocket`. The new hook doesn't import it. So `lib/socket.js` does not need to be edited. The plan now lists only two modified files.

### Modified (revised — 2 files)

| File | Change |
|---|---|
| `frontend/design-system/src/api/notifications.api.js` | Facade. |
| `frontend/design-system/src/hooks/useNotifications.js` | Facade. |

### NOT modified in Checkpoint 4

- `backend/**` — **zero changes.** `/notifications` namespace stays live, all REST endpoints stay live, `notification.service.js` `getIo()` broadcast stays live.
- `frontend/design-system/src/store/notificationsSlice.js` — exports unchanged; the new hook dispatches the same actions.
- `frontend/design-system/src/lib/socket.js` — untouched.
- `frontend/design-system/src/lib/mappers.js` — `mapNotification` already consumes snake_case fields returned by Supabase; no edit.
- `frontend/design-system/src/lib/supabase.js` — `getSupabaseAccessToken` and `getSupabaseForUser` are reused as-is.
- `frontend/design-system/src/api/auth.api.js`, `client.js`, `App.jsx`, all other pages/hooks/components.

## Response-shape preservation

| Function | Legacy | Supabase | Match |
|---|---|---|---|
| `getAll(params)` | `{data:[...], pagination:{...}}` (after unwrap of `ApiResponse.success(result.data, 'Notifications', 200, { pagination: ... })`) | `{data: rows, pagination: {total, page, limit, totalPages}}` (assembled from `.range(from, to).select('*', {count:'exact'})`) | ✅ |
| `markRead(id)` | `{success, message}` envelope (data=null) | the updated row (or `{message}` — see L1 below) | ⚠️ partial (L1 from Checkpoint 3 audit doesn't apply here; the existing consumer only dispatches `markNotificationRead(id)` and doesn't read the response) |
| `markAllRead()` | `{success, message}` envelope | updated count or `null` | ⚠️ partial (consumer doesn't read the response) |
| `delete(id)` | `{success, message}` envelope | `null` (Supabase `.delete()` returns null) | ⚠️ partial (consumer only invalidates query) |

**The three partial matches are all safe** because every consumer of these mutations (in `useNotifications.js`) does `dispatch(markNotificationRead(id))` or `queryClient.invalidateQueries(...)` after the call returns — they never read the response body. The only meaningful shape is for `getAll`, which is identical.

## Realtime channel design

`supabaseRealtime.js` (sketch):

```js
let channel = null;
const listeners = { insert: new Set(), update: new Set(), delete: new Set() };

export function subscribeNotifications(accessToken, callbacks) {
  if (channel) return;                          // singleton
  if (!accessToken) return;

  const c = getSupabaseForUser(accessToken);
  channel = c.channel('notifications')
    .on('postgres_changes',
        { event: '*', schema: 'public', table: 'Notification',
          filter: `user_id=eq.${accessToken_user_id}` },
        payload => dispatch(payload))
    .subscribe();
}
```

The channel lives for the lifetime of the page. The hook mounts call
`subscribeNotifications`; the singleton guarantees one subscription
regardless of how many components mount the hook.

## Feature flag behavior

`isEnabled('notifications')`:
- `false` (default, or `'0'`, or `''`) → legacy path. `useNotifications` calls the Socket.IO `/notifications` namespace; `notificationsApi` calls the Node REST endpoints.
- `true` (`VITE_USE_SUPABASE=notifications` or `all`) → Supabase path. Initial `getAll`, then Realtime pushes.

The two paths **do not run concurrently** for the same user. Flag flip is a page refresh, not a runtime toggle.

## Migration order

1. Confirm Checkpoint 3 is fully verified (H1, M1, M2 resolved).
2. Confirm `0003_realtime.sql` and `0004_link_auth.sql` are applied to the Supabase project.
3. Create the three new files (`supabaseRealtime.js`, `notifications.api.supabase.js`, `useNotifications.supabase.js`).
4. Replace the two existing files with the facades.
5. Smoke test: flag OFF (regression), then flag ON (new path).
6. Run the test checklist.

## Rollback commands

```bash
# 1. Revert the two facade files to their pre-Checkpoint-4 bytes
git checkout -- \
  frontend/design-system/src/api/notifications.api.js \
  frontend/design-system/src/hooks/useNotifications.js

# 2. Remove the new files
rm -f \
  frontend/design-system/src/lib/supabaseRealtime.js \
  frontend/design-system/src/api/notifications.api.supabase.js \
  frontend/design-system/src/hooks/useNotifications.supabase.js
```

Backend is untouched. The `/notifications` Socket.IO namespace continues working. The Node REST endpoints continue working. The `Notification` table Realtime publication remains in the database (it does not harm anything if no client subscribes).

## Testing checklist

### Pre-flight

- [ ] `supabase/migrations/0003_realtime.sql` applied (Notification in `supabase_realtime` publication)
- [ ] `supabase/migrations/0004_link_auth.sql` applied (RLS uses `auth.uid()`)
- [ ] `0005_storage_policies.sql` applied (Checkpoint 3 prerequisite)
- [ ] `frontend/design-system/.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] `frontend/design-system/package.json` declares `@supabase/supabase-js`

### Realtime publication probe

```sql
-- 1. Notification is in the publication
SELECT pubname, tablename FROM pg_publication_tables
 WHERE pubname = 'supabase_realtime' AND tablename = 'Notification';
-- expect: 1 row

-- 2. REPLICA IDENTITY FULL
SELECT relname, relreplident FROM pg_class
 WHERE relname = 'Notification';
-- expect: relreplident = 'f' (FULL)
```

### RLS probe (depends on 0004)

```sql
SELECT policyname, cmd FROM pg_policies
 WHERE schemaname = 'public' AND tablename = 'Notification';
-- expect: at least one SELECT, one UPDATE, one DELETE for the notif_owner policy
```

### Regression (flag OFF — VITE_USE_SUPABASE unset)

- [ ] `npm run dev` boots, no console errors
- [ ] Open `/notifications` page — initial fetch works
- [ ] Mark a notification as read via the UI → it updates immediately
- [ ] Trigger a notification on the server (or wait for an in-app event) → the Socket.IO `new_notification` event arrives in DevTools Network → WS frames
- [ ] Click "mark all read" → all notifications update
- [ ] Delete a notification → it disappears

### New path (flag ON — VITE_USE_SUPABASE=notifications)

- [ ] Restart `npm run dev`
- [ ] M2 boot-order smoke test: load `/`, log in, navigate to `/notifications` — list loads (initial `getAll` succeeds)
- [ ] DevTools → Network → filter `supabase.co` → see the initial GET on
      `/rest/v1/Notification?...`
- [ ] DevTools → Network → WS → see a WebSocket connection to
      `wss://<project>.supabase.co/realtime/v1/...` with topic
      `notifications`
- [ ] In the Supabase dashboard Table Editor, insert a new `Notification`
      row for the current user (user_id = auth.uid() of the signed-in
      user) — it appears in the UI within ~1 second
- [ ] Update the same row's `is_read` to true via SQL — UI updates
- [ ] Delete the row via SQL — UI removes it
- [ ] Mark a notification as read via the UI button — the row updates
      and Supabase `Notification.is_read = true` reflects the change
- [ ] Click "mark all read" — all rows update
- [ ] Delete a notification via the UI — row is removed from the
      `Notification` table

### Cross-user isolation (flag ON)

- [ ] Sign in as user A in browser tab 1, as user B in tab 2
- [ ] Insert a Notification for user A in SQL — appears in tab 1, **does
      not** appear in tab 2
- [ ] Update that row — only tab 1 sees the change
- [ ] Tab 2's `getAll` does not return user A's row (RLS enforces it at
      REST layer, Realtime filter excludes it at subscription layer)

### Singleton subscription

- [ ] Mount the `useNotifications` hook from two different components
      (e.g., the notifications page and the dashboard bell) — only one
      Realtime channel is created. Verify in DevTools → WS frames: the
      `phx_join` is sent exactly once.

### Storage console

- [ ] No new rows or objects in the `resources` or `avatars` buckets
      (Checkpoint 3 not regressed)

### Cross-check

- [ ] `git status` shows only the files listed in this plan (created or
      modified). **No deletions.**
- [ ] `curl -X POST -b "refreshToken=..." http://localhost:5000/api/v1/notifications/<id>/read` still works (legacy endpoint intact)

### Rollback dry-run

- [ ] `git checkout --` the two facade files
- [ ] `rm` the three new files
- [ ] `npm run dev` still works
- [ ] Notifications page loads, Socket.IO connection still active

## Exit criteria for Checkpoint 4

All of the following must be true before Checkpoint 5 begins:

- All pre-flight, regression, new-path, and cross-user-isolation checks pass
- All 6 verify gates from `MIGRATION_RULES.md §8` ("What 'verify' means") are green for the notifications module specifically:
  1. Legacy path still works (Socket.IO namespace + REST endpoints live)
  2. New path returns identical `getAll` shape; mutation responses are read by no consumer, so partial mismatch is acceptable
  3. `mapNotification` unchanged
  4. React Query key `['notifications', params]` unchanged
  5. Flag switches paths cleanly via the facade
  6. Supabase dashboard shows expected Realtime events on `Notification`
- Singleton subscription verified (one `phx_join` regardless of how many components mount the hook)
- Rollback dry-run passes

## Out-of-scope for Checkpoint 4

- Removing the `/notifications` Socket.IO namespace (Checkpoint 8)
- Removing `backend/src/sockets/handlers/notification.handler.js` (Checkpoint 8)
- Removing `backend/src/services/notification.service.js` (Checkpoint 8)
- Removing the `notifications` REST routes/controllers/repositories (Checkpoint 8)
- Study rooms, storage, AI, or any CRUD module (their own Checkpoints)
