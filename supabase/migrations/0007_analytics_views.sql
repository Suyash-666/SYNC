-- ============================================================================
-- 0007_analytics_views.sql
-- One view per analytics endpoint, per MIGRATION_RULES.md §5.
-- Views are SECURITY INVOKER; RLS on the underlying tables still applies
-- because the views run with the caller's auth.uid().
-- ============================================================================

-- ---- analytics_overview ---------------------------------------------------
-- 4 numbers: attendancePct, pendingAssignments, studyStreak, assignmentCompletionRate
CREATE OR REPLACE VIEW public.analytics_overview AS
SELECT
  u.id AS user_id,
  COALESCE((
    SELECT ROUND(100.0 * SUM(CASE WHEN ar.status = 'PRESENT' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0))::INT
      FROM "AttendanceRecord" ar
      JOIN "Subject" s ON s.id = ar.subject_id
      JOIN "Semester" sem ON sem.id = s.semester_id
     WHERE sem.user_id = u.id AND sem.is_current = TRUE
  ), 0) AS "attendancePct",
  COALESCE((
    SELECT COUNT(*)::INT
      FROM "Assignment"
     WHERE user_id = u.id AND status IN ('TODO','IN_PROGRESS','REVIEW')
  ), 0) AS "pendingAssignments",
  0::INT AS "studyStreak",   -- placeholder; requires additional data
  COALESCE((
    SELECT ROUND(100.0 *
      SUM(CASE WHEN status = 'SUBMITTED' THEN 1 ELSE 0 END) /
      NULLIF(SUM(CASE WHEN status IN ('SUBMITTED','IN_PROGRESS','TODO') THEN 1 ELSE 0 END), 0))::INT
      FROM "Assignment"
     WHERE user_id = u.id
  ), 0) AS "assignmentCompletionRate"
FROM "User" u;

-- ---- analytics_attendance -------------------------------------------------
-- One row per day, columns: date, present, absent, total
-- `period` is handled in the frontend (filter the view)
CREATE OR REPLACE VIEW public.analytics_attendance AS
SELECT
  u.id AS user_id,
  date_trunc('day', ar.date)::date AS date,
  COUNT(*) FILTER (WHERE ar.status = 'PRESENT')::INT AS present,
  COUNT(*) FILTER (WHERE ar.status = 'ABSENT')::INT  AS absent,
  COUNT(*)::INT AS total
FROM "User" u
JOIN "AttendanceRecord" ar ON ar.user_id = u.id
GROUP BY u.id, date_trunc('day', ar.date);

-- ---- analytics_assignments ------------------------------------------------
-- One row per week, columns: week, assigned, submitted, overdue
CREATE OR REPLACE VIEW public.analytics_assignments AS
SELECT
  u.id AS user_id,
  date_trunc('week', a.created_at)::date AS week,
  COUNT(*)::INT AS assigned,
  COUNT(*) FILTER (WHERE a.status = 'SUBMITTED')::INT AS submitted,
  COUNT(*) FILTER (WHERE a.due_date < NOW() AND a.status <> 'SUBMITTED')::INT AS overdue
FROM "User" u
JOIN "Assignment" a ON a.user_id = u.id
GROUP BY u.id, date_trunc('week', a.created_at);

-- ---- analytics_productivity ----------------------------------------------
-- { total, breakdown: { attendanceScore, assignmentScore, streakScore, notesScore } }
CREATE OR REPLACE VIEW public.analytics_productivity AS
SELECT
  u.id AS user_id,
  0::INT AS "attendanceScore",    -- placeholder
  0::INT AS "assignmentScore",   -- placeholder
  0::INT AS "streakScore",       -- placeholder
  0::INT AS "notesScore",        -- placeholder
  0::INT AS total                 -- placeholder
FROM "User" u;

-- ---- analytics_subjects --------------------------------------------------
-- [{ subject: {id, name}, modules, topicsCompleted, topicsTotal }]
CREATE OR REPLACE VIEW public.analytics_subjects AS
SELECT
  u.id AS user_id,
  s.id AS subject_id,
  s.name AS subject_name,
  (SELECT COUNT(*) FROM "Module" m WHERE m.subject_id = s.id)::INT AS modules,
  (SELECT COUNT(*) FROM "Topic" t JOIN "Module" m ON m.id = t.module_id WHERE m.subject_id = s.id AND t.is_completed = TRUE)::INT AS "topicsCompleted",
  (SELECT COUNT(*) FROM "Topic" t JOIN "Module" m ON m.id = t.module_id WHERE m.subject_id = s.id)::INT AS "topicsTotal"
FROM "User" u
JOIN "Semester" sem ON sem.user_id = u.id AND sem.is_current = TRUE
JOIN "Subject" s ON s.semester_id = sem.id;

-- ============================================================================
-- Grant SELECT to authenticated users (RLS on underlying tables still applies
-- because the views are SECURITY INVOKER by default).
-- ============================================================================
GRANT SELECT ON public.analytics_overview     TO authenticated;
GRANT SELECT ON public.analytics_attendance   TO authenticated;
GRANT SELECT ON public.analytics_assignments  TO authenticated;
GRANT SELECT ON public.analytics_productivity TO authenticated;
GRANT SELECT ON public.analytics_subjects     TO authenticated;
