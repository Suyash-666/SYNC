import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { studyRoomsApi } from '../src/api';
import { useStudyRoom } from '../src/hooks/useStudyRoom';
import { Badge, Button, Card, EmptyState, PageHeader, Skeleton, Toast } from '../components';

export default function StudyRoomsPage() {
  const roomsQuery = useQuery({ queryKey: ['study-rooms'], queryFn: studyRoomsApi.getAll });
  const rooms = roomsQuery.data || [];
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [message, setMessage] = useState('');
  const [roomToast, setRoomToast] = useState({ open: false, variant: 'info', message: '' });

  const activeRoom = useMemo(() => rooms.find((room) => room.id === activeRoomId) || rooms[0] || null, [rooms, activeRoomId]);
  const roomHook = useStudyRoom(activeRoom?.id || null);

  useEffect(() => {
    if (!activeRoomId && rooms.length > 0) setActiveRoomId(rooms[0].id);
  }, [rooms, activeRoomId]);

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
        <EmptyState icon="⚠️" title="Study rooms failed to load" subtitle={roomsQuery.error.message || 'Unable to fetch rooms.'} actionText="Retry" onAction={() => window.location.reload()} />
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

  return (
    <div className="space-y-5">
      <Toast open={roomToast.open} variant={roomToast.variant} onClose={() => setRoomToast((current) => ({ ...current, open: false }))} message={roomToast.message} />

      <PageHeader
        eyebrow="Realtime"
        title="Study Rooms"
        description="Collaborative rooms powered by Socket.IO."
        actions={
          <Button
            variant="secondary"
            leadingIcon={<Plus className="h-4 w-4" />}
            onClick={() => showToast('info', 'Create room flow can be added here.')}
          >
            Create room
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[280px_1fr_280px]">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-semibold">Rooms</div>
            <Badge>{rooms.length}</Badge>
          </div>
          <div className="space-y-2">
            {rooms.length === 0 ? (
              <EmptyState icon="🏠" title="No rooms yet" subtitle="Create the first study room." />
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
                <Badge>{roomHook.members.length} members</Badge>
              </div>

              <div className="flex-1 space-y-3 overflow-auto py-2">
                {roomHook.messages.length === 0 ? (
                  <EmptyState icon="💬" title="No messages yet" subtitle="Start the conversation in this room." />
                ) : (
                  roomHook.messages.map((item) => (
                    <MessageBubble key={item.id} item={item} />
                  ))
                )}
                {roomHook.typingUsers.length > 0 ? <div className="text-sm text-text-secondary">{roomHook.typingUsers.map((item) => item.name).join(', ')} typing…</div> : null}
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
            <EmptyState icon="🏠" title="Select a room" subtitle="Choose a room to start chatting." />
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-semibold">Members</div>
            <Badge>{roomHook.members.length}</Badge>
          </div>
          <div className="space-y-2">
            {roomHook.members.length === 0 ? (
              <EmptyState icon="👥" title="No members yet" subtitle="Join the room to see members here." />
            ) : (
              roomHook.members.map((member) => (
                <div key={member.user?.id || member.id} className="rounded-2xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.03)] p-3">
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

