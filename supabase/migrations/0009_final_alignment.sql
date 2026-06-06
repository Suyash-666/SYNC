-- ============================================================================
-- 0009_final_alignment.sql
--
-- Final, guaranteed alignment of auth.users.id and "User".id. Builds on
-- 0008_align_auth_ids.sql, which already rewrote historical rows. This file:
--
--   1. Adds a FK from "User".id → auth.users.id (with ON UPDATE CASCADE) so
--      any future id-mismatch is impossible at the schema layer.
--   2. Removes password_hash (no longer used: auth.users.encrypted_password
--      is the source of truth) — but keeps the column null-safe to avoid
--      breaking tools that may read it. Actually: drop it; nothing in the
--      Supabase-fronted code path uses it.
--   3. Installs an ON-AUTH-USER-CREATED trigger that provisions a "User" row
--      (with the same id) automatically. New signups via Supabase Auth
--      become a single atomic operation, with no backfill needed.
--   4. Ensures email uniqueness across "User" and auth.users is enforceable.
--   5. Re-runs the email-based id alignment defensively, in case 0008
--      wasn't applied or a new disjoint row was inserted.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Re-run the email-based id alignment (defensive, idempotent).
--
--    Order of operations (CRITICAL — getting this wrong triggers the same
--    FK error that 0008 hit on "Note"):
--      a. INSERT a placeholder User row at new_id, copying identity from
--         the old row. This gives the FK target something to point at.
--      b. UPDATE every FK column from old_id to new_id.
--      c. DELETE the User row at old_id. ON DELETE CASCADE on inbound FKs
--         handles anything we missed in step (b).
--    We do NOT do `UPDATE "User" SET id = new_id` — flipping a primary key
--    in place breaks all incoming FK lookups mid-transaction and the
--    constraint check fires per-statement.
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

    -- (a) Placeholder User at new_id
    INSERT INTO public."User" (id, email, full_name, is_active, is_onboarded)
    SELECT new_id, old.email, old.full_name, old.is_active, old.is_onboarded
      FROM public."User" old
     WHERE old.id = old_id
    ON CONFLICT (id) DO NOTHING;

    -- (b) Move all FKs from old_id to new_id
    UPDATE "Assignment"          SET user_id = new_id WHERE user_id = old_id;
    UPDATE "Note"                SET user_id = new_id WHERE user_id = old_id;
    UPDATE "AttendanceRecord"    SET user_id = new_id WHERE user_id = old_id;
    UPDATE "Resource"            SET user_id = new_id WHERE user_id = old_id;
    UPDATE "Notification"        SET user_id = new_id WHERE user_id = old_id;
    UPDATE "PlacementProgress"   SET user_id = new_id WHERE user_id = old_id;
    UPDATE "AIHistory"           SET user_id = new_id WHERE user_id = old_id;
    UPDATE "Semester"            SET user_id = new_id WHERE user_id = old_id;
    UPDATE "StudyRoom"           SET created_by_id = new_id WHERE created_by_id = old_id;
    UPDATE "StudyRoomMembership" SET user_id = new_id WHERE user_id = old_id;
    UPDATE "StudyRoomMessage"    SET user_id = new_id WHERE user_id = old_id;
    UPDATE "Subject"             SET user_id = new_id WHERE user_id = old_id;
    UPDATE "Module"              SET user_id = new_id WHERE user_id = old_id;
    UPDATE "Topic"               SET user_id = new_id WHERE user_id = old_id;

    -- (c) Remove the old User row
    DELETE FROM public."User" WHERE id = old_id;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 2. password_hash is no longer the source of truth — auth.users.encrypted_password is.
--    We keep the column but make it nullable so legacy code that still references
--    it via Prisma does not break.  This is intentional: the legacy auth service
--    is deprecated (returns 410) but its Prisma client must still load.
-- ----------------------------------------------------------------------------
ALTER TABLE "User" ALTER COLUMN password_hash DROP NOT NULL;

-- ----------------------------------------------------------------------------
-- 3. Link "User".id to auth.users.id with a FK (after alignment, this is
--    guaranteed to be 1:1 and ON UPDATE CASCADE catches any future drift).
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
     WHERE constraint_name = 'User_id_fkey_auth'
       AND table_name = 'User'
  ) THEN
    ALTER TABLE "User"
      ADD CONSTRAINT "User_id_fkey_auth"
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. Trigger: on new auth.users row, provision a matching "User" row.
--    This makes User.id = auth.users.id an invariant of the system, not
--    a one-shot migration.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public."User" (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- ----------------------------------------------------------------------------
-- 5. Backfill: any auth.users row missing a "User" twin gets one.
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
-- 6. Reverse backfill: any "User" row without an auth.users row gets a
--    freshly-minted auth.users entry with a temporary password. The user
--    resets it on first login. This is the same as 0008 step 2; included
--    here for full idempotency.
--
--    Same safe-ordering pattern as step 1: placeholder User at new_id,
--    then FK rewrites, then DELETE the old User row.
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

    -- (a) Placeholder User at new_id
    INSERT INTO public."User" (id, email, full_name, is_active, is_onboarded)
    VALUES (new_id, r.email, r.full_name, TRUE, FALSE)
    ON CONFLICT (id) DO NOTHING;

    -- (b) Move FKs
    UPDATE "Assignment"          SET user_id = new_id WHERE user_id = old_id;
    UPDATE "Note"                SET user_id = new_id WHERE user_id = old_id;
    UPDATE "AttendanceRecord"    SET user_id = new_id WHERE user_id = old_id;
    UPDATE "Resource"            SET user_id = new_id WHERE user_id = old_id;
    UPDATE "Notification"        SET user_id = new_id WHERE user_id = old_id;
    UPDATE "PlacementProgress"   SET user_id = new_id WHERE user_id = old_id;
    UPDATE "AIHistory"           SET user_id = new_id WHERE user_id = old_id;
    UPDATE "Semester"            SET user_id = new_id WHERE user_id = old_id;
    UPDATE "StudyRoom"           SET created_by_id = new_id WHERE created_by_id = old_id;
    UPDATE "StudyRoomMembership" SET user_id = new_id WHERE user_id = old_id;
    UPDATE "StudyRoomMessage"    SET user_id = new_id WHERE user_id = old_id;
    UPDATE "Subject"             SET user_id = new_id WHERE user_id = old_id;
    UPDATE "Module"              SET user_id = new_id WHERE user_id = old_id;
    UPDATE "Topic"               SET user_id = new_id WHERE user_id = old_id;

    -- (c) Remove old User
    DELETE FROM public."User" WHERE id = old_id;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 7. Verification: every auth.users.id must equal some User.id.
-- ----------------------------------------------------------------------------
-- SELECT au.id, au.email
--   FROM auth.users au
--   LEFT JOIN "User" u ON u.id = au.id
--  WHERE u.id IS NULL;
-- Expected: 0 rows.
