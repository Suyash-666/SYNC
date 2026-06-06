import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { studyRoomsApi } from '../api';
import { getStudyRoomsSocket, joinStudyRoom, leaveStudyRoom } from '../lib/socket';
import { mapStudyMessage, mapStudyRoom } from '../lib/mappers';

export function useStudyRoom(roomId) {
  const queryClient = useQueryClient();
  const currentUserId = useSelector((s) => s.auth?.user?.id);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  // `joinedRef` flips to true the first time the server tells us we've
  // joined the room. sendMessage waits for it so a fast click on Send
  // right after opening a room can't race the join_room round-trip.
  const joinedRef = useRef(false);

  const roomQuery = useQuery({
    queryKey: ['study-room', roomId],
    queryFn: () => studyRoomsApi.getById(roomId),
    enabled: Boolean(roomId),
  });

  useEffect(() => {
    if (!roomId) return undefined;
    joinedRef.current = false;
    const socket = getStudyRoomsSocket();

    const handleRoomJoined = (payload) => {
      joinedRef.current = true;
      if (payload?.room) {
        queryClient.setQueryData(['study-room', roomId], payload.room);
      }
      setMembers(payload?.members || []);
      setMessages((payload?.recent_messages || []).map(mapStudyMessage));
    };
    const handleNewMessage = (payload) => {
      if (!payload?.message) return;
      const mapped = mapStudyMessage(payload.message);
      setMessages((current) => {
        if (current.some((m) => m.id === mapped.id)) return current;
        return [...current, mapped];
      });
    };
    const handleUserJoined = (payload) => {
      const user = payload?.user;
      if (!user) return;
      setMembers((current) => {
        if (current.some((m) => m.user_id === user.id)) return current;
        return [...current, { user_id: user.id, joined_at: new Date().toISOString(), user }];
      });
    };
    const handleUserLeft = (payload) => {
      const userId = payload?.user_id;
      if (!userId) return;
      setMembers((current) => current.filter((m) => m.user_id !== userId));
    };
    const handleTypingStart = (payload) => {
      const user = payload?.user;
      if (!user) return;
      setTypingUsers((current) => (current.some((item) => item.id === user.id) ? current : [...current, user]));
    };
    const handleTypingStop = (payload) => {
      const userId = payload?.user_id;
      if (!userId) return;
      setTypingUsers((current) => current.filter((item) => item.id !== userId));
    };

    socket.on('room_joined', handleRoomJoined);
    socket.on('new_message', handleNewMessage);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);
    socket.on('typing_start', handleTypingStart);
    socket.on('typing_stop', handleTypingStop);
    joinStudyRoom(roomId);

    return () => {
      socket.off('room_joined', handleRoomJoined);
      socket.off('new_message', handleNewMessage);
      socket.off('user_joined', handleUserJoined);
      socket.off('user_left', handleUserLeft);
      socket.off('typing_start', handleTypingStart);
      socket.off('typing_stop', handleTypingStop);
      leaveStudyRoom(roomId);
    };
  }, [roomId, queryClient]);

  const joinMutation = useMutation({ mutationFn: () => studyRoomsApi.join(roomId) });
  const leaveMutation = useMutation({ mutationFn: () => studyRoomsApi.leave(roomId) });
  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      const socket = getStudyRoomsSocket();
      const send = () => socket.emit('send_message', { room_id: roomId, content });

      // Wait for `room_joined` to land before sending, so we don't race
      // the join and have the server reject us with "Not a member".
      // We give the join a generous window: re-issue join_room, wait up
      // to 2 seconds for room_joined, then send.
      if (!joinedRef.current) {
        joinStudyRoom(roomId);
        await new Promise((resolve) => {
          const start = Date.now();
          const tick = () => {
            if (joinedRef.current) return resolve();
            if (Date.now() - start > 2000) return resolve();
            setTimeout(tick, 50);
          };
          tick();
        });
      }
      if (!socket.connected) socket.connect();
      send();
      return { ok: true };
    },
  });

  const typingStart = () => {
    const socket = getStudyRoomsSocket();
    socket.emit('typing_start', { room_id: roomId });
  };

  const typingStop = () => {
    const socket = getStudyRoomsSocket();
    socket.emit('typing_stop', { room_id: roomId });
  };

  return {
    room: roomQuery.data ? mapStudyRoom(roomQuery.data) : null,
    currentUserId,
    members,
    messages,
    typingUsers,
    isLoading: roomQuery.isLoading,
    error: roomQuery.error,
    joinRoom: joinMutation.mutateAsync,
    leaveRoom: leaveMutation.mutateAsync,
    sendMessage: sendMessageMutation.mutateAsync,
    typingStart,
    typingStop,
  };
}
