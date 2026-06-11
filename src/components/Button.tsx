import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'ghost' | 'link';
type Size = 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  rightIcon?: ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary:
    'bg-amber text-canvas hover:scale-[1.02] active:scale-[0.98] shadow-[var(--shadow-lift)]',
  ghost: 'bg-transparent text-cream ring-1 ring-edge hover:bg-glass',
  link: 'bg-transparent text-amber underline-offset-4 hover:underline',
};

const sizeClass: Record<Size, string> = {
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-8 py-4 text-lg',
};

const baseClass =
  'group inline-flex items-center gap-2 rounded-full font-medium transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)] focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', rightIcon, className, children, ...rest },
  ref,
) {
  const cls = [baseClass, variantClass[variant], sizeClass[size], className]
    .filter(Boolean)
    .join(' ');
  return (
    <button ref={ref} className={cls} {...rest}>
      <span>{children}</span>
      {rightIcon && (
        <span className="grid h-8 w-8 place-items-center rounded-full bg-black/10 transition-transform duration-[var(--dur-base)] ease-[var(--ease-spring)] group-hover:translate-x-1">
          {rightIcon}
        </span>
      )}
    </button>
  );
});
