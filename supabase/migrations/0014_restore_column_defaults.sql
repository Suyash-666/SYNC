-- ============================================================================
-- 0014_restore_column_defaults.sql
--
-- Restores DEFAULT expressions on id / created_at / updated_at columns
-- across the schema. These were declared in 0001_init_schema.sql but
-- are missing in the live DB (likely because earlier migrations re-created
-- tables without redeclaring the defaults).
--
-- Symptom: INSERT from Supabase JS client fails with
--   null value in column "id" violates not-null
-- because the client relies on the DB default to mint UUIDs.
--
-- This migration only adds defaults — it does NOT touch existing rows.
-- Safe and idempotent.
-- ============================================================================

-- Per-table column → default mapping (matches 0001_init_schema.sql exactly).

-- User
ALTER TABLE public."User" ALTER COLUMN id         SET DEFAULT gen_random_uuid();
ALTER TABLE public."User" ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public."User" ALTER COLUMN updated_at SET DEFAULT now();

-- Semester
ALTER TABLE public."Semester" ALTER COLUMN id         SET DEFAULT gen_random_uuid();
ALTER TABLE public."Semester" ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public."Semester" ALTER COLUMN updated_at SET DEFAULT now();

-- Subject
ALTER TABLE public."Subject" ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Module
ALTER TABLE public."Module" ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Topic
ALTER TABLE public."Topic" ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- AttendanceRecord
ALTER TABLE public."AttendanceRecord" ALTER COLUMN id         SET DEFAULT gen_random_uuid();
ALTER TABLE public."AttendanceRecord" ALTER COLUMN created_at SET DEFAULT now();

-- Assignment
ALTER TABLE public."Assignment" ALTER COLUMN id         SET DEFAULT gen_random_uuid();
ALTER TABLE public."Assignment" ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public."Assignment" ALTER COLUMN updated_at SET DEFAULT now();

-- Note
ALTER TABLE public."Note" ALTER COLUMN id         SET DEFAULT gen_random_uuid();
ALTER TABLE public."Note" ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public."Note" ALTER COLUMN updated_at SET DEFAULT now();

-- Resource
ALTER TABLE public."Resource" ALTER COLUMN id         SET DEFAULT gen_random_uuid();
ALTER TABLE public."Resource" ALTER COLUMN created_at SET DEFAULT now();

-- AIHistory
ALTER TABLE public."AIHistory" ALTER COLUMN id         SET DEFAULT gen_random_uuid();
ALTER TABLE public."AIHistory" ALTER COLUMN created_at SET DEFAULT now();

-- StudyRoom
ALTER TABLE public."StudyRoom" ALTER COLUMN id         SET DEFAULT gen_random_uuid();
ALTER TABLE public."StudyRoom" ALTER COLUMN created_at SET DEFAULT now();

-- StudyRoomMembership
ALTER TABLE public."StudyRoomMembership" ALTER COLUMN id        SET DEFAULT gen_random_uuid();
ALTER TABLE public."StudyRoomMembership" ALTER COLUMN joined_at SET DEFAULT now();

-- StudyRoomMessage
ALTER TABLE public."StudyRoomMessage" ALTER COLUMN id         SET DEFAULT gen_random_uuid();
ALTER TABLE public."StudyRoomMessage" ALTER COLUMN created_at SET DEFAULT now();

-- Notification
ALTER TABLE public."Notification" ALTER COLUMN id         SET DEFAULT gen_random_uuid();
ALTER TABLE public."Notification" ALTER COLUMN created_at SET DEFAULT now();

-- PlacementProgress
ALTER TABLE public."PlacementProgress" ALTER COLUMN id         SET DEFAULT gen_random_uuid();
ALTER TABLE public."PlacementProgress" ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public."PlacementProgress" ALTER COLUMN updated_at SET DEFAULT now();

-- PasswordReset
ALTER TABLE public."PasswordReset" ALTER COLUMN id         SET DEFAULT gen_random_uuid();
ALTER TABLE public."PasswordReset" ALTER COLUMN created_at SET DEFAULT now();

-- ----------------------------------------------------------------------------
-- Verification (informational — uncomment to inspect)
-- ----------------------------------------------------------------------------
-- SELECT table_name, column_name, column_default
--   FROM information_schema.columns
--  WHERE table_schema = 'public'
--    AND column_name IN ('id', 'created_at', 'updated_at', 'joined_at')
--  ORDER BY table_name, column_name;
-- Expected: every id has gen_random_uuid(); every created_at/updated_at/joined_at
-- has now() (or CURRENT_TIMESTAMP, which is equivalent).
