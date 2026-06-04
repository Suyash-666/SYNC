import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { notificationsApi } from '../api';
import { getNotificationsSocket, connectSockets } from '../lib/socket';
import { mapNotification } from '../lib/mappers';
import { markAllNotificationsRead, markNotificationRead, prependNotification, setNotifications } from '../store/notificationsSlice';

export function useNotifications(params = { page: 1, limit: 20 }) {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const notificationsState = useSelector((state) => state.notifications);

  const notificationsQuery = useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationsApi.getAll(params),
  });

  useEffect(() => {
    if (notificationsQuery.data) {
      dispatch(setNotifications(notificationsQuery.data));
    }
  }, [dispatch, notificationsQuery.data]);

  useEffect(() => {
    connectSockets();
    const socket = getNotificationsSocket();

    const onNewNotification = (payload) => {
      if (!payload) return;
      dispatch(prependNotification(payload));
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    const onRead = (payload) => {
      if (payload?.notification_id) dispatch(markNotificationRead(payload.notification_id));
    };

    socket.on('new_notification', onNewNotification);
    socket.on('notification_read', onRead);

    return () => {
      socket.off('new_notification', onNewNotification);
      socket.off('notification_read', onRead);
    };
  }, [dispatch, queryClient]);

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onSuccess: (_data, id) => dispatch(markNotificationRead(id)),
  });

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => dispatch(markAllNotificationsRead()),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => notificationsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return {
    notifications: (notificationsQuery.data || []).map(mapNotification),
    unreadCount: notificationsState.unreadCount,
    isLoading: notificationsQuery.isLoading,
    error: notificationsQuery.error,
    markRead: markReadMutation.mutateAsync,
    markAllRead: markAllMutation.mutateAsync,
    removeNotification: deleteMutation.mutateAsync,
  };
}
