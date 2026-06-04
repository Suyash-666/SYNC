import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studyRoomsApi } from '../api';
import { getStudyRoomsSocket, joinStudyRoom, leaveStudyRoom } from '../lib/socket';
import { mapStudyMessage, mapStudyRoom } from '../lib/mappers';

export function useStudyRoom(roomId) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  const roomQuery = useQuery({
    queryKey: ['study-room', roomId],
    queryFn: () => studyRoomsApi.getById(roomId),
    enabled: Boolean(roomId),
  });

  useEffect(() => {
    if (!roomId) return undefined;
    const socket = getStudyRoomsSocket();

    const handleRoomJoined = (payload) => {
      if (payload?.room) {
        queryClient.setQueryData(['study-room', roomId], payload.room);
        setMembers(payload.members || []);
        setMessages((payload.recent_messages || []).map(mapStudyMessage));
      }
    };
    const handleNewMessage = (payload) => {
      if (payload?.message) setMessages((current) => [...current, mapStudyMessage(payload.message)]);
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
    socket.on('typing_start', handleTypingStart);
    socket.on('typing_stop', handleTypingStop);
    joinStudyRoom(roomId);

    return () => {
      socket.off('room_joined', handleRoomJoined);
      socket.off('new_message', handleNewMessage);
      socket.off('typing_start', handleTypingStart);
      socket.off('typing_stop', handleTypingStop);
      leaveStudyRoom(roomId);
    };
  }, [roomId, queryClient]);

  const joinMutation = useMutation({ mutationFn: () => studyRoomsApi.join(roomId) });
  const leaveMutation = useMutation({ mutationFn: () => studyRoomsApi.leave(roomId) });
  const sendMessageMutation = useMutation({
    mutationFn: (content) => {
      const socket = getStudyRoomsSocket();
      return new Promise((resolve, reject) => {
        if (!socket.connected) socket.connect();
        socket.emit('send_message', { room_id: roomId, content });
        resolve({ ok: true });
      });
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
