import type { ReactNode } from 'react';

export interface SectionHeaderProps {
  number: string;
  label: string;
  title: ReactNode;
  align?: 'split' | 'left' | 'center';
  aside?: ReactNode;
  className?: string;
}

export function SectionHeader({
  number,
  label,
  title,
  align = 'left',
  aside,
  className,
}: SectionHeaderProps) {
  const isSplit = align === 'split';
  const isCenter = align === 'center';

  const wrapperCls = [
    'mb-16 lg:mb-24',
    isSplit ? 'flex flex-col items-end gap-8 md:flex-row md:justify-between' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const titleCls = [
    'font-display font-bold tracking-tight leading-[0.95] text-cream break-keep',
    'text-4xl md:text-6xl lg:text-7xl',
    isCenter ? 'text-center' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperCls}>
      <div className={isCenter ? 'mx-auto flex flex-col items-center' : ''}>
        <div className={`mb-8 flex items-center gap-6 ${isCenter ? 'justify-center' : ''}`}>
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-lg italic text-cream/80">{number}</span>
            <span className="font-mono text-[11px] uppercase tracking-[var(--tracking-mono)] text-cream-mute">
              {label}
            </span>
          </div>
          <span aria-hidden className="h-px w-24 bg-gradient-to-r from-cream/30 to-transparent md:w-32" />
        </div>
        <h2 className={titleCls}>{title}</h2>
      </div>
      {aside && <div className="md:mb-2 md:self-end">{aside}</div>}
    </div>
  );
}
