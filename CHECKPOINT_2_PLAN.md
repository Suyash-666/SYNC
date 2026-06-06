# Checkpoint 2 — Auth Migration Plan

> Scope: Move authentication to Supabase Auth while preserving the existing
> frontend contract exactly. Socket.IO authentication, Redux auth state, and
> the App.jsx session-restore flow remain unchanged.
>
> Approach: **Strategy B** — backend-controlled httpOnly refresh cookie.
> Supabase Auth is the source of truth; the legacy JWTs are still issued by
> the Node service for backward compatibility with the socket layer and
> middleware. This buys us time to retire the legacy JWTs in a later
> checkpoint without breaking anything today.

## Design summary

1. **Identity source** — `auth.users` (Supabase). We do **not** delete the
   `User` table; it remains the place where `full_name`, `role`, `college`,
   `degree`, `is_onboarded`, and other product data live.
2. **ID alignment** — `User.id` becomes equal to `auth.users.id` from the
   moment of signup. The `0004_link_auth.sql` migration drops the
   `public.app_user_id` indirection and rewrites the RLS policies to use
   `auth.uid()` directly.
3. **`User.password_hash`** — Set once to the literal placeholder
   `'supabase-managed'` on signup. Never written again. The column stays
   `NOT NULL` so Prisma and any other reader continue to work.
4. **Tokens** — Backend mints the existing legacy JWTs
   (`signAccessToken({id, role})` 15m, `signRefreshToken({id})` 7d) and
   stores the refresh hash in `User.refresh_token` exactly like today. The
   frontend and Socket.IO see no change.
5. **Refresh flow** — `POST /auth/refresh` is the *only* endpoint that
   knows Supabase is involved. It reads the httpOnly refresh cookie,
   calls `supabase.auth.refreshSession()`, validates the returned user,
   mints new legacy JWTs, rotates the cookie, and returns `{access, user}`.
6. **Password reset** — `POST /auth/forgot-password` calls
   `supabase.auth.resetPasswordForEmail`; in non-production it *also*
   inserts a `PasswordReset` row with a known dev token (preserves the
   developer workflow). `POST /auth/reset-password` accepts the dev token
   in dev and a Supabase recovery session in prod.
7. **`/auth/me`** — Unchanged. Returns the `User` row as today.

## Critical contract guarantees (must hold post-implementation)

| Endpoint | Request | Response `.data` | Cookie |
|---|---|---|---|
| `POST /auth/signup` | `{full_name, email, password, confirm_password}` | `{access, user:{id,email,full_name,role}}` | sets `refreshToken` httpOnly |
| `POST /auth/login` | `{email, password}` | `{access, user}` | sets `refreshToken` httpOnly |
| `POST /auth/refresh` | cookie or `body.refreshToken` | `{access, user}` (user field added; existing `nextAccess` extraction still works) | rotates `refreshToken` |
| `POST /auth/logout` | none | `{success:true, message:'Logged out'}` | clears `refreshToken` |
| `POST /auth/forgot-password` | `{email}` | `{token}` in non-prod, `{message}` in prod | unchanged |
| `POST /auth/reset-password` | `{token, new_password}` in dev, recovery session in prod | `{success:true, message:'Password has been reset'}` | clears refresh cookie |
| `GET /auth/me` | `Authorization: Bearer <access>` | `{id,email,full_name,avatar_url,role,college,degree,is_onboarded,is_active}` | unchanged |
| Socket `/study-rooms` & `/notifications` handshake | `auth: { token: <access> }` (legacy JWT) | unchanged | n/a |
| `state.auth.user` shape | n/a | unchanged | n/a |
| `state.auth.accessToken` | n/a | unchanged | n/a |
| `User.refresh_token` writes | n/a | **stopped** (column kept) | n/a |
| `User.password_hash` writes | n/a | placeholder on signup only | n/a |

## Files to be created (additive)

| File | Purpose |
|---|---|
| `supabase/migrations/0004_link_auth.sql` | Aligns `User.id` with `auth.users.id`. Drops `public.app_user_id` and `current_app_user_id()`. Rewrites RLS policies to use `auth.uid() = "User".id` directly. |
| `backend/src/lib/supabase.js` (already created in Checkpoint 1) | Used as the admin client factory. |
| `backend/src/services/supabaseAuth.service.js` | New service wrapping `supabase.auth.admin.createUser`, `signInWithPassword`, `refreshSession`, `resetPasswordForEmail`, `admin.updateUserById`. Pure pass-through with error normalization. |
| `backend/src/lib/legacyJwt.js` | Small helper that, given an `appUserId` and `role`, returns `{access, refresh}` minted by the existing `utils/jwt.utils`. Centralizes the "mint legacy JWT after Supabase success" step. |

## Files to be modified (additive or behavior-preserving)

| File | Change |
|---|---|
| `backend/src/config/env.js` | Already updated in Checkpoint 1; no further change. |
| `backend/src/services/auth.service.js` | Rewritten to delegate identity to Supabase, but expose the **same function signatures and response shapes** as today (`signup`, `login`, `refreshToken`, `logout`, `forgotPassword`, `resetPassword`, `me`). Brute-force `Map` removed (Supabase rate-limits). |
| `backend/src/repositories/auth.repository.js` | No longer creates `User` directly; delegates to `supabaseAuth.service` for `auth.users` and to Prisma for the matching `User` row. `findByEmail` now uses `auth.admin.listUsers` *or* Prisma; we keep Prisma for `findById`/`updatePassword` because those operate on our `User` table. `updateRefreshToken`, `clearRefreshToken`, `createPasswordReset`, `findValidResets`, `invalidateResetsForUser` stay. |
| `backend/src/repositories/user.repository.js` | Adds a `createWithSupabaseId({id, email, full_name, role})` helper that inserts a `User` row whose `id` matches the `auth.users.id` returned by Supabase. Existing `findByEmail` and `create` (for non-Supabase flows) are kept for rollback. |
| `backend/src/controllers/auth.controller.js` | **No change.** All seven handlers still call into `AuthService` with the same arguments. |
| `backend/src/middlewares/auth.middleware.js` | **No change.** Still verifies the legacy JWT. (Supabase JWTs only enter via the `/auth/refresh` path, which bypasses this middleware.) |
| `backend/src/sockets/auth.socket.js` | **No change.** Still verifies the legacy JWT. |
| `backend/src/routes/auth.routes.js` | **No change.** Mounts the same endpoints. |
| `backend/src/validators/auth.validator.js` | **No change.** |
| `prisma/schema.prisma` | No change. We keep the `User.password_hash NOT NULL` column; we set a placeholder string at signup. |
| `frontend/**` | **No change.** This is the core guarantee of the plan. |

## Files to be deprecated (NOT deleted in Checkpoint 2)

These stay in the tree, marked with a `// @deprecated since Checkpoint 2` JSDoc
tag and a console warning on require. Removal happens in Checkpoint 8.

- `backend/src/services/auth.service.js` (full file, marked deprecated) — replaced by `supabaseAuth.service.js` + the new `auth.service.js` shim
- The old `failedLogins` Map and the bcrypt password paths inside `auth.service.js`
- The `password_hash` bcrypt write paths in `auth.repository.js`

## Files explicitly NOT modified in Checkpoint 2

- `frontend/design-system/src/api/auth.api.js`
- `frontend/design-system/src/api/client.js`
- `frontend/design-system/src/store/authSlice.js`
- `frontend/design-system/src/lib/socket.js`
- `frontend/design-system/src/App.jsx`
- `frontend/design-system/src/routes/ProtectedRoute.jsx`
- `frontend/design-system/src/routes/OnboardingRoute.jsx`
- `frontend/design-system/src/routes/AuthRoute.jsx`
- `frontend/design-system/auth/{LoginForm,SignupForm,ForgotPasswordForm}.jsx`
- `backend/src/controllers/auth.controller.js`
- `backend/src/routes/auth.routes.js`
- `backend/src/validators/auth.validator.js`
- `backend/src/middlewares/auth.middleware.js`
- `backend/src/sockets/auth.socket.js`
- All other controllers, services, repositories, routes, validators, middlewares, hooks, pages, components

## Migration order (must run in this sequence)

1. **Apply `0004_link_auth.sql`** against the Supabase project. This is purely schema and policy. No app code touches Supabase yet.

2. **Add env vars** to `backend/.env`:
   ```
   SUPABASE_URL=https://<project>.supabase.co
   SUPABASE_ANON_KEY=<anon>
   SUPABASE_SERVICE_KEY=<service-role>   # or keep SUPABASE_KEY
   PASSWORD_RESET_REDIRECT=http://localhost:5173/reset-password
   ```
   `SUPABASE_URL` and `SUPABASE_KEY` already exist; we add `SUPABASE_SERVICE_KEY` (alias accepted) and the redirect URL.

3. **Deploy new backend files** (Checkpoint 2 server-side changes):
   - Add `backend/src/lib/legacyJwt.js`
   - Add `backend/src/services/supabaseAuth.service.js`
   - Rewrite `backend/src/services/auth.service.js` (shim with same exports)
   - Edit `backend/src/repositories/auth.repository.js` (add `createWithSupabaseId` path; keep old paths)
   - Edit `backend/src/repositories/user.repository.js` (add `createWithSupabaseId` helper)
   - Restart `npm run dev` in `backend/`

4. **Smoke test** with the existing frontend. Login / signup / refresh / me / logout / forgot / reset should all behave identically. Use the seeded user from `prisma/seed.js` for the login smoke test.

5. **Backfill existing users** (one-time SQL script, NOT a migration; idempotent):
   ```sql
   -- For each User row missing from auth.users, create a Supabase auth user
   -- and set auth.users.id = "User".id.  This preserves the id alignment.
   ```
   Concretely: write a Node script `backend/scripts/backfill-auth-users.js` that
   iterates the `User` table and, for any row not present in `auth.users`,
   calls `supabase.auth.admin.createUser({email, email_confirm: true, user_metadata:{full_name}})`
   *and* updates `auth.users.id` to match `"User".id` via a follow-up
   `UPDATE auth.users SET id = $1 WHERE id = $2` (Supabase allows this only
   if no FK references exist; if it errors, we fall back to migrating the
   `User.id` to the new auth id and updating FKs). For our schema the
   `User.id → auth.users.id` mapping is the desired final state, so we
   update auth.users to match. See `scripts/backfill-auth-users.js` (created
   in implementation).

6. **Run full Checkpoint 2 test checklist** (below).

## Rollback commands

Checkpoint 2 is fully reversible. None of the schema changes are destructive;
all source changes are additive or behavior-preserving.

```bash
# 1. Revert source files
git checkout -- \
  backend/src/services/auth.service.js \
  backend/src/repositories/auth.repository.js \
  backend/src/repositories/user.repository.js

# 2. Remove new files
rm backend/src/lib/legacyJwt.js
rm backend/src/services/supabaseAuth.service.js
rm backend/scripts/backfill-auth-users.js   # if created

# 3. Revert Supabase schema (0004)
#    Safe: the migration only added a helper and rewrote policies.  To
#    restore Checkpoint 1 state, run 0002's contents again — but 0002 was
#    idempotent and can simply be re-applied.
psql "$SUPABASE_DB_URL" -f supabase/migrations/0002_rls_policies.sql

# 4. The User.password_hash placeholder is harmless; existing bcrypt
#    hashes from before the migration are preserved because we never
#    overwrote them (we only set a placeholder when an account was newly
#    created in Supabase).
```

The frontend was never touched, so no frontend rollback is needed.

## Testing checklist

Run all of the following with the existing frontend (no rebuild required) and
the existing seeded Prisma user (`student@example.com / Password123!`).

### Backend boot
- [ ] `cd backend && npm run dev` starts without error
- [ ] `GET /api/v1/health` returns `{status:'ok'}`
- [ ] No new console errors related to Supabase

### Signup (new user)
- [ ] `POST /api/v1/auth/signup` with `{full_name, email, password, confirm_password}` returns 201
- [ ] Response body has `data.access` (string) and `data.user.{id,email,full_name,role}`
- [ ] `refreshToken` httpOnly cookie is set
- [ ] In Supabase Studio: `auth.users` has a new row with the same id as the new `User` row
- [ ] In Supabase Studio: `User.password_hash` equals the literal string `'supabase-managed'`
- [ ] In Supabase Studio: `User.email` matches the auth user's email
- [ ] In Supabase Studio: `User.role = 'STUDENT'`, `User.is_onboarded = false`, `User.is_active = true`

### Login (seeded user, then a newly signed-up user)
- [ ] `POST /api/v1/auth/login` returns 200
- [ ] Response body has `data.access` and `data.user`
- [ ] `refreshToken` httpOnly cookie is set
- [ ] Calling `/auth/login` with a wrong password returns 401

### Refresh
- [ ] `POST /api/v1/auth/refresh` (cookie-based) returns 200
- [ ] Response body has `data.access` and `data.user`
- [ ] The new cookie value differs from the previous one (rotation)
- [ ] Calling `/auth/refresh` with no cookie returns 401

### Session restore (App.jsx)
- [ ] Open the app, log in, refresh the page — you stay logged in
- [ ] Clear `localStorage.sync_auth` while keeping the cookie — refresh — you stay logged in
- [ ] Clear both the cookie and localStorage — refresh — you are redirected to `/login`

### `/auth/me`
- [ ] With a valid `Authorization: Bearer <access>` header, returns the full `User` row
- [ ] Without the header, returns 401
- [ ] The returned object has `is_onboarded` set correctly

### Logout
- [ ] `POST /auth/logout` clears the cookie and returns `{success:true, message:'Logged out'}`
- [ ] After logout, `/auth/me` returns 401
- [ ] The legacy access token can no longer be used to authenticate any other endpoint

### Forgot / reset (dev)
- [ ] `POST /auth/forgot-password` with a known email returns `{token: <uuid>}`
- [ ] `POST /auth/reset-password` with that token and a new password returns 200
- [ ] After reset, the new password works on `/auth/login`
- [ ] The old password no longer works on `/auth/login`
- [ ] `User.password_hash` is still the placeholder (we never wrote to it)

### Forgot / reset (prod)
- [ ] With `NODE_ENV=production`, `POST /auth/forgot-password` returns `{message: '...'}`
- [ ] (Cannot test email delivery locally — only verify response shape)

### Frontend smoke
- [ ] Open `http://localhost:5173`
- [ ] Sign up a new user → land on `/onboarding`
- [ ] Refresh — still on `/onboarding`
- [ ] Log out — land on `/landing`
- [ ] Log in as `student@example.com` — land on `/dashboard`
- [ ] Open DevTools → Application → Local Storage → `sync_auth` contains the user object and access token
- [ ] Open DevTools → Application → Cookies → `refreshToken` httpOnly cookie is present

### Socket.IO
- [ ] `connectSockets()` succeeds
- [ ] The `/study-rooms` handshake completes (DevTools Network → WS frames show the `auth` payload)
- [ ] Joining a study room returns `room_joined` with members and recent messages
- [ ] The `/notifications` handshake completes

### RLS / Supabase policies
- [ ] As the signed-in user, querying `"User"` from the Supabase client (using their access token) returns exactly one row — their own
- [ ] Querying `"Note"` returns only that user's notes
- [ ] Querying `"Assignment"` returns only that user's assignments
- [ ] An anon SELECT on `"User"` returns 0 rows

### Rollback dry-run
- [ ] Confirm `git checkout` of the three modified files restores the old `auth.service.js`, `auth.repository.js`, `user.repository.js` without errors
- [ ] Confirm removing the new files (`legacyJwt.js`, `supabaseAuth.service.js`, `backfill-auth-users.js`) leaves no dangling imports
- [ ] Confirm the app still works with the old auth code against a Supabase DB that has 0004 applied (i.e., the old code does not depend on the old `current_app_user_id()` function)

### Performance / leak checks
- [ ] No memory growth in the Node process after 100 logins (the `failedLogins` Map was removed)
- [ ] No `bcrypt` calls in the Node process for the auth endpoints (verify with `node --inspect` or a temporary log)
- [ ] No errors logged from the `supabase-js` client on happy path

## Implementation order (file-level, after plan approval)

1. Write `supabase/migrations/0004_link_auth.sql`
2. Write `backend/src/lib/legacyJwt.js`
3. Write `backend/src/services/supabaseAuth.service.js`
4. Write `backend/src/repositories/user.repository.js` edit (add `createWithSupabaseId`)
5. Write `backend/src/repositories/auth.repository.js` edit (no behavior change to existing functions; new helper optional)
6. Write `backend/src/services/auth.service.js` rewrite (same exports, Supabase-backed)
7. Write `backend/scripts/backfill-auth-users.js` (one-shot)
8. Run all checklist items above
9. Report results; await approval for Checkpoint 3

## Out-of-scope for Checkpoint 2 (deferred)

- Removing `User.password_hash` (deferred to Checkpoint 8)
- Removing `User.refresh_token` writes (column kept, writes stopped)
- Removing `PasswordReset` table usage in production (kept for dev)
- Switching `auth.socket.js` to verify Supabase JWTs (deferred)
- Switching Socket.IO namespace auth away from legacy JWT (deferred)
- Removing the legacy `utils/jwt.utils.js` (deferred)
- Frontend rewrites (all of Checkpoint 3+)
