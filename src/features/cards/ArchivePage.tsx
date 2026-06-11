import { useState } from 'react';
import { ArchiveMasonry } from './sections/ArchiveMasonry';
import { CreateCardDialog } from './components/CreateCardDialog';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';

export function ArchivePage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <main className="min-h-[100dvh] pt-20 pb-24">
      <div className="mx-auto flex max-w-6xl items-end justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <header className="break-keep">
          <p className="font-display text-sm uppercase tracking-[var(--tracking-eyebrow)] text-amber">
            배경 지식 서가
          </p>
          <h1 className="mt-2 font-display text-3xl text-cream md:text-4xl">
            잠시 쉬러 간 카드들.
          </h1>
        </header>
        <Button
          variant="ghost"
          rightIcon={<Icon name="solar:add-circle-linear" />}
          onClick={() => setCreateOpen(true)}
        >
          새 카드
        </Button>
      </div>

      <section className="mx-auto mt-10 max-w-6xl px-4 sm:px-6 lg:px-8">
        <ArchiveMasonry />
      </section>

      <CreateCardDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </main>
  );
}
