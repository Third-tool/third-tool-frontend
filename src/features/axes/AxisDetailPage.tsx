import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { RoadmapNodeList } from './components/RoadmapNodeList';
import { SelectionContainerList } from './components/SelectionContainerList';
import { ConceptSpecTooltip } from './components/ConceptSpecTooltip';
import { AxisAiDraftButton } from './components/AxisAiDraftButton';
import { CardsAxisShell } from './components/CardsAxisShell';
import { useLearningFacade } from '@/features/auth/hooks/useLearningFacade';

// product-learning-tower Epic 3 Story 3-2 (M4 · 2026-07-15+).
// `/axes/:axisId` 3-탭 재구성 · Roadmap / Selections / Cards.
// M3 착지 자산(<RoadmapNodeList>, <SelectionContainerList>, <ConceptSpecTooltip>)의
// 첫 사용자 노출 gate · DF-10 (6-Port hook 미배선) 해소 지점.
// - 탭 스위칭 시 편집 상태 보존: 세 탭 모두 sticky mount (hidden 속성으로 숨김).
// - Roadmap/Selections 탭에 [AI 초안 요청] 버튼(S3-8) + <ConceptSpecTooltip> 자동 open.
// - Cards 탭은 BE PR#4 (LT-E4-CARD-AXIS) 배선 후 활성화될 shell.

type Tab = 'roadmap' | 'selections' | 'cards';

const TAB_LABELS: Record<Tab, string> = {
  roadmap: 'Roadmap',
  selections: 'Selections',
  cards: 'Cards',
};

export function AxisDetailPage() {
  const { axisId = '' } = useParams<{ axisId: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('roadmap');
  const facade = useLearningFacade();

  const axisMeta = facade.data?.axes.find((a) => a.axisId === axisId);
  const axisName = axisMeta?.name ?? `축 ${axisId}`;
  const concepts = facade.data?.concepts ?? [];
  const layerName = '';

  return (
    <AppShell>
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
        <div>
          <Link
            to="/map"
            className="text-xs text-cream-faint transition-colors hover:text-cream"
          >
            ← 지도로
          </Link>
        </div>

        <header className="flex flex-col gap-2">
          <div className="text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
            축 상세
          </div>
          <h1 className="font-serif text-3xl text-cream break-keep">{axisName}</h1>
        </header>

        <nav
          role="tablist"
          aria-label="축 세부 탭"
          className="flex gap-1 border-b border-edge"
        >
          {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => {
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                role="tab"
                type="button"
                aria-selected={isActive}
                aria-controls={`panel-${tab}`}
                id={`tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={
                  isActive
                    ? 'border-b-2 border-amber px-4 py-2 text-sm font-semibold text-cream'
                    : 'border-b-2 border-transparent px-4 py-2 text-sm text-cream-mute transition-colors hover:text-cream'
                }
              >
                {TAB_LABELS[tab]}
              </button>
            );
          })}
        </nav>

        {/* Roadmap 탭 · sticky mount (hidden 속성으로 숨김) */}
        <div
          id="panel-roadmap"
          role="tabpanel"
          aria-labelledby="tab-roadmap"
          hidden={activeTab !== 'roadmap'}
          className="flex flex-col gap-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-cream">Roadmap</h2>
              <ConceptSpecTooltip mode="roadmap" />
            </div>
          </div>
          <AxisAiDraftButton
            mode="roadmap"
            axisName={axisName}
            layerName={layerName}
            concepts={concepts}
          />
          <RoadmapNodeList axisId={axisId} />
        </div>

        {/* Selections 탭 · sticky mount */}
        <div
          id="panel-selections"
          role="tabpanel"
          aria-labelledby="tab-selections"
          hidden={activeTab !== 'selections'}
          className="flex flex-col gap-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-cream">Selections</h2>
              <ConceptSpecTooltip mode="selection" />
            </div>
          </div>
          <AxisAiDraftButton
            mode="selection"
            axisName={axisName}
            layerName={layerName}
            concepts={concepts}
          />
          <SelectionContainerList axisId={axisId} />
        </div>

        {/* Cards 탭 · sticky mount */}
        <div
          id="panel-cards"
          role="tabpanel"
          aria-labelledby="tab-cards"
          hidden={activeTab !== 'cards'}
          className="flex flex-col gap-4"
        >
          <h2 className="text-sm font-semibold text-cream">Cards</h2>
          <CardsAxisShell axisId={axisId} />
        </div>
      </div>
    </AppShell>
  );
}
