import { useQuery } from '@tanstack/react-query';
import { listTags, listCardsByTag } from '@/lib/api/endpoints/tag';

export const TAGS_LIST_KEY = ['tags', 'list'] as const;
export const TAG_CARDS_KEY = (tagId: string) => ['tags', tagId, 'cards'] as const;

export function useTags() {
  return useQuery({ queryKey: TAGS_LIST_KEY, queryFn: listTags, staleTime: 60_000 });
}

export function useTagCards(tagId: string | undefined) {
  return useQuery({
    queryKey: tagId ? TAG_CARDS_KEY(tagId) : ['tags', '__none__'],
    queryFn: () => listCardsByTag(tagId!),
    enabled: !!tagId,
    staleTime: 60_000,
  });
}
