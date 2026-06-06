import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Check, Link2, RotateCw, X, AlertCircle } from 'lucide-react';
import { studyRoomsApi } from '../src/api';
import { Button, Modal, Toast } from '../components';

function buildJoinUrl(code) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/join/${code}`;
}

function CopyableLink({ url, onCopied }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for older browsers / restricted contexts.
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch {}
      ta.remove();
    }
    setCopied(true);
    onCopied?.();
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="group flex w-full items-center gap-2 rounded-lg border border-border bg-background-subtle px-3 py-2.5 text-left transition-colors hover:border-foreground/30"
    >
      <Link2 className="h-4 w-4 shrink-0 text-foreground-muted" />
      <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">{url}</span>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-2xs font-semibold text-foreground-muted group-hover:text-foreground">
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? 'Copied' : 'Copy'}
      </span>
    </button>
  );
}

function StatusPill({ invite }) {
  if (invite.revoked_at) return <span className="rounded-full bg-danger-soft px-2 py-0.5 text-2xs font-semibold text-danger">Revoked</span>;
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return <span className="rounded-full bg-warning-soft px-2 py-0.5 text-2xs font-semibold text-foreground">Expired</span>;
  }
  if (invite.max_uses != null && invite.use_count >= invite.max_uses) {
    return <span className="rounded-full bg-warning-soft px-2 py-0.5 text-2xs font-semibold text-foreground">Exhausted</span>;
  }
  return <span className="rounded-full bg-success-soft px-2 py-0.5 text-2xs font-semibold text-success">Active</span>;
}

export default function InviteModal({ isOpen, onClose, roomId, roomName, isOwner }) {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState({ open: false, variant: 'info', message: '' });

  // Close on Escape / backdrop is handled by the shared Modal.
  // List existing invites only if the user is the owner.
  const invitesQuery = useQuery({
    queryKey: ['study-room-invites', roomId],
    queryFn: () => studyRoomsApi.listInvites(roomId),
    enabled: Boolean(isOpen && isOwner && roomId),
  });

  const create = useMutation({
    mutationFn: () => studyRoomsApi.createInvite(roomId, {}),
  });

  const revoke = useMutation({
    mutationFn: (inviteId) => studyRoomsApi.revokeInvite(roomId, inviteId),
  });

  useEffect(() => {
    if (!isOpen) return;
    // Pre-create one invite when the modal opens so the user has something
    // to copy right away. Owners can re-roll for a fresh code.
    if (!create.data && !create.isPending && !invitesQuery.data?.length) {
      create.mutate();
    }
  }, [isOpen, create.data, create.isPending, invitesQuery.data?.length]);

  const invites = invitesQuery.data || [];
  const activeInvite = useMemo(
    () => invites.find((i) => !i.revoked_at && (!i.expires_at || new Date(i.expires_at) > new Date()) && (i.max_uses == null || i.use_count < i.max_uses)) || null,
    [invites],
  );

  const showToast = (variant, message) => setToast({ open: true, variant, message });

  const handleCreate = async () => {
    try {
      await create.mutateAsync();
      await queryClient.invalidateQueries({ queryKey: ['study-room-invites', roomId] });
      showToast('success', 'New invite link generated.');
    } catch (err) {
      showToast('error', err?.response?.data?.message || err?.message || 'Failed to create invite');
    }
  };

  const handleRevoke = async (invite) => {
    if (!window.confirm('Revoke this invite? Anyone with the link will no longer be able to join.')) return;
    try {
      await revoke.mutateAsync(invite.id);
      await queryClient.invalidateQueries({ queryKey: ['study-room-invites', roomId] });
      showToast('success', 'Invite revoked.');
    } catch (err) {
      showToast('error', err?.response?.data?.message || err?.message || 'Failed to revoke invite');
    }
  };

  const featuredCode = activeInvite?.code || create.data?.code;
  const featuredUrl = featuredCode ? buildJoinUrl(featuredCode) : null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Invite people"
        description={roomName ? `Share a link so others can join “${roomName}”.` : 'Share a link so others can join.'}
        size="md"
        footer={
          isOwner ? (
            <>
              <Button variant="ghost" onClick={onClose}>Done</Button>
              <Button onClick={handleCreate} disabled={create.isPending} leadingIcon={<RotateCw className="h-4 w-4" />}>
                {create.isPending ? 'Generating…' : 'New link'}
              </Button>
            </>
          ) : (
            <Button onClick={onClose}>Close</Button>
          )
        }
      >
        <div className="space-y-4">
          {!isOwner ? (
            <div className="flex items-start gap-2 rounded-lg border border-border bg-background-subtle px-3 py-2 text-2xs text-foreground-muted">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>Only the room owner can generate invite links. Ask the owner to share one with you.</span>
            </div>
          ) : null}

          {featuredUrl ? (
            <div className="space-y-2">
              <div className="text-2xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">Active invite link</div>
              <CopyableLink url={featuredUrl} onCopied={() => showToast('success', 'Link copied to clipboard.')} />
            </div>
          ) : isOwner ? (
            <div className="rounded-lg border border-border bg-background-subtle px-3 py-3 text-sm text-foreground-muted">
              {create.isPending ? 'Generating your first invite link…' : 'Click “New link” to generate an invite.'}
            </div>
          ) : null}

          {isOwner && invites.length > 0 ? (
            <div className="space-y-2">
              <div className="text-2xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">All invites</div>
              <ul className="space-y-1.5">
                {invites.map((invite) => (
                  <li
                    key={invite.id}
                    className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-2xs text-foreground">{buildJoinUrl(invite.code)}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-2xs text-foreground-muted">
                        <StatusPill invite={invite} />
                        <span>
                          Used {invite.use_count}
                          {invite.max_uses != null ? ` / ${invite.max_uses}` : ''}
                        </span>
                        {invite.expires_at ? (
                          <span>
                            · expires {new Date(invite.expires_at).toLocaleDateString()}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {!invite.revoked_at ? (
                      <Button variant="ghost" size="sm" onClick={() => handleRevoke(invite)} disabled={revoke.isPending}>
                        <X className="h-3 w-3" /> Revoke
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </Modal>

      <Toast
        open={toast.open}
        variant={toast.variant}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
        message={toast.message}
      />
    </>
  );
}
