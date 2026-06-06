-- ============================================================================
-- 0015_fix_note_nullability.sql
--
-- Fixes schema drift on the Note table:
--   - content: live DB has NOT NULL; original schema (0001) has it nullable.
--     This is what blocks "create note" when the user submits an empty body.
--   - tags:    live DB allows NULL; original schema has NOT NULL DEFAULT
--     ARRAY[]::TEXT[]. Tightening this prevents future NULL surprises.
--
-- Note on timestamp types: every TIMESTAMPTZ in 0001 became
-- "timestamp without time zone" in the live DB. This is a real drift but
-- NOT a functional blocker (Postgres coerces values transparently). Fixing
-- it requires an ALTER TYPE on every timestamp column and a brief lock; we
-- defer that to a separate migration once feature testing is done.
-- ============================================================================

-- Allow NULL content (user can save a note with only a title).
ALTER TABLE public."Note" ALTER COLUMN content DROP NOT NULL;

-- Force tags to be NOT NULL with the documented default. Existing NULLs
-- (if any) get replaced with an empty array first so the constraint can
-- be added without error.
UPDATE public."Note" SET tags = ARRAY[]::TEXT[] WHERE tags IS NULL;
ALTER TABLE public."Note" ALTER COLUMN tags SET DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public."Note" ALTER COLUMN tags SET NOT NULL;
