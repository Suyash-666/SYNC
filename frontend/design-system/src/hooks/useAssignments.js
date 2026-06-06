import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assignmentsApi } from '../api';
import { mapAssignment } from '../lib/mappers';

export function useAssignments(filters = {}) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ['assignments', filters], [filters]);

  const assignmentsQuery = useQuery({
    queryKey,
    queryFn: () => assignmentsApi.getAll(filters),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => assignmentsApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assignments'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => assignmentsApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assignments'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => assignmentsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assignments'] }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => assignmentsApi.updateStatus(id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (current = []) =>
        current.map((item) => (item.id === id ? { ...item, status: status.toLowerCase() } : item))
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    assignments: (Array.isArray(assignmentsQuery.data)
      ? assignmentsQuery.data
      : (assignmentsQuery.data?.data || [])
    ).map(mapAssignment),
    pagination: assignmentsQuery.data?.pagination || null,
    isLoading: assignmentsQuery.isLoading,
    error: assignmentsQuery.error,
    createAssignment: createMutation.mutateAsync,
    updateAssignment: updateMutation.mutateAsync,
    deleteAssignment: deleteMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
  };
}
