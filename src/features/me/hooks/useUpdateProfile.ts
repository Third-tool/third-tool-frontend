import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCurrentUser } from '@/lib/api/endpoints/auth';
import { CURRENT_USER_KEY } from '@/features/auth/hooks/useCurrentUser';
import type { UserUpdateRequest } from '@/lib/api/schemas/auth';

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserUpdateRequest) => updateCurrentUser(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CURRENT_USER_KEY });
    },
  });
}
