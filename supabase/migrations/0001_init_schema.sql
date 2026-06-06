-- ============================================================================
-- 0001_init_schema.sql
-- Mirrors backend/prisma/schema.prisma as plain PostgreSQL DDL.
-- Safe to run against an empty Supabase project. Idempotent where possible
-- (uses IF NOT EXISTS). All column names, types, and onDelete behavior match
-- the Prisma model so the existing Node + Prisma code can keep reading from
-- the same database while the Supabase JS client is wired up in parallel.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('STUDENT', 'MODERATOR', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AssignmentStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'REVIEW', 'SUBMITTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "FileType" AS ENUM ('PDF', 'IMAGE', 'LINK', 'VIDEO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AIRole" AS ENUM ('USER', 'ASSISTANT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM (
    'ASSIGNMENT', 'ATTENDANCE', 'AI_SUGGESTION', 'COLLABORATION', 'SYSTEM'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PlacementCategory" AS ENUM ('DSA', 'INTERVIEW', 'APTITUDE', 'RESUME');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PlacementStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------------------------------------------
-- Generic updated_at trigger function (matches Prisma @updatedAt behavior)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- User
--   Note: id is UUID. We keep the same default so Prisma's uuid() still works
--   when rows are created via Prisma. We do NOT add a FK to auth.users yet —
--   the Auth migration in Checkpoint 2 will add it via 0004_link_auth.sql.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "User" (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email               TEXT         UNIQUE NOT NULL,
  password_hash       TEXT         NOT NULL,
  full_name           TEXT         NOT NULL,
  avatar_url          TEXT,
  role                "Role"       NOT NULL DEFAULT 'STUDENT',
  college             TEXT,
  degree              TEXT,
  total_semesters     INTEGER,
  is_onboarded        BOOLEAN      NOT NULL DEFAULT FALSE,
  is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
  refresh_token       TEXT,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_user_updated_at ON "User";
CREATE TRIGGER trg_user_updated_at
  BEFORE UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Semester
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Semester" (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  semester_number INTEGER      NOT NULL,
  academic_year   TEXT         NOT NULL,
  start_date      TIMESTAMPTZ,
  end_date        TIMESTAMPTZ,
  is_current      BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_semester_updated_at ON "Semester";
CREATE TRIGGER trg_semester_updated_at
  BEFORE UPDATE ON "Semester"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Subject
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Subject" (
  id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id        UUID         NOT NULL REFERENCES "Semester"(id) ON DELETE CASCADE,
  name               TEXT         NOT NULL,
  subject_code       TEXT,
  total_modules      INTEGER      NOT NULL DEFAULT 0,
  completed_modules  INTEGER      NOT NULL DEFAULT 0,
  internal_max_marks INTEGER,
  internal_scored    INTEGER
);
CREATE INDEX IF NOT EXISTS idx_subject_semester_id ON "Subject"(semester_id);

-- ----------------------------------------------------------------------------
-- Module
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Module" (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id  UUID    NOT NULL REFERENCES "Subject"(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL,
  order_index INTEGER NOT NULL
);

-- ----------------------------------------------------------------------------
-- Topic
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Topic" (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id    UUID    NOT NULL REFERENCES "Module"(id) ON DELETE CASCADE,
  name         TEXT    NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE
);

-- ----------------------------------------------------------------------------
-- AttendanceRecord  (composite unique matches Prisma @@unique([subject_id,date]))
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "AttendanceRecord" (
  id          UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id  UUID              REFERENCES "Subject"(id) ON DELETE CASCADE,
  user_id     UUID              NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  date        TIMESTAMPTZ       NOT NULL,
  status      "AttendanceStatus" NOT NULL,
  created_at  TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  CONSTRAINT attendance_subject_date_unique UNIQUE (subject_id, date)
);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON "AttendanceRecord"(user_id, date);

-- ----------------------------------------------------------------------------
-- Assignment
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Assignment" (
  id           UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID              NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  subject_id   UUID              REFERENCES "Subject"(id) ON DELETE SET NULL,
  title        TEXT              NOT NULL,
  description  TEXT,
  status       "AssignmentStatus" NOT NULL DEFAULT 'TODO',
  priority     "Priority"        NOT NULL DEFAULT 'MEDIUM',
  due_date     TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_assignment_updated_at ON "Assignment";
CREATE TRIGGER trg_assignment_updated_at
  BEFORE UPDATE ON "Assignment"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS idx_assignment_user_status ON "Assignment"(user_id, status);

-- ----------------------------------------------------------------------------
-- Note
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Note" (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID         NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  title      TEXT         NOT NULL,
  content    TEXT,
  folder     TEXT,
  tags       TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
  is_deleted BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_note_updated_at ON "Note";
CREATE TRIGGER trg_note_updated_at
  BEFORE UPDATE ON "Note"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS idx_note_user_deleted ON "Note"(user_id, is_deleted);

-- ----------------------------------------------------------------------------
-- Resource
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Resource" (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID         NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  subject_id UUID         REFERENCES "Subject"(id) ON DELETE SET NULL,
  title      TEXT         NOT NULL,
  file_url   TEXT         NOT NULL,
  file_type  "FileType"   NOT NULL,
  file_size  INTEGER,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- AIHistory
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "AIHistory" (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  conversation_id UUID         NOT NULL,
  role            "AIRole"     NOT NULL,
  content         TEXT         NOT NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_history_conversation ON "AIHistory"(conversation_id, created_at);

-- ----------------------------------------------------------------------------
-- StudyRoom
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "StudyRoom" (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT         NOT NULL,
  subject_tag    TEXT,
  created_by_id  UUID         REFERENCES "User"(id) ON DELETE SET NULL,
  is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- StudyRoomMembership  (composite unique matches Prisma @@unique([room_id,user_id]))
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "StudyRoomMembership" (
  id        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id   UUID         NOT NULL REFERENCES "StudyRoom"(id) ON DELETE CASCADE,
  user_id   UUID         NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT studyroom_membership_unique UNIQUE (room_id, user_id)
);

-- ----------------------------------------------------------------------------
-- StudyRoomMessage
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "StudyRoomMessage" (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    UUID         NOT NULL REFERENCES "StudyRoom"(id) ON DELETE CASCADE,
  user_id    UUID         NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  content    TEXT         NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_studyroom_msg_room_created
  ON "StudyRoomMessage"(room_id, created_at);

-- ----------------------------------------------------------------------------
-- Notification
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Notification" (
  id         UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID                 NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  type       "NotificationType"   NOT NULL,
  title      TEXT                 NOT NULL,
  body       TEXT                 NOT NULL,
  is_read    BOOLEAN              NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notification_user_created
  ON "Notification"(user_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- PlacementProgress
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "PlacementProgress" (
  id         UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID                NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  category   "PlacementCategory" NOT NULL,
  topic      TEXT                NOT NULL,
  item_name  TEXT                NOT NULL,
  status     "PlacementStatus"   NOT NULL DEFAULT 'NOT_STARTED',
  difficulty "Difficulty",
  notes      TEXT,
  created_at TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_placement_updated_at ON "PlacementProgress";
CREATE TRIGGER trg_placement_updated_at
  BEFORE UPDATE ON "PlacementProgress"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- PasswordReset
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "PasswordReset" (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID         NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  token_hash TEXT         NOT NULL,
  expires_at TIMESTAMPTZ  NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_passwordreset_user ON "PasswordReset"(user_id);
