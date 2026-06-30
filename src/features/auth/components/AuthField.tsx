import type { InputHTMLAttributes, ReactNode } from 'react';
import { Icon } from '@/components/Icon';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> {
  label: string;
  icon: string;
  rightSlot?: ReactNode;
}

export function AuthField({ label, icon, rightSlot, id, ...inputProps }: Props) {
  const fieldId = id ?? inputProps.name;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={fieldId} className="text-xs font-medium text-cream-mute">
          {label}
        </label>
        {rightSlot}
      </div>
      <div className="flex items-center gap-2.5 rounded-[12px] border border-edge-strong bg-surface px-[15px] py-[13px] transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] focus-within:border-amber-line focus-within:shadow-[0_0_0_3px_var(--color-amber-soft)]">
        <Icon name={icon} width={17} height={17} className="text-cream-faint" />
        <input
          id={fieldId}
          {...inputProps}
          className="w-full border-0 bg-transparent text-[15px] text-cream outline-none placeholder:text-cream-faint"
        />
      </div>
    </div>
  );
}
