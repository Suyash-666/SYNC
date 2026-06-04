import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notesApi } from '../api';
import { mapNote } from '../lib/mappers';

export function useNotes(folder = '', search = '') {
  const queryClient = useQueryClient();
  const params = useMemo(() => ({ folder: folder || undefined, search: search || undefined }), [folder, search]);

  const notesQuery = useQuery({
    queryKey: ['notes', params],
    queryFn: () => notesApi.getAll(params),
  });

  const foldersQuery = useQuery({
    queryKey: ['notes', 'folders'],
    queryFn: notesApi.getFolders,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => notesApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => notesApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => notesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  });

  return {
    notes: (notesQuery.data || []).map(mapNote),
    folders: foldersQuery.data || [],
    isLoading: notesQuery.isLoading || foldersQuery.isLoading,
    error: notesQuery.error || foldersQuery.error,
    createNote: createMutation.mutateAsync,
    updateNote: updateMutation.mutateAsync,
    deleteNote: deleteMutation.mutateAsync,
  };
}
