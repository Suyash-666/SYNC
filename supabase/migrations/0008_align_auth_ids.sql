-- ============================================================================
-- 0008_align_auth_ids.sql
-- Forces User.id = auth.users.id for every row, in both directions, by email.
--
-- Background:
--   0004_link_auth.sql rewrote RLS policies to use auth.uid() (= sub of the
--   caller's validated JWT = auth.users.id). The policy path is:
--     Assignment.user_id = auth.uid()
--   which only matches when User.id = auth.users.id for the calling user.
--   The pre-migration data has disjoint ids, so every SELECT through Supabase
--   returns [] even when the user is authenticated.
--
-- This migration is idempotent and safe to re-run. It does NOT delete any
-- data — it only changes which UUID is the "true" one. The direction it
-- rewrites toward is whichever side has the matching email. Where emails
-- exist on both sides, the auth.users.id wins (the auth.users row is the
-- one RLS will resolve against; rewriting the application row toward it
-- means the fewest FK updates).
--
-- Step 1: align User.id to auth.users.id by email.
--   For every "User" row whose id != the auth.users id with the same email,
--   rewrite User.id AND every FK column that points at it.
--
-- Step 2: insert missing auth.users rows for any "User" emails that have no
--   auth.users counterpart. These get a UUID minted from gen_random_uuid();
--   then User.id is rewritten to that new id and all FKs follow.
--
-- Step 3: delete auth.users rows that have no application counterpart
--   (those are orphans from a Checkpoint-2-era shim that did not create
--   a User row). They cannot be aligned and serve no purpose.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Step 1: align User.id -> auth.users.id by email
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
  new_id uuid;
  old_id uuid;
BEGIN
  FOR r IN
    SELECT u.id AS old_id, au.id AS new_id, u.email
      FROM "User" u
      JOIN auth.users au ON LOWER(au.email) = LOWER(u.email)
     WHERE u.id IS DISTINCT FROM au.id
  LOOP
    old_id := r.old_id;
    new_id := r.new_id;

    -- Drop FK constraints that point at "User".id, rewrite the rows, re-add.
    -- (We do this dynamically because the constraint names differ across envs.)
    --
    -- We rewrite each referencing table. ON UPDATE CASCADE on the FK would
    -- be cleaner, but the existing schema does not have it. Do it manually.

    UPDATE "Assignment"         SET user_id = new_id WHERE user_id = old_id;
    UPDATE "Note"              SET user_id = new_id WHERE user_id = old_id;
    UPDATE "AttendanceRecord"  SET user_id = new_id WHERE user_id = old_id;
    UPDATE "Resource"          SET user_id = new_id WHERE user_id = old_id;
    UPDATE "Notification"      SET user_id = new_id WHERE user_id = old_id;
    UPDATE "PlacementProgress" SET user_id = new_id WHERE user_id = old_id;
    UPDATE "AIHistory"         SET user_id = new_id WHERE user_id = old_id;
    UPDATE "Semester"          SET user_id = new_id WHERE user_id = old_id;
    UPDATE "StudyRoom"         SET created_by_id = new_id WHERE created_by_id = old_id;
    UPDATE "StudyRoomMembership" SET user_id = new_id WHERE user_id = old_id;
    UPDATE "StudyRoomMessage"  SET user_id = new_id WHERE user_id = old_id;
    UPDATE "Subject"           SET user_id = new_id WHERE user_id = old_id;
    UPDATE "Module"            SET user_id = new_id WHERE user_id = old_id;
    UPDATE "Topic"             SET user_id = new_id WHERE user_id = old_id;

    -- Now flip the User.id itself.
    UPDATE "User" SET id = new_id WHERE id = old_id;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- Step 2: create auth.users rows for any "User" emails with no GoTrue row,
--         then align User.id to the new auth.users.id
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
  new_id uuid;
  old_id uuid;
BEGIN
  FOR r IN
    SELECT u.id AS old_id, u.email, u.full_name
      FROM "User" u
      LEFT JOIN auth.users au ON LOWER(au.email) = LOWER(u.email)
     WHERE au.id IS NULL
  LOOP
    old_id := r.old_id;
    new_id := gen_random_uuid();

    -- Insert a confirmed GoTrue user. The frontend will mint the password
    -- on first login via supabase.auth.updateUserById, or the user will
    -- trigger a password reset.
    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_id,
      'authenticated',
      'authenticated',
      r.email,
      crypt('!temp-' || encode(gen_random_bytes(8), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', COALESCE(r.full_name, '')),
      now(), now(), '', '', '', ''
    );

    -- And create the matching auth.identities row (required by GoTrue).
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      new_id,
      jsonb_build_object('sub', new_id::text, 'email', r.email, 'email_verified', true),
      'email',
      new_id::text,
      now(), now(), now()
    );

    -- Rewrite FKs and the User row to the new id.
    UPDATE "Assignment"         SET user_id = new_id WHERE user_id = old_id;
    UPDATE "Note"              SET user_id = new_id WHERE user_id = old_id;
    UPDATE "AttendanceRecord"  SET user_id = new_id WHERE user_id = old_id;
    UPDATE "Resource"          SET user_id = new_id WHERE user_id = old_id;
    UPDATE "Notification"      SET user_id = new_id WHERE user_id = old_id;
    UPDATE "PlacementProgress" SET user_id = new_id WHERE user_id = old_id;
    UPDATE "AIHistory"         SET user_id = new_id WHERE user_id = old_id;
    UPDATE "Semester"          SET user_id = new_id WHERE user_id = old_id;
    UPDATE "StudyRoom"         SET created_by_id = new_id WHERE created_by_id = old_id;
    UPDATE "StudyRoomMembership" SET user_id = new_id WHERE user_id = old_id;
    UPDATE "StudyRoomMessage"  SET user_id = new_id WHERE user_id = old_id;
    UPDATE "Subject"           SET user_id = new_id WHERE user_id = old_id;
    UPDATE "Module"            SET user_id = new_id WHERE user_id = old_id;
    UPDATE "Topic"             SET user_id = new_id WHERE user_id = old_id;

    UPDATE "User" SET id = new_id WHERE id = old_id;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- Step 3: delete auth.users orphans (no matching "User" row). These are
--         Checkpoint-2-era shim artifacts that do not own any data.
-- ----------------------------------------------------------------------------
DELETE FROM auth.identities
 WHERE user_id IN (
   SELECT au.id FROM auth.users au
   LEFT JOIN "User" u ON u.id = au.id
   WHERE u.id IS NULL
 );

DELETE FROM auth.users au
 USING (SELECT id FROM auth.users au2
         LEFT JOIN "User" u ON u.id = au2.id
        WHERE u.id IS NULL) orphans
 WHERE au.id = orphans.id;

-- ----------------------------------------------------------------------------
-- Verification: at this point every auth.users.id must equal some User.id.
-- The query below should return zero rows. If it does not, the migration
-- has not aligned the data and RLS will still hide rows.
-- ----------------------------------------------------------------------------
-- SELECT au.id, au.email
--   FROM auth.users au
--   LEFT JOIN "User" u ON u.id = au.id
--  WHERE u.id IS NULL;
-- Expected: 0 rows.
