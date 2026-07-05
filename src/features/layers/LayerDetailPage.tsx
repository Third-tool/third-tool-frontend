import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/Button';
import { useLayers } from './hooks/useLayers';
import { LayerFormDialog } from './components/LayerFormDialog';
import { LayerConfirmDeleteDialog } from './components/LayerConfirmDeleteDialog';
import { LayerHeaderBadge } from './components/LayerHeaderBadge';

// product-learning-tower Epic 2 Story 2-5 (신설 · 2026-07-02).
// M3 시점 shell: Layer 헤더 + LayerHeaderBadge + [편집]/[삭제]/[+ 축 추가] 진입.
// 하위 axis 목록 실 렌더는 M4 (LT Epic 3 S3-2 AxisDetailPage 재구성과 동조).

type DialogMode = 'closed' | 'edit' | 'delete';

export function LayerDetailPage() {
  const { layerId } = useParams<{ layerId: string }>();
  const navigate = useNavigate();
  const layers = useLayers();
  const layer = layers.data?.find((l) => l.layerId === layerId);
  const [dialog, setDialog] = useState<DialogMode>('closed');

  if (layers.isLoading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-cream-faint">
          불러오는 중…
        </div>
      </AppShell>
    );
  }

  if (!layer) {
    return (
      <AppShell>
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-10">
          <p role="alert" className="text-sm text-amber">
            Layer 를 찾을 수 없어요.
          </p>
          <Link to="/layers" className="text-sm text-cream-mute underline">
            Layer 목록으로 돌아가기
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
        <div>
          <Link
            to="/layers"
            className="text-xs text-cream-faint transition-colors hover:text-cream"
          >
            ← Layer 목록
          </Link>
        </div>

        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
              레이어 상세
            </div>
            <h1 className="text-2xl font-semibold text-cream">{layer.name}</h1>
            {/* axisCount 는 M4 에서 axis 목록 API 정합 후 실 값 주입. 현재는 placeholder. */}
            <LayerHeaderBadge
              deletedAt={layer.deletedAt ?? null}
              progressStatus={layer.progressStatus}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setDialog('edit')}
              aria-label={`${layer.name} 편집`}
            >
              편집
            </Button>
            <Button
              variant="ghost"
              type="button"
              onClick={() => setDialog('delete')}
              aria-label={`${layer.name} 삭제`}
            >
              삭제
            </Button>
          </div>
        </header>

        <section aria-label="하위 축 목록" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-cream">축 목록</h2>
            <Button
              variant="primary"
              type="button"
              disabled
              aria-label="축 추가 (준비 중)"
            >
              + 축 추가
            </Button>
          </div>
          <p className="text-sm text-cream-faint">
            축 목록은 다음 마일스톤에 붙습니다 (Learning Tower Epic 3 · AxisDetailPage 재구성).
          </p>
        </section>
      </div>

      <LayerFormDialog
        open={dialog === 'edit'}
        onClose={() => setDialog('closed')}
        layer={layer}
      />
      <LayerConfirmDeleteDialog
        open={dialog === 'delete'}
        onClose={() => setDialog('closed')}
        onDeleted={() => navigate('/layers', { replace: true })}
        layer={dialog === 'delete' ? layer : null}
      />
    </AppShell>
  );
}
