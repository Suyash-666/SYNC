import { useQuery } from '@tanstack/react-query';
import { analyticsApi, assignmentsApi, notificationsApi } from '../api';
import { mapAssignment, mapNotification } from '../lib/mappers';

export function useDashboard() {
  const overviewQuery = useQuery({ queryKey: ['dashboard', 'overview'], queryFn: analyticsApi.getOverview });
  const assignmentsQuery = useQuery({
    queryKey: ['dashboard', 'assignments'],
    queryFn: () => assignmentsApi.getAll({ limit: 5 }),
  });
  const notificationsQuery = useQuery({
    queryKey: ['dashboard', 'notifications'],
    queryFn: () => notificationsApi.getAll({ limit: 5 }),
  });

  return {
    overview: overviewQuery.data,
    assignments: (Array.isArray(assignmentsQuery.data)
      ? assignmentsQuery.data
      : (assignmentsQuery.data?.data || [])
    ).map(mapAssignment),
    notifications: ((notificationsQuery.data?.data) || []).map(mapNotification),
    isLoading: overviewQuery.isLoading || assignmentsQuery.isLoading || notificationsQuery.isLoading,
    error: overviewQuery.error || assignmentsQuery.error || notificationsQuery.error,
    refetch: () => {
      overviewQuery.refetch();
      assignmentsQuery.refetch();
      notificationsQuery.refetch();
    },
  };
}
