import { useEffect, type ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Dialog({ open, onClose, title, children, footer }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center"
      role="presentation"
    >
      <button
        type="button"
        aria-label="dialog backdrop"
        data-testid="dialog-backdrop"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-lg rounded-t-[var(--radius-card-outer)] bg-glass p-1.5 ring-1 ring-edge md:rounded-[var(--radius-card-outer)]"
      >
        <div className="rounded-t-[var(--radius-card-inner)] bg-surface p-6 shadow-[var(--shadow-card-inset)] md:rounded-[var(--radius-card-inner)]">
          <header className="mb-5">
            <h2 className="font-display text-2xl font-bold text-cream">{title}</h2>
          </header>
          <div className="text-cream-mute">{children}</div>
          {footer && <footer className="mt-6 flex justify-end gap-3">{footer}</footer>}
        </div>
      </div>
    </div>
  );
}
