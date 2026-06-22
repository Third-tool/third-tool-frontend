import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'dark' | 'ghost' | 'link';
type Size = 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary:
    'bg-amber text-white shadow-[0_10px_24px_-12px_rgba(196,103,63,0.65)] hover:-translate-y-px hover:bg-amber-deep',
  dark: 'bg-cream text-canvas hover:-translate-y-px',
  ghost: 'bg-transparent text-cream-mute ring-1 ring-edge-strong hover:bg-paper-2 hover:text-cream',
  link: 'bg-transparent text-amber underline-offset-4 hover:underline',
};

const sizeClass: Record<Size, string> = {
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

const baseClass =
  'group inline-flex items-center gap-2 rounded-full font-medium transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)] focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', rightIcon, fullWidth, className, children, ...rest },
  ref,
) {
  const cls = [
    baseClass,
    variantClass[variant],
    sizeClass[size],
    fullWidth ? 'w-full justify-center' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const showCircle = variant === 'dark';

  return (
    <button ref={ref} className={cls} {...rest}>
      <span>{children}</span>
      {rightIcon &&
        (showCircle ? (
          <span className="grid h-7 w-7 place-items-center rounded-full bg-amber text-white transition-transform duration-[var(--dur-base)] ease-[var(--ease-spring)] group-hover:translate-x-0.5">
            {rightIcon}
          </span>
        ) : (
          <span className="inline-flex transition-transform duration-[var(--dur-base)] ease-[var(--ease-spring)] group-hover:translate-x-0.5">
            {rightIcon}
          </span>
        ))}
    </button>
  );
});
