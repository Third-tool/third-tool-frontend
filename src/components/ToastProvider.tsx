import { useEffect, useState } from 'react';
import { toastStore, type Toast as ToastModel } from '@/lib/toast/toastQueue';
import { Toast } from './Toast';

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastModel[]>(toastStore.snapshot());

  useEffect(() => toastStore.subscribe(setToasts), []);

  useEffect(() => {
    const timers = toasts.map((t) =>
      window.setTimeout(() => toastStore.dismiss(t.id), t.durationMs),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [toasts]);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} />
      ))}
    </div>
  );
}
