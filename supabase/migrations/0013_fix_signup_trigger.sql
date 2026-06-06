-- ============================================================================
-- 0013_fix_signup_trigger.sql
--
-- Fixes "Database error saving new user" on Supabase Auth signup.
--
-- Two bugs in the 0009 trigger:
--   (a) RLS was enforced even on SECURITY DEFINER, blocking the insert.
--       Fix: SET row_security = off on the function.
--   (b) The trigger did not supply created_at/updated_at. Those columns are
--       NOT NULL with no effective DEFAULT in this DB, so the insert was
--       rejected with: null value in column "updated_at" violates not-null.
--       Fix: pass now() explicitly.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  INSERT INTO public."User" (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Re-attach the trigger (idempotent — same definition as 0009 step 4).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
