import { useQuery } from '@tanstack/react-query';
import { getLearningFacade } from '@/lib/api/endpoints/facade';
import { ApiError } from '@/lib/api/client';

export const LEARNING_FACADE_KEY = ['learning-facade'] as const;

export function useLearningFacade(enabled = true) {
  return useQuery({
    queryKey: LEARNING_FACADE_KEY,
    queryFn: async () => {
      try {
        return await getLearningFacade();
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return {
            facadeId: 'unset',
            concept: null,
            axes: [],
            coverageSummary: { totalTopics: 0, uncoveredTopics: 0, axesWithUncovered: [] },
          };
        }
        throw err;
      }
    },
    enabled,
    retry: false,
    staleTime: 60 * 1000,
  });
}
