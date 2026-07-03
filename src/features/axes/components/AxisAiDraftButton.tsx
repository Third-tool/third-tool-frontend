// product-learning-tower Epic 3 Story 3-8 (M4 · 2026-07-15+).
// AxisDetailPage Roadmap 탭·Selections 탭 각각의 [AI 초안 요청] 버튼.
// - mode="roadmap"    → useSuggestChaptersOutline (ChaptersOutlinePort)
// - mode="selection"  → useSuggestSelectionOutline (SelectionOutlinePort)
// - 결과 렌더는 최소 shell (title/rationale 리스트) · 6-Port 응답 구조 확인용.
import { Button } from '@/components/Button';
import { useSuggestChaptersOutline } from '@/lib/ai-suggestion/hooks/useSuggestChaptersOutline';
import { useSuggestSelectionOutline } from '@/lib/ai-suggestion/hooks/useSuggestSelectionOutline';
import { ApiError } from '@/lib/api/client';
import type { ChapterOutlineItem } from '@/lib/api/schemas/suggestion';

type Mode = 'roadmap' | 'selection';

interface Props {
  mode: Mode;
  axisName: string;
  layerName: string;
  concepts: string[];
  roadmapChapters?: ChapterOutlineItem[];
}

export function AxisAiDraftButton({
  mode,
  axisName,
  layerName,
  concepts,
  roadmapChapters = [],
}: Props) {
  const roadmap = useSuggestChaptersOutline();
  const selection = useSuggestSelectionOutline();
  const active = mode === 'roadmap' ? roadmap : selection;

  const disabled = concepts.length === 0;
  const disabledReason =
    concepts.length === 0 ? 'concepts를 먼저 설정하세요' : undefined;

  const onClick = () => {
    if (mode === 'roadmap') {
      roadmap.mutate({ concepts, layerName, axisName });
      return;
    }
    selection.mutate({ concepts, layerName, axisName, roadmapChapters });
  };

  const chapters =
    mode === 'roadmap'
      ? roadmap.data?.chapters
      : selection.data?.chapters;
  const containerName =
    mode === 'selection' ? selection.data?.containerName : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          type="button"
          onClick={onClick}
          disabled={disabled || active.isPending}
          aria-label={mode === 'roadmap' ? 'Roadmap 초안 요청' : 'Selection 초안 요청'}
          title={disabledReason}
        >
          {active.isPending ? '요청 중…' : 'AI 초안 요청'}
        </Button>
        {active.data?.suggestionsAvailable === false && (
          <span
            role="status"
            aria-label="AI 초안 폴백 안내"
            className="text-xs text-amber-deep"
          >
            현재 AI 응답이 준비되지 않았어요 (fallback).
          </span>
        )}
      </div>

      {active.isError && (
        <p role="alert" className="text-xs text-amber-deep">
          {active.error instanceof ApiError ? active.error.message : '초안 요청에 실패했어요.'}
        </p>
      )}

      {chapters && chapters.length > 0 && (
        <section
          aria-label={mode === 'roadmap' ? 'Roadmap 초안 결과' : 'Selection 초안 결과'}
          className="rounded-[12px] border border-edge bg-paper-2 p-4"
        >
          {containerName && (
            <p className="mb-2 text-xs text-cream-faint">
              컨테이너 제안: <span className="font-semibold text-cream-mute">{containerName}</span>
            </p>
          )}
          <ul className="m-0 flex flex-col gap-2 pl-0">
            {chapters.map((c, i) => (
              <li key={`${c.title}-${i}`} className="list-none">
                <p className="m-0 text-sm font-semibold text-cream">{c.title}</p>
                <p className="m-0 text-xs text-cream-mute break-keep">{c.rationale}</p>
              </li>
            ))}
          </ul>
          {active.data?.providerContext && (
            <p className="mt-3 text-[11px] text-cream-faint">
              provider: <code>{active.data.providerContext}</code>
            </p>
          )}
        </section>
      )}
    </div>
  );
}
