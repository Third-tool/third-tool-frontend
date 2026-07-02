import { Dialog } from '@/components/Dialog';
import { Button } from '@/components/Button';
import type {
  LayerSuggestionsResponse,
  AxisSuggestionsResponse,
  RoadmapSuggestionResponse,
  SelectionsSuggestionsResponse,
} from '@/lib/api/schemas/suggestion';

// product-ai-suggestion Tier 2 shell.
// 4-Port 각각의 응답을 공통 dialog 로 열고 닫는 shell 만 담당.
// 실제 결과 렌더 (chip 목록, body 렌더링, 저장 CTA) 는 다음 마일스톤에서 각 Port 별 컴포넌트로 확장.
export type SuggestionResult =
  | { port: 'layer'; response: LayerSuggestionsResponse }
  | { port: 'axis'; response: AxisSuggestionsResponse }
  | { port: 'roadmap'; response: RoadmapSuggestionResponse }
  | { port: 'selections'; response: SelectionsSuggestionsResponse };

interface Props {
  open: boolean;
  onClose: () => void;
  result: SuggestionResult | null;
}

const PORT_META: Record<
  SuggestionResult['port'],
  { title: string; eyebrow: string; empty: string }
> = {
  layer: {
    title: 'AI 가 제안한 Layer',
    eyebrow: 'LAYER · AI 제안',
    empty: 'AI 가 제안할 Layer 가 없어요.',
  },
  axis: {
    title: 'AI 가 제안한 축',
    eyebrow: 'AXIS · AI 제안',
    empty: 'AI 가 제안할 축이 없어요.',
  },
  roadmap: {
    title: 'AI 가 제안한 축 헌법 초안',
    eyebrow: 'ROADMAP · AI 제안',
    empty: 'AI 가 제안할 헌법 초안이 없어요.',
  },
  selections: {
    title: 'AI 가 제안한 축 판례',
    eyebrow: 'SELECTIONS · AI 제안',
    empty: 'AI 가 제안할 판례가 없어요.',
  },
};

function renderBody(result: SuggestionResult) {
  if (!result.response.suggestionsAvailable) {
    return (
      <p className="text-sm text-cream-mute">
        지금은 AI 제안을 준비하지 못했어요. 잠시 후 다시 시도해주세요.
      </p>
    );
  }

  switch (result.port) {
    case 'layer': {
      const items = result.response.layers;
      if (items.length === 0) {
        return <p className="text-sm text-cream-faint">{PORT_META.layer.empty}</p>;
      }
      return (
        <ul aria-label="Layer 제안 목록" className="flex flex-col gap-2">
          {items.map((s) => (
            <li key={s.name} className="rounded-2xl border border-edge bg-surface px-4 py-3">
              <div className="text-sm font-semibold text-cream">{s.name}</div>
              <div className="text-xs text-cream-faint">축 {s.suggestedAxisCount}개 예상</div>
            </li>
          ))}
        </ul>
      );
    }
    case 'axis': {
      const items = result.response.axes;
      if (items.length === 0) {
        return <p className="text-sm text-cream-faint">{PORT_META.axis.empty}</p>;
      }
      return (
        <ul aria-label="축 제안 목록" className="flex flex-col gap-2">
          {items.map((s) => (
            <li key={s.name} className="rounded-2xl border border-edge bg-surface px-4 py-3">
              <div className="text-sm font-semibold text-cream">{s.name}</div>
            </li>
          ))}
        </ul>
      );
    }
    case 'roadmap':
      return (
        <p aria-label="축 헌법 초안 요약" className="text-sm text-cream-mute">
          축 헌법 초안이 도착했어요. 다음 버전에서 편집 가능한 형태로 렌더될 예정입니다.
        </p>
      );
    case 'selections': {
      const items = result.response.selections;
      if (items.length === 0) {
        return <p className="text-sm text-cream-faint">{PORT_META.selections.empty}</p>;
      }
      return (
        <ul aria-label="판례 제안 목록" className="flex flex-col gap-2">
          {items.map((s) => (
            <li key={s.name} className="rounded-2xl border border-edge bg-surface px-4 py-3">
              <div className="text-sm font-semibold text-cream">{s.name}</div>
            </li>
          ))}
        </ul>
      );
    }
  }
}

export function SuggestionResultDialog({ open, onClose, result }: Props) {
  const meta = result ? PORT_META[result.port] : null;
  return (
    <Dialog open={open} onClose={onClose} title={meta?.title ?? 'AI 제안'}>
      <div className="flex flex-col gap-4">
        {meta && (
          <div className="text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
            {meta.eyebrow}
          </div>
        )}
        {result ? (
          renderBody(result)
        ) : (
          <p className="text-sm text-cream-faint">아직 제안 데이터가 없어요.</p>
        )}
        <div className="mt-2 flex items-center justify-end gap-3">
          <Button variant="ghost" type="button" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
