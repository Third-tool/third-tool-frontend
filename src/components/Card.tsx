import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  children: ReactNode;
}

export function Card({ interactive, className, children, ...rest }: CardProps) {
  const outer = [
    'rounded-[var(--radius-card-outer)] bg-glass ring-1 ring-edge p-1.5 transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)]',
    interactive ? 'hover:-translate-y-1 hover:bg-[rgba(255,248,235,0.06)]' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={outer} {...rest}>
      <div className="rounded-[var(--radius-card-inner)] bg-surface p-6 shadow-[var(--shadow-card-inset)]">
        {children}
      </div>
    </div>
  );
}
