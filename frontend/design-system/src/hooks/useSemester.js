import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { semestersApi, subjectsApi } from '../api';
import { mapSemester } from '../lib/mappers';

export function useSemester(semesterId) {
  const queryClient = useQueryClient();
  const semesterQuery = useQuery({
    queryKey: ['semester', semesterId],
    queryFn: () => semestersApi.getById(semesterId),
    enabled: Boolean(semesterId),
  });
  const subjectsQuery = useQuery({
    queryKey: ['semester', semesterId, 'subjects'],
    queryFn: () => subjectsApi.getBySemester(semesterId),
    enabled: Boolean(semesterId),
  });

  const setCurrentMutation = useMutation({
    mutationFn: (id) => semestersApi.setCurrent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['semester'] }),
  });

  return {
    semester: semesterQuery.data ? mapSemester(semesterQuery.data) : null,
    subjects: subjectsQuery.data || [],
    isLoading: semesterQuery.isLoading || subjectsQuery.isLoading,
    error: semesterQuery.error || subjectsQuery.error,
    setCurrent: setCurrentMutation.mutate,
    isSettingCurrent: setCurrentMutation.isPending,
  };
}
