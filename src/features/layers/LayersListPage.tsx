import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/Button';
import { useLayers } from './hooks/useLayers';
import { LayerCard } from './components/LayerCard';
import { LayerFormDialog } from './components/LayerFormDialog';
import { LayerConfirmDeleteDialog } from './components/LayerConfirmDeleteDialog';
import type { Layer } from '@/lib/api/schemas/layer';

type DialogState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; layer: Layer }
  | { mode: 'delete'; layer: Layer };

export function LayersListPage() {
  const layers = useLayers();
  const items = layers.data ?? [];
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });

  return (
    <AppShell>
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
        <header className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
              레이어
            </div>
            <h1 className="text-2xl font-semibold text-cream">내 레이어</h1>
            <p className="text-sm text-cream-mute">
              관점별 축 묶음. 기본 &quot;Uncategorized&quot; 는 삭제할 수 없어요.
            </p>
          </div>
          <Button
            variant="primary"
            type="button"
            onClick={() => setDialog({ mode: 'create' })}
            aria-label="Layer 추가"
          >
            + Layer 추가
          </Button>
        </header>

        {layers.isLoading && (
          <p className="text-sm text-cream-faint">불러오는 중…</p>
        )}
        {layers.isError && (
          <p role="alert" className="text-sm text-amber">
            레이어 목록을 불러오지 못했어요.
          </p>
        )}
        {!layers.isLoading && !layers.isError && (
          <ul aria-label="Layer 목록" className="flex flex-col gap-3">
            {items.map((layer) => (
              <li key={layer.layerId}>
                <LayerCard
                  layer={layer}
                  onEdit={(l) => setDialog({ mode: 'edit', layer: l })}
                  onDelete={(l) => setDialog({ mode: 'delete', layer: l })}
                />
              </li>
            ))}
            {items.length === 0 && (
              <li className="text-sm text-cream-faint">아직 레이어가 없어요.</li>
            )}
          </ul>
        )}
      </div>

      <LayerFormDialog
        open={dialog.mode === 'create' || dialog.mode === 'edit'}
        onClose={() => setDialog({ mode: 'closed' })}
        layer={dialog.mode === 'edit' ? dialog.layer : undefined}
      />
      <LayerConfirmDeleteDialog
        open={dialog.mode === 'delete'}
        onClose={() => setDialog({ mode: 'closed' })}
        layer={dialog.mode === 'delete' ? dialog.layer : null}
      />
    </AppShell>
  );
}
