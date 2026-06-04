import { useMutation } from '@tanstack/react-query';
import { onboardingApi } from '../api';

export function useOnboarding() {
  const submitMutation = useMutation({ mutationFn: onboardingApi.submit });

  return {
    submitOnboarding: submitMutation.mutateAsync,
    isSubmitting: submitMutation.isPending,
    error: submitMutation.error,
  };
}
