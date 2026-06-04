import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../api';

export function useAIChat(initialConversationId = null) {
  const queryClient = useQueryClient();
  const [conversationId, setConversationId] = useState(initialConversationId);

  const historyQuery = useQuery({
    queryKey: ['ai', 'conversation', conversationId],
    queryFn: () => aiApi.getConversation(conversationId),
    enabled: Boolean(conversationId),
  });

  const history = useMemo(() => historyQuery.data || [], [historyQuery.data]);

  const chatMutation = useMutation({
    mutationFn: ({ message }) => aiApi.chat({ message, conversation_id: conversationId || undefined }),
    onSuccess: (data) => {
      if (data?.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
      }
      queryClient.invalidateQueries({ queryKey: ['ai', 'conversation'] });
      queryClient.invalidateQueries({ queryKey: ['ai', 'history'] });
    },
  });

  const planMutation = useMutation({
    mutationFn: (payload) => aiApi.generateStudyPlan(payload),
  });

  return {
    conversationId,
    setConversationId,
    messages: history,
    sendMessage: chatMutation.mutateAsync,
    generateStudyPlan: planMutation.mutateAsync,
    isSending: chatMutation.isPending,
    isLoading: historyQuery.isLoading,
    error: historyQuery.error,
  };
}
