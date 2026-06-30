import { useQuery } from '@tanstack/react-query';
import { getMySchedule } from '@/lib/api/endpoints/schedule';

export const MY_SCHEDULE_KEY = ['users', 'me', 'schedule'] as const;

export function useMySchedule() {
  return useQuery({
    queryKey: MY_SCHEDULE_KEY,
    queryFn: getMySchedule,
    staleTime: 60 * 1000,
    retry: false,
  });
}
