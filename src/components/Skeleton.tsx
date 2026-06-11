import type { HTMLAttributes } from 'react';

export function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const cls = [
    'animate-pulse rounded-[var(--radius-card-inner)] bg-glass',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  return <div aria-hidden className={cls} {...rest} />;
}
