// ============================================================================
// src/hooks/useNotifications.supabase.js
// Supabase-backed implementation of the useNotifications hook.
//
//   - Initial list: notificationsApi.getAll(params)
//   - Realtime: subscribe to Notification INSERT/UPDATE/DELETE and dispatch
//     the same Redux actions the legacy hook uses (so the slice and any
//     consumers see no change).
//   - Mutations: markRead/markAllRead/remove go through the Supabase
//     notificationsApi.
//
// Activated when VITE_USE_SUPABASE=notifications (or 'all').
// ============================================================================

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';

import { notificationsApi } from '../api';
import { mapNotification } from '../lib/mappers';
import { subscribeNotifications } from '../lib/supabaseRealtime';
import {
  markAllNotificationsRead,
  markNotificationRead,
  prependNotification,
  setNotifications,
} from '../store/notificationsSlice';

export function useNotifications(params = { page: 1, limit: 20 }) {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const notificationsState = useSelector((state) => state.notifications);

  const notificationsQuery = useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationsApi.getAll(params),
  });

  useEffect(() => {
    if (!notificationsQuery.data) return;
    // Supabase notificationsApi.getAll returns { data, pagination }.
    // The slice expects an array of notification rows.
    const raw = notificationsQuery.data;
    const rows = Array.isArray(raw)
      ? raw
      : (raw && Array.isArray(raw.data) ? raw.data : []);
    dispatch(setNotifications(rows));
  }, [dispatch, notificationsQuery.data]);

  // Subscribe to Realtime. The singleton in supabaseRealtime.js guarantees
  // only one channel regardless of how many components mount this hook.
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      unsubscribe = subscribeNotifications({
        onInsert: (payload) => {
          try {
            const row = payload?.new;
            if (!row) return;
            dispatch(prependNotification(row));
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('[useNotifications] onInsert failed:', e);
          }
        },
        onUpdate: (payload) => {
          try {
            const row = payload?.new;
            if (!row || !row.id) return;
            if (row.is_read) dispatch(markNotificationRead(row.id));
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('[useNotifications] onUpdate failed:', e);
          }
        },
        onDelete: (payload) => {
          // Supabase Realtime DELETE payloads only contain `old`. The consumer
          // can refresh from cache; we just invalidate the query.
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[useNotifications] subscribe failed:', e);
    }

    return unsubscribe;
  }, [dispatch, queryClient]);

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onSuccess: (_data, id) => dispatch(markNotificationRead(id)),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => dispatch(markAllNotificationsRead()),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => notificationsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return {
    notifications: (notificationsQuery.data?.data || [])
      .map(mapNotification)
      .filter(Boolean),
    unreadCount: notificationsState.unreadCount,
    isLoading: notificationsQuery.isLoading,
    error: notificationsQuery.error,
    markRead: markReadMutation.mutateAsync,
    markAllRead: markAllMutation.mutateAsync,
    removeNotification: deleteMutation.mutateAsync,
  };
}

export default useNotifications;
