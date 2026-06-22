interface Props {
  current: number;
  steps: Array<{ key: string; label: string }>;
}

export function StepProgress({ current, steps }: Props) {
  return (
    <div className="mb-14 flex items-center gap-3.5">
      {steps.map((step, i) => {
        const isActive = i === current;
        const isPast = i < current;
        return (
          <div key={step.key} className="flex flex-1 items-center gap-3.5">
            <div
              className={`flex items-center gap-2.5 transition-colors ${
                isActive ? 'text-cream' : isPast ? 'text-cream-mute' : 'text-cream-faint'
              }`}
            >
              <span
                className={`grid h-[26px] w-[26px] place-items-center rounded-full border font-serif text-sm italic transition-all ${
                  isActive
                    ? 'border-amber bg-amber-soft text-amber-deep'
                    : isPast
                      ? 'border-amber-line bg-transparent text-amber-deep'
                      : 'border-edge-strong bg-transparent text-cream-faint'
                }`}
              >
                {(i + 1).toString().padStart(2, '0')}
              </span>
              <span
                className={`text-xs tracking-[0.04em] ${
                  isActive ? 'font-semibold' : 'font-normal'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={`h-px flex-1 transition-colors ${
                  isPast ? 'bg-amber-line' : 'bg-edge'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
