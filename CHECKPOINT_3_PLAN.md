# Checkpoint 3 — Storage Migration Plan

> Scope: Move file uploads from the Node backend (Multer + Supabase Storage
> service-role call) to direct browser → Supabase Storage uploads using the
> user's authenticated session. The metadata row in the `Resource` table
> remains in Postgres; only the *bytes path* changes.
>
> Approach: **Feature-flag gated.** The new path activates only when
> `VITE_USE_SUPABASE=storage` (or `all`). Until then, the existing
> multipart upload to `/api/v1/resources/upload` works exactly as today.

## Design summary

1. **Buckets** — `resources` (existing) and `avatars` (already mentioned in
   `DEPLOYMENT.md`, now actually wired with RLS).
2. **Path convention** — Preserved. Existing uploads use
   `${userId}/${timestamp}_${originalName}`. The new path uses the same
   convention so existing `Resource.file_url` values continue to resolve.
3. **File-type and size limits** — Preserved: PDF/JPEG/PNG/WEBP only,
   ≤10 MB.
4. **Public-read for the `resources` bucket** — Preserved. The current
   `storage.service.uploadFile` returns a public URL; we keep that contract
   so `Resource.file_url` URLs continue to work in `<img>` and `<a>` tags.
5. **Avatar bucket** — Per-user object paths, public-read so profile
   pictures render the same way.
6. **Metadata row** — Inserted via `supabase.from('Resource').insert(...)`
   using the user-scoped client. RLS enforces the `user_id = auth.uid()`
   rule.
7. **Delete** — `supabase.storage.from('resources').remove([path])` from
   the browser; metadata row deleted via `supabase.from('Resource').delete()`.
8. **Legacy path** — Completely unchanged. The Node controller
   (`POST /resources/upload`) and `Storage` service remain in place.

## File-by-file scope

### Created (4)

| File | Purpose |
|---|---|
| `supabase/migrations/0005_storage_policies.sql` | Storage RLS policies for `resources` and `avatars` buckets. Idempotent — safe to re-run. |
| `frontend/design-system/src/lib/supabase.js` | Centralized Supabase client factory. Returns `getSupabase()` (anon, persistent) and `getSupabaseForUser(accessToken)` (per-request, user-scoped). Reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. |
| `frontend/design-system/src/lib/featureFlags.js` | Exports `isEnabled(flag)` and `parseFlags(env)`. Resolves `VITE_USE_SUPABASE` to a Set. Defaults to empty Set when unset. |
| `frontend/design-system/src/api/resources.api.supabase.js` | The new Supabase-backed implementation. Exports the same `resourcesApi` shape as `resources.api.js` (`getAll`, `upload`, `addLink`, `link`, `delete`, `remove`). |

### Modified (3)

| File | Change |
|---|---|
| `frontend/design-system/src/api/resources.api.js` | Becomes a 5-line facade: imports the legacy default, imports the new Supabase implementation, and re-exports one or the other based on `isEnabled('storage')`. **No behavior change when the flag is off.** |
| `frontend/design-system/src/api/index.js` | Re-exports the facade (no signature change). |
| `DEPLOYMENT.md` | Adds the Storage CORS configuration section (see §"Storage CORS" below). |

### NOT modified in Checkpoint 3

- `backend/**` — **zero changes**. Legacy `POST /api/v1/resources/upload` remains live. Legacy `services/storage.service.js` is untouched.
- `backend/prisma/schema.prisma` — `Resource` table is unchanged.
- `frontend/design-system/src/api/resources.api.js` consumers (pages, hooks) — they continue to call the same `resourcesApi` object.
- `backend/src/lib/supabase.js` (created in Checkpoint 1) — unchanged.

## Storage CORS — appended to DEPLOYMENT.md

```text
## Storage CORS configuration

The `resources` and `avatars` Supabase Storage buckets must allow direct
uploads from the browser. Configure in the Supabase Dashboard →
Storage → [bucket] → Configuration → CORS:

Allowed origins:
- http://localhost:5173
- https://<your-vercel-domain>.vercel.app
- (your custom domain, if any)

Allowed methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Allowed headers: Authorization, Content-Type, x-client-info, apikey
Expose headers: Content-Range, Content-Length, ETag
Max age: 3600
```

## Feature flag behavior

`featureFlags.js` exports:

```js
parseFlags('storage,notifications')  // → Set(['storage', 'notifications'])
isEnabled('storage')                 // → true / false
```

Usage in `resources.api.js`:

```js
import { isEnabled } from '../lib/featureFlags';
import legacy from './resources.api.legacy';       // current default export
import supabaseImpl from './resources.api.supabase';

const impl = isEnabled('storage') ? supabaseImpl : legacy;
export const resourcesApi = impl;
export default resourcesApi;
```

When the flag is off, the legacy implementation runs. **No code path is
removed in Checkpoint 3.** When the flag is on, the legacy backend's
`POST /api/v1/resources/upload` is not called for that user.

## Response-shape preservation

The existing `resourcesApi` (from `src/api/resources.api.js`):

| Method | Returns (after `unwrap`) |
|---|---|
| `getAll(params)` | `{data, pagination}` (matches `GET /resources` response) |
| `upload({file, title, subject_id})` | the inserted `Resource` row object |
| `addLink(payload)` / `link(payload)` | the inserted `Resource` row object |
| `delete(id)` / `remove(id)` | `{message: '...'}` (envelope) or `null` |

The new `resources.api.supabase.js` must return the **same shapes** after
the `unwrap`-equivalent. Important details:

- `getAll` — `select('*').eq('user_id', userId)` returns an array, not
  `{data, pagination}`. We wrap it before returning.
- `upload` — returns the inserted row. Supabase returns the row array
  on `.insert().select()`; we pick the first element.
- `delete` — Supabase returns `null` on success. We return `{message: 'Resource deleted'}` to mirror the legacy envelope.

## Migration order

1. Apply `0005_storage_policies.sql` to the Supabase project. Verify
   bucket policies with the SQL probe in the test checklist.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to
   `frontend/design-system/.env`.
3. Add the Storage CORS section to `DEPLOYMENT.md`.
4. Create `lib/supabase.js`, `lib/featureFlags.js`,
   `api/resources.api.supabase.js`.
5. Replace `api/resources.api.js` with the facade.
6. Smoke test with the flag off (regression), then with the flag on
   (new path).

## Rollback commands

Checkpoint 3 is fully additive. To roll back:

```bash
# 1. Revert frontend changes
git checkout -- \
  frontend/design-system/src/api/resources.api.js \
  frontend/design-system/src/api/index.js \
  DEPLOYMENT.md

# 2. Remove the new files
rm -f \
  frontend/design-system/src/lib/supabase.js \
  frontend/design-system/src/lib/featureFlags.js \
  frontend/design-system/src/api/resources.api.supabase.js \
  supabase/migrations/0005_storage_policies.sql

# 3. Storage policies are not destructive — re-running 0005 with
#    `DROP POLICY IF EXISTS ... ; CREATE POLICY ...` is safe.  If you want
#    to remove the policies from the live Supabase project, do it
#    manually in the Dashboard.
```

The backend is untouched, so the legacy upload endpoint continues working
regardless. The frontend falls back to the legacy path as soon as the new
files are removed.

## Testing checklist

### Pre-flight

- [ ] `supabase/migrations/0005_storage_policies.sql` applied without error
- [ ] `supabase/migrations/0004_link_auth.sql` applied without error
      (prerequisite — drops the `current_app_user_id()` indirection and
      rewrites policies to use `auth.uid()` directly; without it, the
      Supabase `Resource` insert will fail with an RLS violation)
- [ ] `frontend/design-system/.env` has `VITE_SUPABASE_URL` and
      `VITE_SUPABASE_ANON_KEY`
- [ ] `DEPLOYMENT.md` has the new Storage CORS section
- [ ] `frontend/design-system/package.json` declares
      `"@supabase/supabase-js": "^2.106.2"` and `npm install` has been run
      (otherwise Vite fails to resolve the import)

### Bucket policies probe

```sql
-- 1. resources bucket exists and is public-readable
SELECT name, public FROM storage.buckets WHERE name IN ('resources', 'avatars');
-- expect: both rows, public = true for resources, true for avatars

-- 2. policies exist
SELECT policyname, cmd FROM pg_policies
 WHERE schemaname = 'storage' AND tablename = 'objects'
   AND policyname LIKE 'resources_%' OR policyname LIKE 'avatars_%';
-- expect: at least one SELECT (public read), one INSERT (owner only),
--         one UPDATE (owner only), one DELETE (owner only) per bucket
```

### Regression (flag off — `VITE_USE_SUPABASE` unset or empty)

- [ ] `npm run dev` boots, no console errors
- [ ] Open `/resources` page (or whichever page renders resources)
- [ ] Click upload, choose a PDF, click submit → file uploads, list refreshes
- [ ] Confirm the URL in the new row is `https://<project>.supabase.co/storage/v1/object/public/resources/...`
- [ ] Open the public URL in a new tab → the PDF renders
- [ ] Click delete on the resource → row disappears, storage object is removed
- [ ] `getAll()` returns `{data: [...], pagination: {...}}` shape

### New path (flag on — `VITE_USE_SUPABASE=storage`)

- [ ] **M2 boot-order smoke test:** complete a normal app boot
      (load `/`, log in via `authApi.login`, navigate to `/settings`) and
      then perform the avatar upload below. The upload must succeed without
      a `Not signed in` error from `resources.api.supabase.js:client()`. If
      it errors, the Supabase token bridge in `store/index.js:17` was
      evaluated after the first call to `getSupabaseAccessToken()` —
      check the import order in `main.jsx` (the store must be created
      before any code that calls the supabase client factory).
- [ ] Restart `npm run dev` to pick up the env var
- [ ] Open DevTools → Network → filter for `supabase.co`
- [ ] Click upload → see a direct request to
      `https://<project>.supabase.co/storage/v1/object/resources/...`
- [ ] The request carries an `Authorization: Bearer <jwt>` header
- [ ] No request is made to `/api/v1/resources/upload`
- [ ] The new row appears in the resources list within 1s
- [ ] The public URL works
- [ ] Delete works; both the storage object and the metadata row are removed
- [ ] Reload the page → the new resource is still listed (proves the
      metadata row was actually inserted, not just held in memory)

### Error paths (flag on)

- [ ] Upload a 12 MB file → blocked client-side with a clear error
      (the new code enforces the 10 MB cap; the legacy backend also
      enforced it via Multer, so the UX is identical)
- [ ] Upload a `.docx` → blocked with "File type not allowed"
- [ ] Toggle the flag off mid-session, refresh, attempt upload → falls
      back to the legacy endpoint (proves the facade is wired correctly)
- [ ] Toggle the flag on, log out, attempt upload from a logged-out
      browser tab → fails with a 401 from Supabase (not a server crash)

### Storage console (Supabase dashboard)

- [ ] The new object is visible under Storage → resources → `<userId>/...`
- [ ] The object size matches the uploaded file
- [ ] The `Resource` table row is visible under Table Editor → Resource
- [ ] The `user_id` column matches the logged-in user

### Avatar bucket (forward-compatibility check)

- [ ] The `avatars` bucket exists with public-read access
- [ ] No code path in the frontend currently uploads avatars; this
      bucket is staged for Checkpoint 5 (users) which adds avatar
      uploads via `updateProfile({avatar_url})`. For Checkpoint 3 we
      only need the bucket to exist and the policies to be in place.

### Cross-check (no deletions)

- [ ] `git status` shows only the files listed in this plan (created
      or modified). **No deletions.**
- [ ] The legacy `POST /api/v1/resources/upload` still works
      (proof: a curl call returns 201)

### Rollback dry-run

- [ ] `git checkout -- frontend/design-system/src/api/resources.api.js
       frontend/design-system/src/api/index.js DEPLOYMENT.md`
- [ ] `rm frontend/design-system/src/lib/supabase.js
        frontend/design-system/src/lib/featureFlags.js
        frontend/design-system/src/api/resources.api.supabase.js
        supabase/migrations/0005_storage_policies.sql`
- [ ] `npm run dev` still works
- [ ] Uploads still go through `/api/v1/resources/upload` (Network tab)

## Exit criteria for Checkpoint 3

All of the following must be true before Checkpoint 4 starts:

- All pre-flight, regression, new-path, and error-path checks pass
- All 6 gates from `MIGRATION_RULES.md §8` ("What 'verify' means") are green
  for the storage module specifically
- The `supabase migrations/0005_storage_policies.sql` file is committed
  to the migration branch
- `DEPLOYMENT.md` includes the Storage CORS configuration

## Out-of-scope for Checkpoint 3

- Avatar upload UI (no current consumer; bucket staged only)
- Removing the legacy `POST /api/v1/resources/upload` endpoint (deferred
  to Checkpoint 8)
- Removing the legacy `backend/src/services/storage.service.js`
- Removing the `backend/src/middlewares/upload.middleware.js` (Multer)
- Frontend changes to other API modules
- Notification, study room, or AI changes
