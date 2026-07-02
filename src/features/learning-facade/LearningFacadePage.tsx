import { AppShell } from '@/components/AppShell';
import { useLearningFacade } from '@/features/auth/hooks/useLearningFacade';
import { ConceptsBar } from './components/ConceptsBar';

export function LearningFacadePage() {
  const facade = useLearningFacade();
  const concepts = facade.data?.concepts ?? [];
  const axisCount = facade.data?.axes.length ?? 0;

  return (
    <AppShell>
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
        <header className="flex flex-col gap-3">
          <div className="text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
            학습 지도
          </div>
          <h1 className="text-2xl font-semibold text-cream">내 학습 컨셉</h1>
          <ConceptsBar concepts={concepts} />
        </header>

        <section
          aria-label="축 요약"
          className="rounded-2xl border border-edge bg-surface px-5 py-4 text-sm text-cream-mute"
        >
          {axisCount > 0 ? (
            <span>
              총 <strong className="text-cream">{axisCount}</strong>개 축이 정의돼 있어요.
            </span>
          ) : (
            <span>아직 축이 없어요. 컨셉을 정한 뒤 축을 추가해보세요.</span>
          )}
        </section>
      </div>
    </AppShell>
  );
}
