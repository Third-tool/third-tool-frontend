import { useQuery } from '@tanstack/react-query';
import { listDecks } from '@/lib/api/endpoints/deck';

export const DECKS_KEY = ['decks'] as const;

export function useDecks() {
  return useQuery({
    queryKey: DECKS_KEY,
    queryFn: () => listDecks({ page: 0, size: 50 }),
    staleTime: 60 * 1000,
  });
}
