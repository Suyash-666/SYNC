import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Plus, UserPlus, Trash2 } from 'lucide-react';
import { studyRoomsApi } from '../src/api';
import { useStudyRoom } from '../src/hooks/useStudyRoom';
import { useSelector } from 'react-redux';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Skeleton,
  Toast,
} from '../components';
import InviteModal from './InviteModal';
import MessageBubble from './MessageBubble';

const SUGGESTED_TAGS = ['DSA', 'OS', 'DBMS', 'CN', 'Maths', 'ML', 'General'];

function CreateRoomModal({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [subjectTag, setSubjectTag] = useState('');

  // Reset on open
  useEffect(() => {
    if (isOpen) { setName(''); setSubjectTag(''); }
  }, [isOpen]);

  const create = useMutation({
    mutationFn: (payload) => studyRoomsApi.create(payload),
  });

  const submit = async (event) => {
    event?.preventDefault?.();
    if (!name.trim() || create.isPending) return;
    try {
      const room = await create.mutateAsync({
        name: name.trim(),
        subject_tag: subjectTag.trim() || 'General',
      });
      // response shape: { id, name, subject_tag, ... }
      onCreated?.(room);
    } catch {
      // surfaced inline by the mutation state
    }
  };

  const nameError = create.isError
    ? (create.error?.response?.data?.message || create.error?.message || 'Failed to create room')
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create study room"
      description="Spin up a real-time room for your study group."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={create.isPending}>Cancel</Button>
          <Button onClick={submit} disabled={!name.trim() || create.isPending}>
            {create.isPending ? 'Creating…' : 'Create room'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Room name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. DSA group"
          autoFocus
          required
          maxLength={80}
          error={nameError || undefined}
        />
        <Input
          label="Subject (optional)"
          value={subjectTag}
          onChange={(event) => setSubjectTag(event.target.value)}
          placeholder="e.g. DSA, DBMS, OS…"
          maxLength={40}
          helperText="Used to group rooms in the sidebar."
        />
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSubjectTag(tag)}
              className="rounded-full border border-border bg-background-muted px-2.5 py-1 text-2xs font-semibold text-foreground-muted transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              {tag}
            </button>
          ))}
        </div>
      </form>
    </Modal>
  );
}

export default function StudyRoomsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUserId = useSelector((s) => s.auth?.user?.id);
  const roomsQuery = useQuery({ queryKey: ['study-rooms'], queryFn: studyRoomsApi.getAll });
  const rooms = roomsQuery.data || [];
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [message, setMessage] = useState('');
  const [roomToast, setRoomToast] = useState({ open: false, variant: 'info', message: '' });
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  // If we just landed here from a /join/:code redirect, jump to that room.
  useEffect(() => {
    const fromJoin = searchParams.get('room');
    if (fromJoin) {
      setActiveRoomId(fromJoin);
      // strip the param so a refresh doesn't re-trigger
      const next = new URLSearchParams(searchParams);
      next.delete('room');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const activeRoom = useMemo(
    () => rooms.find((room) => room.id === activeRoomId) || rooms[0] || null,
    [rooms, activeRoomId],
  );
  const roomHook = useStudyRoom(activeRoom?.id || null);
  const isOwner = Boolean(activeRoom && currentUserId && activeRoom.created_by_id === currentUserId);

  useEffect(() => {
    if (!activeRoomId && rooms.length > 0) setActiveRoomId(rooms[0].id);
  }, [rooms, activeRoomId]);

  const deleteMutation = useMutation({
    mutationFn: (roomId) => studyRoomsApi.remove(roomId),
  });

  const showToast = (variant, text) => setRoomToast({ open: true, variant, message: text });

  if (roomsQuery.isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton variant="block" className="h-20" />
        <div className="grid gap-4 lg:grid-cols-[280px_1fr_280px]">
          <Skeleton variant="block" className="h-[32rem]" />
          <Skeleton variant="block" className="h-[32rem]" />
          <Skeleton variant="block" className="h-[32rem]" />
        </div>
      </div>
    );
  }

  if (roomsQuery.error) {
    return (
      <div className="p-6">
        <EmptyState
          icon="⚠️"
          title="Study rooms failed to load"
          description={roomsQuery.error.message || 'Unable to fetch rooms.'}
          actionLabel="Retry"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  const sendMessage = async () => {
    if (!message.trim() || !activeRoom) return;
    try {
      await roomHook.sendMessage(message.trim());
      setMessage('');
      showToast('success', 'Message sent.');
    } catch (error) {
      showToast('error', error.message || 'Unable to send message.');
    }
  };

  const handleDeleteRoom = async () => {
    if (!activeRoom) return;
    const confirmed = window.confirm(
      `Delete “${activeRoom.name}”? This removes the room for everyone. This cannot be undone.`,
    );
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(activeRoom.id);
      showToast('success', 'Room deleted.');
      setActiveRoomId(null);
      await queryClient.invalidateQueries({ queryKey: ['study-rooms'] });
    } catch (error) {
      showToast('error', error?.response?.data?.message || error?.message || 'Failed to delete room.');
    }
  };

  const handleCreated = async (room) => {
    setCreateOpen(false);
    showToast('success', `Room “${room?.name || 'New room'}” created.`);
    // Refresh the room list and select the new room.
    await queryClient.invalidateQueries({ queryKey: ['study-rooms'] });
    if (room?.id) setActiveRoomId(room.id);
  };

  return (
    <div className="space-y-5">
      <Toast
        open={roomToast.open}
        variant={roomToast.variant}
        onClose={() => setRoomToast((current) => ({ ...current, open: false }))}
        message={roomToast.message}
      />

      <PageHeader
        eyebrow="Realtime"
        title="Study Rooms"
        description="Collaborative rooms powered by Socket.IO."
        actions={
          <Button
            variant="secondary"
            leadingIcon={<Plus className="h-4 w-4" />}
            onClick={() => setCreateOpen(true)}
          >
            Create room
          </Button>
        }
      />

      <CreateRoomModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />

      <InviteModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        roomId={activeRoom?.id}
        roomName={activeRoom?.name}
        isOwner={isOwner}
      />

      <div className="grid gap-4 lg:grid-cols-[280px_1fr_280px]">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-semibold">Rooms</div>
            <Badge>{rooms.length}</Badge>
          </div>
          <div className="space-y-2">
            {rooms.length === 0 ? (
              <EmptyState
                icon="🏠"
                title="No rooms yet"
                description="Create the first study room to get started."
                actionLabel="Create room"
                onAction={() => setCreateOpen(true)}
              />
            ) : (
              rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={async () => {
                    try {
                      await roomHook.joinRoom();
                      setActiveRoomId(room.id);
                    } catch {
                      setActiveRoomId(room.id);
                    }
                  }}
                  className={`block w-full rounded-2xl border px-3 py-3 text-left ${activeRoomId === room.id ? 'border-[var(--color-accent)] bg-[rgba(99,102,241,0.12)]' : 'border-[var(--color-border)] bg-[rgba(255,255,255,0.03)]'}`}
                >
                  <div className="font-medium text-text-primary">{room.name}</div>
                  <div className="mt-1 text-sm text-text-secondary">{room.subject_tag || room.subject || 'General'}</div>
                </button>
              ))
            )}
          </div>
        </Card>

        <Card className="flex min-h-[32rem] flex-col p-4">
          {activeRoom ? (
            <>
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-4">
                <div>
                  <div className="text-lg font-semibold text-text-primary">{roomHook.room?.name || activeRoom.name}</div>
                  <div className="text-sm text-text-secondary">{roomHook.room?.subject || activeRoom.subject_tag || 'General'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{roomHook.members.length} members</Badge>
                  <Button
                    variant="secondary"
                    size="sm"
                    leadingIcon={<UserPlus className="h-4 w-4" />}
                    onClick={() => setInviteOpen(true)}
                  >
                    Invite
                  </Button>
                  {isOwner ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      leadingIcon={<Trash2 className="h-4 w-4" />}
                      onClick={handleDeleteRoom}
                      disabled={deleteMutation.isPending}
                      className="text-danger hover:bg-danger-soft"
                    >
                      {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-auto py-2">
                {roomHook.messages.length === 0 ? (
                  <EmptyState icon="💬" title="No messages yet" description="Start the conversation in this room." />
                ) : (
                  roomHook.messages.map((item) => <MessageBubble key={item.id} item={item} currentUserId={roomHook.currentUserId} />)
                )}
                {roomHook.typingUsers.length > 0 ? (
                  <div className="text-sm text-text-secondary">
                    {roomHook.typingUsers.map((item) => item.name).join(', ')} typing…
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex items-end gap-2 border-t border-[var(--color-border)] pt-4">
                <textarea
                  value={message}
                  onChange={(event) => {
                    setMessage(event.target.value);
                    if (event.target.value.trim()) roomHook.typingStart();
                    else roomHook.typingStop();
                  }}
                  onBlur={() => roomHook.typingStop()}
                  placeholder="Message the room"
                  className="min-h-[56px] flex-1 rounded-2xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.03)] px-3 py-3 text-sm text-text-primary outline-none"
                />
                <Button onClick={sendMessage}>Send</Button>
              </div>
            </>
          ) : (
            <EmptyState
              icon="🏠"
              title="No rooms yet"
              description="Create a study room to start chatting in real time."
              actionLabel="Create room"
              onAction={() => setCreateOpen(true)}
            />
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-semibold">Members</div>
            <Badge>{roomHook.members.length}</Badge>
          </div>
          <div className="space-y-2">
            {roomHook.members.length === 0 ? (
              <EmptyState icon="👥" title="No members yet" description="Join the room to see members here." />
            ) : (
              roomHook.members.map((member) => (
                <div
                  key={member.user?.id || member.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.03)] p-3"
                >
                  <div className="font-medium text-text-primary">{member.user?.full_name || member.user?.name || 'Member'}</div>
                  <div className="text-sm text-text-secondary">{member.user?.email || ''}</div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
