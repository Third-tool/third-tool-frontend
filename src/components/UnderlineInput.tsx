import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';

export interface UnderlineInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  inputSize?: 'md' | 'lg';
}

export const UnderlineInput = forwardRef<HTMLInputElement, UnderlineInputProps>(function UnderlineInput(
  { label, hint, error, inputSize = 'md', className, id: providedId, ...rest },
  ref,
) {
  const reactId = useId();
  const id = providedId ?? reactId;

  const sizeCls = inputSize === 'lg' ? 'text-2xl py-4' : 'text-lg py-3';

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label
          htmlFor={id}
          className="font-mono text-[10px] uppercase tracking-[var(--tracking-mono)] text-cream-faint"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={[
          'w-full border-b border-edge bg-transparent font-light text-cream outline-none transition-colors',
          'placeholder:text-cream-faint focus:border-cream',
          sizeCls,
          error ? 'border-red-400/60' : '',
          className ?? '',
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      />
      {(hint || error) && (
        <p
          className={`min-h-[1rem] font-mono text-[11px] tracking-tight ${error ? 'text-red-300' : 'text-cream-faint'}`}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
});
