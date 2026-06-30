import type { ReactNode } from 'react';

export function EyebrowTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-amber-soft px-3 py-1 text-[11px] font-medium uppercase text-amber tracking-[var(--tracking-eyebrow)]">
      {children}
    </span>
  );
}
