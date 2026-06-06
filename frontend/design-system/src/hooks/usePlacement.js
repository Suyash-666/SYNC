import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { placementApi } from '../api';
import { mapPlacementItem } from '../lib/mappers';

export function usePlacement(filters = {}) {
  const queryClient = useQueryClient();
  const progressQuery = useQuery({ queryKey: ['placement', 'progress', filters], queryFn: () => placementApi.getProgress(filters) });
  const statsQuery = useQuery({ queryKey: ['placement', 'stats'], queryFn: placementApi.getStats });

  const addMutation = useMutation({
    mutationFn: (payload) => placementApi.addItem(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['placement'] }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => placementApi.updateItem(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['placement'] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => placementApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['placement'] }),
  });

  const dsaQuery = useQuery({ queryKey: ['placement', 'dsa', filters], queryFn: () => placementApi.getDsaProblems(filters) });

  const asArray = (d) => (Array.isArray(d) ? d : (d?.data || []));
  return {
    progress: asArray(progressQuery.data).map(mapPlacementItem),
    stats: statsQuery.data,
    dsaProblems: asArray(dsaQuery.data).map(mapPlacementItem),
    isLoading: progressQuery.isLoading || statsQuery.isLoading || dsaQuery.isLoading,
    error: progressQuery.error || statsQuery.error || dsaQuery.error,
    addItem: addMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    addDsaProblem: (payload) => placementApi.addDsaProblem(payload),
  };
}
