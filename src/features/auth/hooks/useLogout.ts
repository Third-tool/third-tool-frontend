import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { CURRENT_USER_KEY } from './useCurrentUser';
import { LEARNING_FACADE_KEY } from './useLearningFacade';

export function useLogout() {
  const auth = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  return () => {
    auth.clear();
    qc.removeQueries({ queryKey: CURRENT_USER_KEY });
    qc.removeQueries({ queryKey: LEARNING_FACADE_KEY });
    qc.removeQueries({ queryKey: ['review-session', 'today'] });
    qc.removeQueries({ queryKey: ['cards', 'archive'] });
    navigate('/', { replace: true });
  };
}
