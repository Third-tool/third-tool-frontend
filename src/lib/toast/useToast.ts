import { useCallback } from 'react';
import { toastStore, type ToastInput } from './toastQueue';

export function useToast() {
  const push = useCallback((input: ToastInput) => toastStore.push(input), []);
  const dismiss = useCallback((id: string) => toastStore.dismiss(id), []);
  return { push, dismiss };
}
