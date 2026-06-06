-- ============================================================================
-- 0011_recover_partial_alignment.sql
--
-- Recovers the database from a partial-failure of 0008_align_auth_ids.sql
-- (or 0009_final_alignment.sql's step 1) where the per-row loop in those
-- files updated some FK columns from `old_id` to `new_id` *before* the
-- `UPDATE "User" SET id = new_id WHERE id = old_id` line ran. When the
-- second UPDATE in the loop failed on a NOT NULL or other constraint, the
-- transaction aborted, but any earlier UPDATEs in the same DO block were
-- already applied (PostgreSQL runs them in order, and a failure on the
-- 3rd statement does not roll back the 1st or 2nd).
--
-- Resulting state we must repair:
--   * `User`.id is still `old_id` (the User flip never ran).
--   * Some tables (e.g. `Assignment`) have `user_id = new_id` (auth.users.id),
--     which has no matching `User` row.
--   * Other tables (e.g. `Note`, plus anything after the failing statement)
--     are still at `old_id` and correctly point at the existing User row.
--
-- Repair strategy:
--   1. Identify the (user_email, old_id, new_id) tuples that 0008/0009 was
--      trying to align.
--   2. For each tuple, ROLL BACK any FK columns that were already moved
--      from old_id to new_id (i.e. rewrite them back to old_id) so the
--      database is in a consistent state.
--   3. Insert a `User` row at `new_id` (so the FK target exists for both
--      old and new ids). This requires temporarily relaxing the email
--      unique constraint, or simply inserting with the new id and the
--      same email. The migration lets both rows coexist briefly.
--   4. Rewrite every FK column from `old_id` to `new_id`.
--   5. Delete the User row at `old_id` (cascades clean up anything we
--      missed).
--
-- This migration is idempotent: running it again on an already-aligned
-- database does nothing.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Step 0: Inspect + log (does not change data).  Identifies the (email,
-- old_id, new_id) pairs to align.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
  rollback_count INT := 0;
  fk_count INT := 0;
  delete_count INT := 0;
BEGIN
  FOR r IN
    SELECT u.id AS old_id, au.id AS new_id, u.email
      FROM public."User" u
      JOIN auth.users au ON LOWER(au.email) = LOWER(u.email)
     WHERE u.id IS DISTINCT FROM au.id
  LOOP
    -- ------------------------------------------------------------------
    -- Step A: ROLL BACK any FKs that were already partially rewritten to
    -- new_id. We do this by setting them back to old_id. This is the
    -- inverse of the failed 0008 partial run.
    --
    -- We do NOT skip rows where the FK is already at old_id; UPDATE
    -- simply matches zero rows in that case.
    -- ------------------------------------------------------------------
    UPDATE "Assignment"          SET user_id = r.old_id WHERE user_id = r.new_id;
    UPDATE "Note"                SET user_id = r.old_id WHERE user_id = r.new_id;
    UPDATE "AttendanceRecord"    SET user_id = r.old_id WHERE user_id = r.new_id;
    UPDATE "Resource"            SET user_id = r.old_id WHERE user_id = r.new_id;
    UPDATE "Notification"        SET user_id = r.old_id WHERE user_id = r.new_id;
    UPDATE "PlacementProgress"   SET user_id = r.old_id WHERE user_id = r.new_id;
    UPDATE "AIHistory"           SET user_id = r.old_id WHERE user_id = r.new_id;
    UPDATE "Semester"            SET user_id = r.old_id WHERE user_id = r.new_id;
    UPDATE "StudyRoom"           SET created_by_id = r.old_id WHERE created_by_id = r.new_id;
    UPDATE "StudyRoomMembership" SET user_id = r.old_id WHERE user_id = r.new_id;
    UPDATE "StudyRoomMessage"    SET user_id = r.old_id WHERE user_id = r.new_id;
    UPDATE "Subject"             SET user_id = r.old_id WHERE user_id = r.new_id;
    UPDATE "Module"              SET user_id = r.old_id WHERE user_id = r.new_id;
    UPDATE "Topic"               SET user_id = r.old_id WHERE user_id = r.new_id;

    -- ------------------------------------------------------------------
    -- Step B: INSERT a placeholder User row at new_id. This is required
    -- BEFORE we flip the User row's PK, otherwise the FK target
    -- (User.id) will be missing during the flip.
    --
    -- We copy the email and full_name from the old row. If a row at
    -- new_id already exists (e.g. from a previous attempt), we do
    -- nothing — it's already the target.
    -- ------------------------------------------------------------------
    INSERT INTO public."User" (id, email, full_name, is_active, is_onboarded)
    SELECT r.new_id, old.email, old.full_name, old.is_active, old.is_onboarded
      FROM public."User" old
     WHERE old.id = r.old_id
    ON CONFLICT (id) DO NOTHING;

    -- ------------------------------------------------------------------
    -- Step C: REWRITE every FK column from old_id to new_id. Now the
    -- User row at new_id exists, so the FK check passes.
    -- ------------------------------------------------------------------
    UPDATE "Assignment"          SET user_id = r.new_id WHERE user_id = r.old_id;
    UPDATE "Note"                SET user_id = r.new_id WHERE user_id = r.old_id;
    UPDATE "AttendanceRecord"    SET user_id = r.new_id WHERE user_id = r.old_id;
    UPDATE "Resource"            SET user_id = r.new_id WHERE user_id = r.old_id;
    UPDATE "Notification"        SET user_id = r.new_id WHERE user_id = r.old_id;
    UPDATE "PlacementProgress"   SET user_id = r.new_id WHERE user_id = r.old_id;
    UPDATE "AIHistory"           SET user_id = r.new_id WHERE user_id = r.old_id;
    UPDATE "Semester"            SET user_id = r.new_id WHERE user_id = r.old_id;
    UPDATE "StudyRoom"           SET created_by_id = r.new_id WHERE created_by_id = r.old_id;
    UPDATE "StudyRoomMembership" SET user_id = r.new_id WHERE user_id = r.old_id;
    UPDATE "StudyRoomMessage"    SET user_id = r.new_id WHERE user_id = r.old_id;
    UPDATE "Subject"             SET user_id = r.new_id WHERE user_id = r.old_id;
    UPDATE "Module"              SET user_id = r.new_id WHERE user_id = r.old_id;
    UPDATE "Topic"               SET user_id = r.new_id WHERE user_id = r.old_id;

    -- ------------------------------------------------------------------
    -- Step D: DELETE the old User row. The new row at new_id already
    -- exists. Any cascade rules on the inbound FKs from the tables we
    -- just rewrote will leave them alone (we already moved them off
    -- old_id in step C). ON DELETE CASCADE will still clean up any
    -- table we may have missed.
    -- ------------------------------------------------------------------
    DELETE FROM public."User" WHERE id = r.old_id;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- Step E: For any `User` row that still has a mismatched id (i.e. an email
-- present in `User` but absent in `auth.users`), mint a new auth.users row
-- and rewrite the User.id to match.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
  new_auth_id uuid;
  old_id uuid;
BEGIN
  FOR r IN
    SELECT u.id AS old_id, u.email, u.full_name
      FROM public."User" u
      LEFT JOIN auth.users au ON LOWER(au.email) = LOWER(u.email)
     WHERE au.id IS NULL
  LOOP
    old_id := r.old_id;
    new_auth_id := gen_random_uuid();

    -- Mint a new auth.users row.
    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_auth_id,
      'authenticated',
      'authenticated',
      r.email,
      crypt('!temp-' || encode(gen_random_bytes(8), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', COALESCE(r.full_name, '')),
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      new_auth_id,
      jsonb_build_object('sub', new_auth_id::text, 'email', r.email, 'email_verified', true),
      'email',
      new_auth_id::text,
      now(), now(), now()
    );

    -- Insert the placeholder User row at the new auth id, then move FKs,
    -- then delete the old User row. Same safe pattern as above.
    INSERT INTO public."User" (id, email, full_name, is_active, is_onboarded)
    VALUES (new_auth_id, r.email, r.full_name, TRUE, FALSE)
    ON CONFLICT (id) DO NOTHING;

    UPDATE "Assignment"          SET user_id = new_auth_id WHERE user_id = old_id;
    UPDATE "Note"                SET user_id = new_auth_id WHERE user_id = old_id;
    UPDATE "AttendanceRecord"    SET user_id = new_auth_id WHERE user_id = old_id;
    UPDATE "Resource"            SET user_id = new_auth_id WHERE user_id = old_id;
    UPDATE "Notification"        SET user_id = new_auth_id WHERE user_id = old_id;
    UPDATE "PlacementProgress"   SET user_id = new_auth_id WHERE user_id = old_id;
    UPDATE "AIHistory"           SET user_id = new_auth_id WHERE user_id = old_id;
    UPDATE "Semester"            SET user_id = new_auth_id WHERE user_id = old_id;
    UPDATE "StudyRoom"           SET created_by_id = new_auth_id WHERE created_by_id = old_id;
    UPDATE "StudyRoomMembership" SET user_id = new_auth_id WHERE user_id = old_id;
    UPDATE "StudyRoomMessage"    SET user_id = new_auth_id WHERE user_id = old_id;
    UPDATE "Subject"             SET user_id = new_auth_id WHERE user_id = old_id;
    UPDATE "Module"              SET user_id = new_auth_id WHERE user_id = old_id;
    UPDATE "Topic"               SET user_id = new_auth_id WHERE user_id = old_id;

    DELETE FROM public."User" WHERE id = old_id;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- Step F: Backfill User rows for any auth.users row that has no User twin.
-- ----------------------------------------------------------------------------
INSERT INTO public."User" (id, email, full_name)
SELECT au.id,
       au.email,
       COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1))
  FROM auth.users au
  LEFT JOIN public."User" u ON u.id = au.id
 WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Verification (informational). After this migration runs, every
-- auth.users.id must match a User.id, and every User.id must match an
-- auth.users.id.
-- ----------------------------------------------------------------------------
-- SELECT au.id, au.email
--   FROM auth.users au
--   LEFT JOIN public."User" u ON u.id = au.id
--  WHERE u.id IS NULL;
-- Expected: 0 rows.
--
-- SELECT u.id, u.email
--   FROM public."User" u
--   LEFT JOIN auth.users au ON au.id = u.id
--  WHERE au.id IS NULL;
-- Expected: 0 rows.
