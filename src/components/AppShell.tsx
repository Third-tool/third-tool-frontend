import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface Props {
  topbar?: ReactNode;
  sidebarContext?: ReactNode;
  archiveCount?: number;
  children: ReactNode;
}

export function AppShell({ topbar, sidebarContext, archiveCount, children }: Props) {
  return (
    <div className="flex min-h-[100dvh] bg-canvas text-cream">
      <Sidebar contextSlot={sidebarContext} archiveCount={archiveCount} />
      <main className="flex min-w-0 flex-1 flex-col">
        {topbar && (
          <div className="sticky top-0 z-20 flex items-center justify-between gap-5 border-b border-edge bg-canvas/85 px-10 py-4 backdrop-blur-md">
            {topbar}
          </div>
        )}
        <div className="w-full max-w-[1120px] px-10 pb-20 pt-11">{children}</div>
      </main>
    </div>
  );
}
