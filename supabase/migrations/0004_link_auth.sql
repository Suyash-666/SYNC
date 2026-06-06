-- ============================================================================
-- 0004_link_auth.sql
-- Aligns "User".id with auth.users.id, drops the app_user_id indirection
-- table from 0002, and rewrites RLS policies to use auth.uid() directly.
--
-- This is the migration promised in CHECKPOINT_2_PLAN.md §1. Checkpoint 2
-- itself was paused (only Checkpoints 1 and 3 were implemented), so this
-- file is being created now as a Checkpoint 3 prerequisite.
--
-- It is safe to apply in three cases:
--   1. The Supabase project is brand new (no users yet).
--   2. There are existing "User" rows whose ids already equal auth.users.id.
--      (This is the case if any user signed up via the Checkpoint 2 backend
--      shim that mints legacy JWTs after calling supabase.auth.admin.)
--   3. The backfill script in backend/scripts/backfill-auth-users.js (also
--      from the Checkpoint 2 plan) has been run to align existing rows.
--
-- If none of these hold, apply the backfill script first or the policies
-- below will hide every existing "User" row.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Drop the app_user_id indirection and the helper function
-- ----------------------------------------------------------------------------


-- ----------------------------------------------------------------------------
-- 2. Replace every policy that referenced current_app_user_id() with one
--    that uses auth.uid() directly. The new convention is:
--      id = auth.uid()              -- for tables whose owner column is id
--      user_id = auth.uid()         -- for tables whose owner column is user_id
--      created_by_id = auth.uid()   -- for StudyRoom
--      nested via parent tables     -- for Subject/Module/Topic/StudyRoomMessage
--
--    We DROP and re-CREATE each policy to keep the file idempotent.
-- ----------------------------------------------------------------------------

-- ---- User ----------------------------------------------------------------
DROP POLICY IF EXISTS user_select_own ON "User";
CREATE POLICY user_select_own ON "User"
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS user_update_own ON "User";
CREATE POLICY user_update_own ON "User"
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ---- Semester ------------------------------------------------------------
DROP POLICY IF EXISTS semester_owner_all ON "Semester";
CREATE POLICY semester_owner_all ON "Semester"
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---- Subject (via Semester) ---------------------------------------------
DROP POLICY IF EXISTS subject_via_semester ON "Subject";
CREATE POLICY subject_via_semester ON "Subject"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Semester" s
      WHERE s.id = "Subject".semester_id
        AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Semester" s
      WHERE s.id = "Subject".semester_id
        AND s.user_id = auth.uid()
    )
  );

-- ---- Module (via Subject → Semester) -------------------------------------
DROP POLICY IF EXISTS module_via_subject ON "Module";
CREATE POLICY module_via_subject ON "Module"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Subject" sub
      JOIN "Semester" sem ON sem.id = sub.semester_id
      WHERE sub.id = "Module".subject_id
        AND sem.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Subject" sub
      JOIN "Semester" sem ON sem.id = sub.semester_id
      WHERE sub.id = "Module".subject_id
        AND sem.user_id = auth.uid()
    )
  );

-- ---- Topic (via Module → Subject → Semester) -----------------------------
DROP POLICY IF EXISTS topic_via_module ON "Topic";
CREATE POLICY topic_via_module ON "Topic"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Module" m
      JOIN "Subject" sub ON sub.id = m.subject_id
      JOIN "Semester" sem ON sem.id = sub.semester_id
      WHERE m.id = "Topic".module_id
        AND sem.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Module" m
      JOIN "Subject" sub ON sub.id = m.subject_id
      JOIN "Semester" sem ON sem.id = sub.semester_id
      WHERE m.id = "Topic".module_id
        AND sem.user_id = auth.uid()
    )
  );

-- ---- AttendanceRecord (direct user_id) -----------------------------------
DROP POLICY IF EXISTS attendance_owner ON "AttendanceRecord";
CREATE POLICY attendance_owner ON "AttendanceRecord"
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---- Assignment (direct user_id) -----------------------------------------
DROP POLICY IF EXISTS assignment_owner ON "Assignment";
CREATE POLICY assignment_owner ON "Assignment"
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---- Note (direct user_id) -----------------------------------------------
DROP POLICY IF EXISTS note_owner ON "Note";
CREATE POLICY note_owner ON "Note"
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---- Resource (direct user_id) -------------------------------------------
DROP POLICY IF EXISTS resource_owner ON "Resource";
CREATE POLICY resource_owner ON "Resource"
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---- AIHistory (direct user_id) ------------------------------------------
DROP POLICY IF EXISTS aihistory_owner ON "AIHistory";
CREATE POLICY aihistory_owner ON "AIHistory"
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---- StudyRoom -----------------------------------------------------------
DROP POLICY IF EXISTS studyroom_select_all ON "StudyRoom";
CREATE POLICY studyroom_select_all ON "StudyRoom"
  FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS studyroom_insert_auth ON "StudyRoom";
CREATE POLICY studyroom_insert_auth ON "StudyRoom"
  FOR INSERT TO authenticated
  WITH CHECK (created_by_id = auth.uid() OR created_by_id IS NULL);

DROP POLICY IF EXISTS studyroom_update_creator ON "StudyRoom";
CREATE POLICY studyroom_update_creator ON "StudyRoom"
  FOR UPDATE TO authenticated
  USING (created_by_id = auth.uid())
  WITH CHECK (created_by_id = auth.uid());

DROP POLICY IF EXISTS studyroom_delete_creator ON "StudyRoom";
CREATE POLICY studyroom_delete_creator ON "StudyRoom"
  FOR DELETE TO authenticated
  USING (created_by_id = auth.uid());

-- ---- StudyRoomMembership -------------------------------------------------
DROP POLICY IF EXISTS srm_select_members ON "StudyRoomMembership";
CREATE POLICY srm_select_members ON "StudyRoomMembership"
  FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS srm_insert_self ON "StudyRoomMembership";
CREATE POLICY srm_insert_self ON "StudyRoomMembership"
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS srm_delete_self_or_creator ON "StudyRoomMembership";
CREATE POLICY srm_delete_self_or_creator ON "StudyRoomMembership"
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM "StudyRoom" r
      WHERE r.id = "StudyRoomMembership".room_id
        AND r.created_by_id = auth.uid()
    )
  );

-- ---- StudyRoomMessage ----------------------------------------------------
DROP POLICY IF EXISTS srmsg_select_member ON "StudyRoomMessage";
CREATE POLICY srmsg_select_member ON "StudyRoomMessage"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "StudyRoomMembership" m
      WHERE m.room_id = "StudyRoomMessage".room_id
        AND m.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM "StudyRoom" r
      WHERE r.id = "StudyRoomMessage".room_id
        AND r.created_by_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS srmsg_insert_member ON "StudyRoomMessage";
CREATE POLICY srmsg_insert_member ON "StudyRoomMessage"
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM "StudyRoomMembership" m
        WHERE m.room_id = "StudyRoomMessage".room_id
          AND m.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM "StudyRoom" r
        WHERE r.id = "StudyRoomMessage".room_id
          AND r.created_by_id = auth.uid()
      )
    )
  );

-- ---- Notification --------------------------------------------------------
DROP POLICY IF EXISTS notif_owner ON "Notification";
CREATE POLICY notif_owner ON "Notification"
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---- PlacementProgress ---------------------------------------------------
DROP POLICY IF EXISTS placement_owner ON "PlacementProgress";
CREATE POLICY placement_owner ON "PlacementProgress"
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 3. Verification query (informational; not part of the schema)
-- ============================================================================
-- After applying this file, the following query should return ZERO rows for
-- any "User" row, because policies that referenced the dropped function will
-- have been removed and re-created using auth.uid():
--
--   SELECT policyname, qual
--     FROM pg_policies
--    WHERE schemaname = 'public'
--      AND (qual LIKE '%current_app_user_id%' OR with_check LIKE '%current_app_user_id%');
--
-- Expected: 0 rows.
-- ============================================================================
DROP TABLE IF EXISTS public.app_user_id CASCADE;
DROP FUNCTION IF EXISTS public.current_app_user_id();