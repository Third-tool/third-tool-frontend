import { toastStore, type Toast as ToastModel } from '@/lib/toast/toastQueue';

const toneClass: Record<ToastModel['tone'], string> = {
  default: 'bg-surface text-cream border-edge',
  amber: 'bg-amber-soft text-amber-deep border-amber-line',
  cream: 'bg-paper-2 text-cream border-edge',
};

export function Toast({ toast }: { toast: ToastModel }) {
  return (
    <div
      role="status"
      className={`pointer-events-auto inline-flex items-center gap-3 rounded-full border px-5 py-3 text-sm shadow-[0_18px_40px_-22px_rgba(33,31,26,0.35)] ${toneClass[toast.tone]}`}
    >
      <span>{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action?.onClick();
            toastStore.dismiss(toast.id);
          }}
          className="rounded-full border border-amber-line bg-amber-soft px-2.5 py-0.5 text-xs font-semibold text-amber-deep transition-colors hover:bg-amber hover:text-white"
        >
          {toast.action.label}
        </button>
      )}
    </div>
  );
}
