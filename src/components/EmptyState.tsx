import type { ReactNode } from 'react';

interface Props {
  title: string;
  body?: string;
  action?: ReactNode;
}

export function EmptyState({ title, body, action }: Props) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center break-keep">
      <h3 className="font-display text-2xl text-cream">{title}</h3>
      {body && <p className="text-cream-mute">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
