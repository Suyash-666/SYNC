# Supabase Migration — Checkpoint 1

Additive setup for the SYNC → Supabase migration.  Nothing in this checkpoint
removes, replaces, or modifies existing backend behavior.  The Express
backend, Prisma schema, JWT auth, and Socket.IO server are untouched.

## What this checkpoint adds

| File | Purpose |
|---|---|
| `migrations/0001_init_schema.sql` | Plain-SQL mirror of `backend/prisma/schema.prisma`.  Same tables, columns, types, defaults, indexes, FKs, and onDelete actions.  Adds an `updated_at` trigger to match Prisma's `@updatedAt`. |
| `migrations/0002_rls_policies.sql` | Enables RLS on every table and adds per-user policies.  Uses an indirection table `public.app_user_id` so policies work even before Checkpoint 2 wires Supabase Auth.  The indirection is removed in `0004_link_auth.sql`. |
| `migrations/0003_realtime.sql` | Adds `Notification`, `StudyRoomMessage`, and `StudyRoomMembership` to the `supabase_realtime` publication with `REPLICA IDENTITY FULL`.  Supabase Realtime is opt-in on the client; this just makes the data stream available. |
| `../backend/src/lib/supabase.js` | New factory module exporting `supabaseAdmin()` (service role) and `createUserClient(accessToken)`.  Additive; no existing file imports it yet. |
| `../backend/src/config/env.js` | Adds two new optional exports: `SUPABASE_SERVICE_KEY` (falls back to `SUPABASE_KEY`) and `SUPABASE_ANON_KEY`.  All original exports are unchanged. |

## What this checkpoint does NOT do

- Does **not** modify the frontend.
- Does **not** delete any backend file.
- Does **not** disable Prisma; Prisma + Express still serve every API call.
- Does **not** alter the `User.password_hash` flow.
- Does **not** link `auth.users` to `"User"` yet (that's Checkpoint 2).
- Does **not** require any environment variable changes to run locally
  (the new `lib/supabase.js` returns `null` if env is missing).

## Apply order

Run against a fresh Supabase project database.  Each file is idempotent.

```bash
# From the project root
psql "$SUPABASE_DB_URL" -f supabase/migrations/0001_init_schema.sql
psql "$SUPABASE_DB_URL" -f supabase/migrations/0002_rls_policies.sql
psql "$SUPABASE_DB_URL" -f supabase/migrations/0003_realtime.sql
```

Or via the Supabase SQL editor: paste the three files in order.

## Verify Checkpoint 1 (no frontend change required)

```sql
-- 1. Tables exist
SELECT table_name FROM information_schema.tables
 WHERE table_schema = 'public' ORDER BY table_name;

-- 2. RLS is on
SELECT tablename, rowsecurity FROM pg_tables
 WHERE schemaname = 'public' AND tablename IN
       ('User','Semester','Subject','Assignment','Note','Resource',
        'Notification','StudyRoom','StudyRoomMessage','PlacementProgress');

-- 3. RLS denies anon SELECT on a user-owned table
SET ROLE anon;
SELECT count(*) FROM "Note";                       -- expect 0
SET ROLE authenticated;
SELECT count(*) FROM "Note";                       -- expect 0 (no app_user_id mapping yet)
RESET ROLE;

-- 4. Publication contains our tables
SELECT pubname, schemaname, tablename
  FROM pg_publication_tables
 WHERE pubname = 'supabase_realtime'
   AND tablename IN ('Notification','StudyRoomMessage','StudyRoomMembership');
```

Expected: all checks pass.  During Checkpoint 1 the `authenticated` role sees
no rows because `public.app_user_id` is empty — this is by design and proves
the policies are enforced.  Checkpoint 2 will populate `app_user_id` during
signup and the rows will become visible to the right users.

## Smoke test the Node module

```bash
cd backend
node -e "const s = require('./src/lib/supabase'); console.log(s.supabaseAdmin() === null ? 'OK: supabase not configured (expected)' : 'OK: supabase admin client ready');"
```

## Rollback

Checkpoint 1 is purely additive.  To roll back:

```bash
# Drop the entire schema (DESTRUCTIVE — only if the project is brand new)
psql "$SUPABASE_DB_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Or, surgically, drop just the new objects
psql "$SUPABASE_DB_URL" <<'SQL'
DROP PUBLICATION IF EXISTS supabase_realtime;
DROP FUNCTION IF EXISTS public.current_app_user_id();
DROP TABLE IF EXISTS public.app_user_id CASCADE;
-- Tables from 0001 are kept; if you want to drop them too:
-- DROP TABLE IF EXISTS "PasswordReset" CASCADE;
-- ... (one per table)
SQL
```

Then revert the two source-tree files:

```bash
git checkout -- backend/src/config/env.js
rm backend/src/lib/supabase.js
```

Frontend and existing backend behavior are unaffected either way.
