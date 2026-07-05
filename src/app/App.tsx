import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { router } from './router';
import { queryClient } from '@/lib/query/queryClient';
import { ToastProvider } from '@/components/ToastProvider';
import { AuthProvider } from '@/features/auth/AuthContext';
import { setSessionLostHandler } from '@/lib/api/client';
import { CURRENT_USER_KEY } from '@/features/auth/hooks/useCurrentUser';
import { LEARNING_FACADE_KEY } from '@/features/auth/hooks/useLearningFacade';

function SessionWatcher() {
  const qc = useQueryClient();
  useEffect(() => {
    setSessionLostHandler(() => {
      qc.removeQueries({ queryKey: CURRENT_USER_KEY });
      qc.removeQueries({ queryKey: LEARNING_FACADE_KEY });
    });
    return () => setSessionLostHandler(() => {});
  }, [qc]);
  return null;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SessionWatcher />
        <RouterProvider router={router} />
        <ToastProvider />
      </AuthProvider>
    </QueryClientProvider>
  );
}
