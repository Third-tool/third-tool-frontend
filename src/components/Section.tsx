import type { ElementType, ReactNode } from 'react';
import { EyebrowTag } from './EyebrowTag';

export interface SectionProps {
  eyebrow?: string;
  title?: ReactNode;
  align?: 'left' | 'center';
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

export function Section({
  eyebrow,
  title,
  align = 'left',
  as: As = 'section',
  className,
  children,
}: SectionProps) {
  return (
    <As
      className={[
        'mx-auto w-full px-4 sm:px-6 lg:px-8 py-[var(--section-py)]',
        'max-w-[var(--container-max)]',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {(eyebrow || title) && (
        <header
          className={[
            'mb-12 flex flex-col gap-4 break-keep',
            align === 'center' ? 'items-center text-center' : 'items-start',
          ].join(' ')}
        >
          {eyebrow && <EyebrowTag>{eyebrow}</EyebrowTag>}
          {title && (
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-snug text-cream">
              {title}
            </h2>
          )}
        </header>
      )}
      {children}
    </As>
  );
}
