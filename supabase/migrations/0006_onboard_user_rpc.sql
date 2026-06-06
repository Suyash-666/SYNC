-- ============================================================================
-- 0006_onboard_user_rpc.sql
-- Atomic onboarding: update User metadata + create a Semester row
-- in a single transaction.  Mirrors backend/src/services/onboarding.service.js
-- .updateUserOnboarding.
--
-- Called from frontend via:  supabase.rpc('onboard_user', { payload })
--
-- The function takes a single JSONB `payload` argument with the
-- onboarding fields, performs auth.uid() check, validates constraints,
-- and returns a single row with the created semester.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.onboard_user(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    UUID := auth.uid();
  v_degree     TEXT := payload->>'degree';
  v_college    TEXT := payload->>'college';
  v_total      INT  := (payload->>'total_semesters')::INT;
  v_current    INT  := (payload->>'current_semester')::INT;
  v_start      TIMESTAMPTZ := NULLIF(payload->>'semester_start_date', '')::TIMESTAMPTZ;
  v_end        TIMESTAMPTZ := NULLIF(payload->>'semester_end_date', '')::TIMESTAMPTZ;
  v_semester   "Semester";
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not signed in' USING ERRCODE = '42501';
  END IF;

  IF v_degree IS NULL OR v_college IS NULL THEN
    RAISE EXCEPTION 'degree and college are required' USING ERRCODE = '22023';
  END IF;

  IF v_total IS NULL OR v_total <= 0 THEN
    RAISE EXCEPTION 'total_semesters must be a positive integer' USING ERRCODE = '22023';
  END IF;

  IF v_current IS NULL OR v_current <= 0 THEN
    RAISE EXCEPTION 'current_semester must be a positive integer' USING ERRCODE = '22023';
  END IF;

  IF v_current > v_total THEN
    RAISE EXCEPTION 'current_semester cannot exceed total_semesters' USING ERRCODE = '22023';
  END IF;

  -- Update user metadata
  UPDATE "User"
     SET degree           = v_degree,
         college          = v_college,
         total_semesters  = v_total,
         is_onboarded     = TRUE
   WHERE id = v_user_id;

  -- Unset any other "current" semesters for this user
  UPDATE "Semester"
     SET is_current = FALSE
   WHERE user_id = v_user_id AND is_current = TRUE;

  -- Insert the new current semester
  INSERT INTO "Semester" (
    user_id, semester_number, academic_year,
    start_date, end_date, is_current
  ) VALUES (
    v_user_id, v_current, EXTRACT(YEAR FROM NOW())::TEXT,
    v_start, v_end, TRUE
  )
  RETURNING * INTO v_semester;

  -- Build response — mirror the legacy controller's shape:
  --   { semester: <Semester row> }
  RETURN jsonb_build_object('semester', to_jsonb(v_semester));
END;
$$;

REVOKE ALL ON FUNCTION public.onboard_user(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.onboard_user(jsonb) TO authenticated;
