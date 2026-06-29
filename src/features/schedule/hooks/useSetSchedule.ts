import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setSchedule } from '@/lib/api/endpoints/schedule';
import { MY_SCHEDULE_KEY } from './useMySchedule';
import { track } from '@/lib/analytics/track';

export function useSetSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inputDays: number) => setSchedule(inputDays),
    onSuccess: (res) => {
      track('schedule_set', {
        inputDays: res.schedule.rawInputDays,
        mode: res.schedule.mappedMode,
      });
      qc.setQueryData(MY_SCHEDULE_KEY, res);
      // mode change affects review session pool sizing
      void qc.invalidateQueries({ queryKey: ['review-session', 'today'] });
    },
  });
}
