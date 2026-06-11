import { useQuery } from '@tanstack/react-query';
import { listArchiveCards } from '@/lib/api/endpoints/card';

export const ARCHIVE_KEY = (tagId: string | null) => ['cards', 'archive', { tagId }] as const;

export function useArchive(tagId: string | null = null) {
  return useQuery({
    queryKey: ARCHIVE_KEY(tagId),
    queryFn: () => listArchiveCards(tagId ? { tagId } : {}),
  });
}
