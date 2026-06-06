-- ============================================================================
-- 0012_safe_alignment.sql
--
-- The single, safe alignment migration. Replaces 0008/0009/0011 (which had
-- bugs around FK-check ordering). Run this ONCE. It is idempotent.
--
-- Verified DB state at authorship time (2026-06-05):
--   - 3 "User" rows: john@gmail.com, math@gmail.com, sp4367475@gmail.com
--   - 3 auth.users rows with matching identities; only sp4367475@gmail.com
--     has a matching User row by email (with disjoint ids).
--   - No partial id-rewrites exist (all FK rows still at original User.id).
--
-- The pattern (CRITICAL — getting the order wrong is what broke 0008):
--   (a) INSERT a placeholder User at new_id FIRST.
--   (b) THEN move every FK column from old_id to new_id.
--   (c) THEN delete the old User row.
-- The FK constraints are NOT DEFERRABLE, so the placeholder must exist
-- before any UPDATE references it.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Step 1: For every "User" whose email matches an auth.users but with a
--         different id, align User.id to the auth.users id.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
  old_id uuid;
  new_id uuid;
BEGIN
  FOR r IN
    SELECT u.id AS old_id, au.id AS new_id, u.email
      FROM public."User" u
      JOIN auth.users au ON LOWER(au.email) = LOWER(u.email)
     WHERE u.id IS DISTINCT FROM au.id
  LOOP
    old_id := r.old_id;
    new_id := r.new_id;

    -- (a) Park the old row's email under a temporary value so the placeholder
    --     can claim the real email without violating "User_email_key".
    --     The old row is going to be deleted in step (c); this rename never
    --     reaches anything else.
    UPDATE public."User" SET email = '__migrating__:' || id::text || ':' || email
     WHERE id = old_id;

    -- (b) Placeholder User row at new_id, copying identity from old row.
    INSERT INTO public."User" (
      id, email, password_hash, full_name, avatar_url, role,
      college, degree, total_semesters, is_onboarded, is_active,
      created_at, updated_at
    )
    SELECT new_id, r.email, old.password_hash, old.full_name, old.avatar_url, old.role,
           old.college, old.degree, old.total_semesters, old.is_onboarded, old.is_active,
           old.created_at, old.updated_at
      FROM public."User" old
     WHERE old.id = old_id
    ON CONFLICT (id) DO NOTHING;

    -- (c) Move every FK from old_id to new_id.
    UPDATE "Assignment"          SET user_id      = new_id WHERE user_id      = old_id;
    UPDATE "Note"                SET user_id      = new_id WHERE user_id      = old_id;
    UPDATE "AttendanceRecord"    SET user_id      = new_id WHERE user_id      = old_id;
    UPDATE "Resource"            SET user_id      = new_id WHERE user_id      = old_id;
    UPDATE "Notification"        SET user_id      = new_id WHERE user_id      = old_id;
    UPDATE "PlacementProgress"   SET user_id      = new_id WHERE user_id      = old_id;
    UPDATE "AIHistory"           SET user_id      = new_id WHERE user_id      = old_id;
    UPDATE "Semester"            SET user_id      = new_id WHERE user_id      = old_id;
    UPDATE "StudyRoom"           SET created_by_id= new_id WHERE created_by_id= old_id;
    UPDATE "StudyRoomMembership" SET user_id      = new_id WHERE user_id      = old_id;
    UPDATE "StudyRoomMessage"    SET user_id      = new_id WHERE user_id      = old_id;
    UPDATE "PasswordReset"       SET user_id      = new_id WHERE user_id      = old_id;

    -- (d) Old User row is now unreferenced — delete it (and its parked email).
    DELETE FROM public."User" WHERE id = old_id;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- Step 2: For every "User" with NO matching auth.users row, mint a new
--         auth.users row and align User.id to it.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
  old_id uuid;
  new_id uuid;
BEGIN
  FOR r IN
    SELECT u.id AS old_id, u.email, u.full_name
      FROM public."User" u
      LEFT JOIN auth.users au ON LOWER(au.email) = LOWER(u.email)
     WHERE au.id IS NULL
  LOOP
    old_id := r.old_id;
    new_id := gen_random_uuid();

    -- Mint the auth.users row (confirmed, temporary password).
    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
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
      now(), now(),
      '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      new_id,
      jsonb_build_object('sub', new_id::text, 'email', r.email, 'email_verified', true),
      'email',
      new_id::text,
      now(), now(), now()
    );

    -- (a) Park the old row's email so the placeholder can claim it.
    UPDATE public."User" SET email = '__migrating__:' || id::text || ':' || email
     WHERE id = old_id;

    -- (b) Placeholder User at new_id
    INSERT INTO public."User" (
      id, email, password_hash, full_name, avatar_url, role,
      college, degree, total_semesters, is_onboarded, is_active,
      created_at, updated_at
    )
    SELECT new_id, r.email, old.password_hash, old.full_name, old.avatar_url, old.role,
           old.college, old.degree, old.total_semesters, old.is_onboarded, old.is_active,
           old.created_at, old.updated_at
      FROM public."User" old
     WHERE old.id = old_id
    ON CONFLICT (id) DO NOTHING;

    -- (c) Move FKs
    UPDATE "Assignment"          SET user_id      = new_id WHERE user_id      = old_id;
    UPDATE "Note"                SET user_id      = new_id WHERE user_id      = old_id;
    UPDATE "AttendanceRecord"    SET user_id      = new_id WHERE user_id      = old_id;
    UPDATE "Resource"            SET user_id      = new_id WHERE user_id      = old_id;
    UPDATE "Notification"        SET user_id      = new_id WHERE user_id      = old_id;
    UPDATE "PlacementProgress"   SET user_id      = new_id WHERE user_id      = old_id;
    UPDATE "AIHistory"           SET user_id      = new_id WHERE user_id      = old_id;
    UPDATE "Semester"            SET user_id      = new_id WHERE user_id      = old_id;
    UPDATE "StudyRoom"           SET created_by_id= new_id WHERE created_by_id= old_id;
    UPDATE "StudyRoomMembership" SET user_id      = new_id WHERE user_id      = old_id;
    UPDATE "StudyRoomMessage"    SET user_id      = new_id WHERE user_id      = old_id;
    UPDATE "PasswordReset"       SET user_id      = new_id WHERE user_id      = old_id;

    -- (d) Delete old User
    DELETE FROM public."User" WHERE id = old_id;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- Step 3: Delete auth.users orphans (no matching public."User" row).
--         These are leftovers from earlier shim attempts and own no data.
-- ----------------------------------------------------------------------------
DELETE FROM auth.identities
 WHERE user_id IN (
   SELECT au.id FROM auth.users au
   LEFT JOIN public."User" u ON u.id = au.id
    WHERE u.id IS NULL
 );

DELETE FROM auth.users
 WHERE id IN (
   SELECT au.id FROM auth.users au
   LEFT JOIN public."User" u ON u.id = au.id
    WHERE u.id IS NULL
 );

-- ----------------------------------------------------------------------------
-- Step 4: Verification (informational — uncomment in editor to inspect)
-- ----------------------------------------------------------------------------
-- SELECT u.id, u.email,
--        CASE WHEN u.id = au.id THEN 'aligned' ELSE 'BROKEN' END AS state
--   FROM public."User" u
--   FULL OUTER JOIN auth.users au ON LOWER(u.email) = LOWER(au.email)
--  ORDER BY COALESCE(u.email, au.email);
-- Expected: every row says 'aligned', no NULLs on either side.
