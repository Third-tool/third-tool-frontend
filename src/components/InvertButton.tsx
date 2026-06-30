import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export interface InvertButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  rightIcon?: ReactNode;
  size?: 'md' | 'lg';
  fullWidth?: boolean;
}

const sizeCls: Record<'md' | 'lg', string> = {
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-lg',
};

export const InvertButton = forwardRef<HTMLButtonElement, InvertButtonProps>(function InvertButton(
  { children, rightIcon, size = 'lg', fullWidth, className, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={[
        'group inline-flex items-center justify-center gap-3 rounded-full font-medium transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)]',
        'bg-cream text-canvas hover:scale-[1.02] active:scale-[0.98]',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100',
        sizeCls[size],
        fullWidth ? 'w-full' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      <span>{children}</span>
      {rightIcon && (
        <span className="transition-transform duration-[var(--dur-base)] ease-[var(--ease-spring)] group-hover:translate-x-1">
          {rightIcon}
        </span>
      )}
    </button>
  );
});
