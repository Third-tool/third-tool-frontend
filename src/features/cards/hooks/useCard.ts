import { useQuery } from '@tanstack/react-query';
import { getCard } from '@/lib/api/endpoints/card';

export const cardKey = (cardId: string) => ['cards', 'detail', cardId] as const;

export function useCard(cardId: string | undefined) {
  return useQuery({
    queryKey: cardId ? cardKey(cardId) : ['cards', 'detail', 'idle'],
    queryFn: () => getCard(cardId!),
    enabled: Boolean(cardId),
    retry: false,
  });
}
