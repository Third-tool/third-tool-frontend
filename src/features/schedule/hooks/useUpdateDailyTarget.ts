import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDailyTarget } from '@/lib/api/endpoints/schedule';
import { MY_SCHEDULE_KEY } from './useMySchedule';
import { track } from '@/lib/analytics/track';

export function useUpdateDailyTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dailyTarget: number) => updateDailyTarget(dailyTarget),
    onSuccess: (res) => {
      track('schedule_daily_target_updated', { dailyTarget: res.schedule.dailyTarget });
      qc.setQueryData(MY_SCHEDULE_KEY, res);
      void qc.invalidateQueries({ queryKey: ['review-session', 'today'] });
    },
  });
}
