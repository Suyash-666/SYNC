-- ============================================================================
-- 0002_rls_policies.sql
-- Enable RLS on every table and define per-user policies.
--
-- Convention: the authenticated user's UUID is exposed by Supabase as
-- auth.uid() (NULL for anonymous, which is fine for SELECT on some
-- public-ish tables like StudyRoom.is_active=true).
--
-- We rely on auth.users.id to match our "User".id. The link is created in
-- Checkpoint 2 (0004_link_auth.sql) via a UNIQUE constraint. For now we use
-- an indirection table  public.app_user_id(auth_user_id) → "User".id
-- so that RLS works in this checkpoint without depending on Auth yet.
--
-- This indirection is REMOVED in Checkpoint 2 when auth.users.id and
-- "User".id are aligned directly. For the duration of Checkpoint 1,
-- policies that need a user-id check use a SECURITY DEFINER helper:
--   public.current_app_user_id() returns UUID
-- which returns:
--   - the caller's auth.uid() when auth_user_id has been mapped in
--     public.app_user_id(auth_user_id)
--   - NULL otherwise (no rows visible)
-- This is safe: it can't escalate; it only returns the caller's own mapping.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Indirection: which app "User".id does the current auth user correspond to?
-- Filled in during Checkpoint 2 (Auth migration). Empty during Checkpoint 1,
-- so all RLS-restricted tables return zero rows until Checkpoint 2 — this is
-- expected and proves the policies are correctly enforced.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_user_id (
  auth_user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  app_user_id  UUID NOT NULL UNIQUE REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT app_user_id FROM public.app_user_id WHERE auth_user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.current_app_user_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO authenticated, anon;

-- ----------------------------------------------------------------------------
-- Enable RLS on every public table. The Prisma connection (which uses the
-- service role / direct URL) bypasses RLS, so the existing Node code keeps
-- working.  PostgREST and supabase-js clients with the anon key get the
-- policies below.
-- ----------------------------------------------------------------------------
ALTER TABLE "User"                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Semester"                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subject"                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Module"                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Topic"                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AttendanceRecord"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Assignment"                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Note"                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Resource"                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AIHistory"                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudyRoom"                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudyRoomMembership"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudyRoomMessage"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlacementProgress"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PasswordReset"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_user_id            ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Helper: only the row owner (or service role) can read/write app_user_id.
-- ----------------------------------------------------------------------------
CREATE POLICY app_user_id_self_select ON public.app_user_id
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY app_user_id_self_insert ON public.app_user_id
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY app_user_id_self_update ON public.app_user_id
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- ============================================================================
-- Per-table policies
-- ============================================================================

-- ---- User -----------------------------------------------------------------
-- A user can read their own row, update it. Insert is performed by the
-- service role during signup. Delete is service-role-only.
DROP POLICY IF EXISTS user_select_own ON "User";
CREATE POLICY user_select_own ON "User"
  FOR SELECT TO authenticated
  USING (id = public.current_app_user_id());

DROP POLICY IF EXISTS user_update_own ON "User";
CREATE POLICY user_update_own ON "User"
  FOR UPDATE TO authenticated
  USING (id = public.current_app_user_id())
  WITH CHECK (id = public.current_app_user_id());

-- ---- Semester -------------------------------------------------------------
DROP POLICY IF EXISTS semester_owner_all ON "Semester";
CREATE POLICY semester_owner_all ON "Semester"
  FOR ALL TO authenticated
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());

-- ---- Subject (via Semester) ----------------------------------------------
DROP POLICY IF EXISTS subject_via_semester ON "Subject";
CREATE POLICY subject_via_semester ON "Subject"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Semester" s
      WHERE s.id = "Subject".semester_id
        AND s.user_id = public.current_app_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Semester" s
      WHERE s.id = "Subject".semester_id
        AND s.user_id = public.current_app_user_id()
    )
  );

-- ---- Module (via Subject → Semester) --------------------------------------
DROP POLICY IF EXISTS module_via_subject ON "Module";
CREATE POLICY module_via_subject ON "Module"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Subject" sub
      JOIN "Semester" sem ON sem.id = sub.semester_id
      WHERE sub.id = "Module".subject_id
        AND sem.user_id = public.current_app_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Subject" sub
      JOIN "Semester" sem ON sem.id = sub.semester_id
      WHERE sub.id = "Module".subject_id
        AND sem.user_id = public.current_app_user_id()
    )
  );

-- ---- Topic (via Module → Subject → Semester) ------------------------------
DROP POLICY IF EXISTS topic_via_module ON "Topic";
CREATE POLICY topic_via_module ON "Topic"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Module" m
      JOIN "Subject" sub ON sub.id = m.subject_id
      JOIN "Semester" sem ON sem.id = sub.semester_id
      WHERE m.id = "Topic".module_id
        AND sem.user_id = public.current_app_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Module" m
      JOIN "Subject" sub ON sub.id = m.subject_id
      JOIN "Semester" sem ON sem.id = sub.semester_id
      WHERE m.id = "Topic".module_id
        AND sem.user_id = public.current_app_user_id()
    )
  );

-- ---- AttendanceRecord (direct user_id) ------------------------------------
DROP POLICY IF EXISTS attendance_owner ON "AttendanceRecord";
CREATE POLICY attendance_owner ON "AttendanceRecord"
  FOR ALL TO authenticated
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());

-- ---- Assignment (direct user_id) ------------------------------------------
DROP POLICY IF EXISTS assignment_owner ON "Assignment";
CREATE POLICY assignment_owner ON "Assignment"
  FOR ALL TO authenticated
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());

-- ---- Note (direct user_id) ------------------------------------------------
DROP POLICY IF EXISTS note_owner ON "Note";
CREATE POLICY note_owner ON "Note"
  FOR ALL TO authenticated
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());

-- ---- Resource (direct user_id) --------------------------------------------
DROP POLICY IF EXISTS resource_owner ON "Resource";
CREATE POLICY resource_owner ON "Resource"
  FOR ALL TO authenticated
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());

-- ---- AIHistory (direct user_id) -------------------------------------------
DROP POLICY IF EXISTS aihistory_owner ON "AIHistory";
CREATE POLICY aihistory_owner ON "AIHistory"
  FOR ALL TO authenticated
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());

-- ---- StudyRoom ------------------------------------------------------------
-- SELECT is open to all authenticated users (rooms are browsable).
-- INSERT: any authenticated user can create.
-- UPDATE/DELETE: only the creator (or service role).
DROP POLICY IF EXISTS studyroom_select_all ON "StudyRoom";
CREATE POLICY studyroom_select_all ON "StudyRoom"
  FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS studyroom_insert_auth ON "StudyRoom";
CREATE POLICY studyroom_insert_auth ON "StudyRoom"
  FOR INSERT TO authenticated
  WITH CHECK (created_by_id = public.current_app_user_id() OR created_by_id IS NULL);

DROP POLICY IF EXISTS studyroom_update_creator ON "StudyRoom";
CREATE POLICY studyroom_update_creator ON "StudyRoom"
  FOR UPDATE TO authenticated
  USING (created_by_id = public.current_app_user_id())
  WITH CHECK (created_by_id = public.current_app_user_id());

DROP POLICY IF EXISTS studyroom_delete_creator ON "StudyRoom";
CREATE POLICY studyroom_delete_creator ON "StudyRoom"
  FOR DELETE TO authenticated
  USING (created_by_id = public.current_app_user_id());

-- ---- StudyRoomMembership --------------------------------------------------
-- Members can read the room membership.  Users can join (insert themselves)
-- and leave (delete their own row).  Room creator can remove anyone.
DROP POLICY IF EXISTS srm_select_members ON "StudyRoomMembership";
CREATE POLICY srm_select_members ON "StudyRoomMembership"
  FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS srm_insert_self ON "StudyRoomMembership";
CREATE POLICY srm_insert_self ON "StudyRoomMembership"
  FOR INSERT TO authenticated
  WITH CHECK (user_id = public.current_app_user_id());

DROP POLICY IF EXISTS srm_delete_self_or_creator ON "StudyRoomMembership";
CREATE POLICY srm_delete_self_or_creator ON "StudyRoomMembership"
  FOR DELETE TO authenticated
  USING (
    user_id = public.current_app_user_id()
    OR EXISTS (
      SELECT 1 FROM "StudyRoom" r
      WHERE r.id = "StudyRoomMembership".room_id
        AND r.created_by_id = public.current_app_user_id()
    )
  );

-- ---- StudyRoomMessage -----------------------------------------------------
-- Members of the room can read; members can insert their own messages.
DROP POLICY IF EXISTS srmsg_select_member ON "StudyRoomMessage";
CREATE POLICY srmsg_select_member ON "StudyRoomMessage"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "StudyRoomMembership" m
      WHERE m.room_id = "StudyRoomMessage".room_id
        AND m.user_id = public.current_app_user_id()
    )
    OR EXISTS (
      SELECT 1 FROM "StudyRoom" r
      WHERE r.id = "StudyRoomMessage".room_id
        AND r.created_by_id = public.current_app_user_id()
    )
  );

DROP POLICY IF EXISTS srmsg_insert_member ON "StudyRoomMessage";
CREATE POLICY srmsg_insert_member ON "StudyRoomMessage"
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = public.current_app_user_id()
    AND (
      EXISTS (
        SELECT 1 FROM "StudyRoomMembership" m
        WHERE m.room_id = "StudyRoomMessage".room_id
          AND m.user_id = public.current_app_user_id()
      )
      OR EXISTS (
        SELECT 1 FROM "StudyRoom" r
        WHERE r.id = "StudyRoomMessage".room_id
          AND r.created_by_id = public.current_app_user_id()
      )
    )
  );

-- ---- Notification ---------------------------------------------------------
-- A user sees only their own notifications and can mark them read.
DROP POLICY IF EXISTS notif_owner ON "Notification";
CREATE POLICY notif_owner ON "Notification"
  FOR ALL TO authenticated
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());

-- ---- PlacementProgress ----------------------------------------------------
DROP POLICY IF EXISTS placement_owner ON "PlacementProgress";
CREATE POLICY placement_owner ON "PlacementProgress"
  FOR ALL TO authenticated
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());

-- ---- PasswordReset --------------------------------------------------------
-- Service-role only.  Users never touch this directly.
DROP POLICY IF EXISTS passwordreset_no_client ON "PasswordReset";
-- (no policy ⇒ no anon access; service role bypasses RLS)
