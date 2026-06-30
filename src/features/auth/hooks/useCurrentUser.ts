import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '@/lib/api/endpoints/auth';

export const CURRENT_USER_KEY = ['users', 'me'] as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: CURRENT_USER_KEY,
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
