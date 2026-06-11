import type { Toast as ToastModel } from '@/lib/toast/toastQueue';

const toneClass: Record<ToastModel['tone'], string> = {
  default: 'bg-surface text-cream ring-edge',
  amber: 'bg-amber-soft text-amber ring-amber/30',
  cream: 'bg-glass text-cream ring-edge',
};

export function Toast({ toast }: { toast: ToastModel }) {
  return (
    <div
      role="status"
      className={`pointer-events-auto max-w-sm rounded-full px-5 py-3 text-sm ring-1 backdrop-blur-xl shadow-[var(--shadow-lift)] ${toneClass[toast.tone]}`}
    >
      {toast.message}
    </div>
  );
}
