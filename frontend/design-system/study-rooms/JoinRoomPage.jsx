import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Hash, Loader2, Sparkles, Users } from 'lucide-react';
import { studyRoomsApi } from '../src/api';
import { Button, Card, EmptyState, Skeleton, Toast } from '../components';

/**
 * JoinRoomPage — landing for /join/:code
 *
 * Flow:
 *   1. Authenticated user opens the link.
 *   2. We preview the invite (room name, subject, invite state).
 *   3. User clicks "Join room" → redeem → redirect to the rooms page with
 *      the new room selected.
 */
export default function JoinRoomPage() {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState({ open: false, variant: 'info', message: '' });

  const preview = useQuery({
    queryKey: ['invite-preview', code],
    queryFn: () => studyRoomsApi.previewInvite(code),
    enabled: Boolean(code),
    retry: false,
  });

  const redeem = useMutation({
    mutationFn: () => studyRoomsApi.redeemInvite(code),
  });

  // If we just landed here from an email / chat link, surface a nice
  // empty state if the code is bad.
  const showToast = (variant, message) => setToast({ open: true, variant, message });

  const handleJoin = async () => {
    try {
      const result = await redeem.mutateAsync();
      const roomId = result?.room?.id || result?.data?.room?.id;
      await queryClient.invalidateQueries({ queryKey: ['study-rooms'] });
      if (roomId) {
        navigate(`/study-rooms?room=${roomId}`);
      } else {
        navigate('/study-rooms');
      }
    } catch (err) {
      showToast('error', err?.response?.data?.message || err?.message || 'Could not join room');
    }
  };

  if (preview.isLoading) {
    return (
      <div className="mx-auto max-w-md p-6">
        <Skeleton variant="block" className="h-48" />
      </div>
    );
  }

  if (preview.isError) {
    return (
      <div className="mx-auto max-w-md p-6">
        <Card className="p-6">
          <EmptyState
            icon={<AlertCircle className="h-6 w-6" />}
            title="Invite not found"
            description="This invite link is invalid or has been removed. Ask the room owner for a fresh one."
            actionLabel="Back to study rooms"
            onAction={() => navigate('/study-rooms')}
          />
        </Card>
      </div>
    );
  }

  const data = preview.data || {};
  const room = data.room || {};
  const invite = data.invite || {};

  const reasonText = {
    revoked: 'This invite has been revoked.',
    expired: 'This invite has expired.',
    exhausted: 'This invite has reached its usage limit.',
  }[invite.reason];

  return (
    <div className="mx-auto max-w-md p-6">
      <Toast
        open={toast.open}
        variant={toast.variant}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
        message={toast.message}
      />
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Card className="overflow-hidden p-0">
          <div className="flex items-center gap-3 border-b border-border-subtle bg-gradient-to-br from-brand-50 to-background-subtle px-6 py-5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xs font-semibold uppercase tracking-[0.14em] text-foreground-muted">Study room invite</div>
              <div className="text-base font-semibold text-foreground">You've been invited!</div>
            </div>
          </div>

          <div className="space-y-4 px-6 py-5">
            <div>
              <div className="text-2xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">Room</div>
              <div className="mt-1 text-lg font-semibold text-foreground">{room.name || 'Untitled room'}</div>
              {room.subject_tag ? (
                <div className="mt-0.5 inline-flex items-center gap-1.5 rounded-full border border-border bg-background-subtle px-2 py-0.5 text-2xs font-semibold text-foreground-muted">
                  <Hash className="h-3 w-3" /> {room.subject_tag}
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-background-subtle px-3 py-2 text-2xs text-foreground-muted">
              <Users className="h-3.5 w-3.5" />
              <span>Realtime chat + study tools with everyone in the room.</span>
            </div>

            {!invite.usable && reasonText ? (
              <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-foreground">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                <span>{reasonText}</span>
              </div>
            ) : null}

            <Button
              onClick={handleJoin}
              disabled={!invite.usable || redeem.isPending}
              className="w-full"
              trailingIcon={redeem.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            >
              {redeem.isPending ? 'Joining…' : 'Join room'}
            </Button>

            <div className="text-center font-mono text-2xs text-foreground-subtle">Code: {code}</div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
