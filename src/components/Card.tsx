import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  children: ReactNode;
}

export function Card({ interactive, className, children, ...rest }: CardProps) {
  const cls = [
    'rounded-[var(--radius-card-outer)] bg-surface border border-edge p-6 transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)]',
    interactive
      ? 'hover:-translate-y-[3px] hover:border-amber-line hover:shadow-[var(--shadow-card)] cursor-pointer'
      : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  );
}
