import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login } from '@/lib/api/endpoints/auth';
import { useAuth } from './useAuth';
import { CURRENT_USER_KEY } from './useCurrentUser';
import { LEARNING_FACADE_KEY } from './useLearningFacade';
import type { LoginRequest } from '@/lib/api/schemas/auth';

export function useLogin() {
  const qc = useQueryClient();
  const auth = useAuth();
  return useMutation({
    mutationFn: (payload: LoginRequest) => login(payload),
    onSuccess: (data) => {
      auth.setRefreshToken(data.refreshToken);
      qc.invalidateQueries({ queryKey: CURRENT_USER_KEY });
      qc.invalidateQueries({ queryKey: LEARNING_FACADE_KEY });
    },
  });
}
