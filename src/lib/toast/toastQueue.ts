export type ToastTone = 'default' | 'amber' | 'cream';

export interface ToastInput {
  message: string;
  tone?: ToastTone;
  durationMs?: number;
}

export interface Toast extends Required<ToastInput> {
  id: string;
}

type Listener = (toasts: Toast[]) => void;

export interface ToastStore {
  push(input: ToastInput): string;
  dismiss(id: string): void;
  subscribe(fn: Listener): () => void;
  snapshot(): Toast[];
}

export function createToastStore(): ToastStore {
  let toasts: Toast[] = [];
  const listeners = new Set<Listener>();
  let counter = 0;

  const emit = () => listeners.forEach((l) => l(toasts));

  return {
    push(input) {
      const id = `t_${Date.now()}_${counter++}`;
      const next: Toast = {
        id,
        message: input.message,
        tone: input.tone ?? 'default',
        durationMs: input.durationMs ?? 2200,
      };
      toasts = [...toasts, next];
      emit();
      return id;
    },
    dismiss(id) {
      toasts = toasts.filter((t) => t.id !== id);
      emit();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    snapshot: () => toasts,
  };
}

export const toastStore = createToastStore();
