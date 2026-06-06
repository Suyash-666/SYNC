-- ============================================================================
-- 0016_rebuild_app_user_id_indirection.sql
--
-- Resurrect the public.app_user_id indirection table so the RLS policy
-- `user_update_own ON "User"` (defined in 0002_rls_policies.sql as
--   USING (id = public.current_app_user_id())
--   WITH CHECK (id = public.current_app_user_id())
-- )
-- actually resolves the caller's User id. Without this migration, every
-- authenticated UPDATE / SELECT on "User" was rejected silently with
-- zero rows affected — the calling user got a "success" response but
-- nothing was written.
--
-- Root cause:
--   0012_safe_alignment.sql (and 0009_final_alignment.sql before it)
--   rewrote "User".id so that it equals auth.users.id for every row.
--   But public.app_user_id was populated by 0004_link_auth.sql with the
--   *pre-alignment* User ids, so its rows are now stale. The function
--   current_app_user_id() looks up the indirection by auth.uid() and
--   returns NULL — which makes the RLS predicates FALSE for every
--   authenticated caller.
--
-- The fix is one INSERT per User row, keyed on the now-equal
-- auth.users.id = "User".id invariant. After this migration:
--   current_app_user_id() = auth.uid() for every signed-in user
--   and the "User" RLS policies resolve correctly.
--
-- Idempotent: re-running only touches rows that are out of sync.
-- ============================================================================

-- 1. Make sure the indirection has a row for every existing User.
INSERT INTO public.app_user_id (auth_user_id, app_user_id)
SELECT u.id, u.id
  FROM public."User" u
  LEFT JOIN public.app_user_id m
    ON m.auth_user_id = u.id
   AND m.app_user_id  = u.id
 WHERE m.auth_user_id IS NULL
ON CONFLICT (auth_user_id) DO UPDATE
   SET app_user_id = EXCLUDED.app_user_id;

-- 2. Belt-and-braces: when auth_user_id and app_user_id are the same
--    (which is the post-alignment invariant), collapse any pre-existing
--    row that pointed at the wrong User id so the lookup is exact.
UPDATE public.app_user_id m
   SET app_user_id = au.id
  FROM auth.users au
 WHERE m.auth_user_id = au.id
   AND m.app_user_id <> au.id
   AND EXISTS (SELECT 1 FROM public."User" u WHERE u.id = au.id);

-- 3. Sanity guard: every User row now has an indirection row.
DO $$
DECLARE
  missing INT;
BEGIN
  SELECT COUNT(*) INTO missing
    FROM public."User" u
    LEFT JOIN public.app_user_id m ON m.auth_user_id = u.id
   WHERE m.auth_user_id IS NULL;
  IF missing > 0 THEN
    RAISE WARNING '0016: % User rows still have no indirection — auth.uid() lookup will return NULL for those users', missing;
  END IF;
END $$;
