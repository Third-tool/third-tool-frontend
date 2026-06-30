import { useEffect, useRef, type ReactNode } from 'react';
import { track } from '@/lib/analytics/track';

interface Props {
  title: string;
  body?: string;
  action?: ReactNode;
  name?: string;
}

export function EmptyState({ title, body, action, name }: Props) {
  const reportedRef = useRef(false);
  useEffect(() => {
    if (!name || reportedRef.current) return;
    reportedRef.current = true;
    track('empty_state_seen', { name });
  }, [name]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center break-keep">
      <h3 className="font-display text-2xl text-cream">{title}</h3>
      {body && <p className="text-cream-mute">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
