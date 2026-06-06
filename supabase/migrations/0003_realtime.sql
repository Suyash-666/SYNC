-- ============================================================================
-- 0003_realtime.sql
-- Enable Supabase Realtime (postgres_changes) on tables the frontend will
-- subscribe to.  Tables must be added to the `supabase_realtime` publication
-- and have REPLICA IDENTITY FULL so OLD rows contain the full record.
-- ============================================================================

-- Ensure publication exists.  Supabase projects ship with this publication
-- pre-created; the DO block is defensive for projects that don't have it.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Notification: realtime feed of new + updated notifications
-- ----------------------------------------------------------------------------
ALTER TABLE "Notification" REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";

-- ----------------------------------------------------------------------------
-- StudyRoomMessage: realtime feed of new chat messages (typed via Supabase
-- Realtime instead of /study-rooms socket, when enabled).  Currently the
-- /study-rooms socket continues to broadcast; this row stream is added
-- non-destructively so we can opt in client-side during Checkpoint 6.
-- ----------------------------------------------------------------------------
ALTER TABLE "StudyRoomMessage" REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE "StudyRoomMessage";

-- ----------------------------------------------------------------------------
-- StudyRoomMembership: room join/leave presence
-- ----------------------------------------------------------------------------
ALTER TABLE "StudyRoomMembership" REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE "StudyRoomMembership";
