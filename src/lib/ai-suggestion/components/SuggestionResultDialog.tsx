import { Dialog } from '@/components/Dialog';
import { Button } from '@/components/Button';
import type {
  LayerSuggestionsResponse,
  AxisSuggestionsResponse,
  ChaptersOutlineResponse,
  ChapterSubtreeResponse,
  SelectionOutlineResponse,
  SelectionSubtreeResponse,
} from '@/lib/api/schemas/suggestion';

// product-ai-suggestion Epic 2 · Story 2-1 뼈대 (M4 재편).
// 4-Port SUPERSEDED · 6-Port 응답 렌더로 확장 · providerContext 3종 (planner/designer/problem-solver) 헤더 표기.
// 실제 [적용] 액션 · [편집] · 개별 카드 상호작용은 M5 이관 (Story 2-2/2-3).
// (참조: `workflows/fe/fe-workspectrum/sdd/in-progress/product-ai-suggestion.md` Story 2-1)

export type SuggestionResult =
  | { port: 'layer'; response: LayerSuggestionsResponse }
  | { port: 'axis'; response: AxisSuggestionsResponse }
  | { port: 'chapters-outline'; response: ChaptersOutlineResponse }
  | { port: 'chapter-subtree'; response: ChapterSubtreeResponse }
  | { port: 'selection-outline'; response: SelectionOutlineResponse }
  | { port: 'selection-subtree'; response: SelectionSubtreeResponse };

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
  'chapters-outline': {
    title: 'AI 가 제안한 축 헌법 챕터',
    eyebrow: 'CHAPTERS · 수렴/헌법',
    empty: 'AI 가 제안할 챕터가 없어요.',
  },
  'chapter-subtree': {
    title: 'AI 가 제안한 챕터 subtree',
    eyebrow: 'CHAPTER · body ASCII',
    empty: 'AI 가 제안할 subtree 가 없어요.',
  },
  'selection-outline': {
    title: 'AI 가 제안한 축 판례 컨테이너',
    eyebrow: 'SELECTIONS · 발산/판례',
    empty: 'AI 가 제안할 판례 컨테이너가 없어요.',
  },
  'selection-subtree': {
    title: 'AI 가 제안한 판례 subtree',
    eyebrow: 'SELECTION · body ASCII',
    empty: 'AI 가 제안할 subtree 가 없어요.',
  },
};

// providerContext 3종(role) → 사용자 라벨 매핑 (BE Role Detector · Static Adapter role catalog)
// 예: "static:backend-developer" · "static:planner" · "static:designer" · "static:problem-solver" · "static:generic"
//     "llm:vertex-gemini" (M6+)
const ROLE_LABEL: Record<string, string> = {
  'backend-developer': '백엔드',
  planner: '기획',
  designer: '디자인',
  'problem-solver': '문제해결',
  generic: '일반',
};

function providerLabel(providerContext: string | undefined): string | null {
  if (!providerContext) return null;
  const [source, role] = providerContext.split(':');
  if (!role) return providerContext;
  const label = ROLE_LABEL[role] ?? role;
  return source === 'llm' ? `LLM · ${label}` : label;
}

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
    case 'chapters-outline': {
      const items = result.response.chapters;
      if (items.length === 0) {
        return (
          <p className="text-sm text-cream-faint">{PORT_META['chapters-outline'].empty}</p>
        );
      }
      return (
        <ul aria-label="챕터 outline 제안 목록" className="flex flex-col gap-2">
          {items.map((c) => (
            <li
              key={c.title}
              className="rounded-2xl border border-edge bg-surface px-4 py-3"
            >
              <div className="text-sm font-semibold text-cream">{c.title}</div>
              <div className="text-xs text-cream-faint">{c.rationale}</div>
            </li>
          ))}
        </ul>
      );
    }
    case 'chapter-subtree':
      return (
        <pre
          aria-label="챕터 subtree ASCII"
          className="whitespace-pre-wrap rounded-2xl border border-edge bg-surface px-4 py-3 font-mono text-xs text-cream"
        >
          {result.response.bodyAsciiTree}
        </pre>
      );
    case 'selection-outline': {
      const items = result.response.chapters;
      return (
        <div className="flex flex-col gap-3">
          <div
            aria-label="판례 컨테이너 이름"
            className="rounded-2xl border border-edge bg-surface px-4 py-3 text-sm text-cream"
          >
            <span className="text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
              컨테이너
            </span>
            <div className="mt-1 font-semibold">{result.response.containerName}</div>
          </div>
          {items.length === 0 ? (
            <p className="text-sm text-cream-faint">
              {PORT_META['selection-outline'].empty}
            </p>
          ) : (
            <ul
              aria-label="판례 outline 제안 목록"
              className="flex flex-col gap-2"
            >
              {items.map((c) => (
                <li
                  key={c.title}
                  className="rounded-2xl border border-edge bg-surface px-4 py-3"
                >
                  <div className="text-sm font-semibold text-cream">{c.title}</div>
                  <div className="text-xs text-cream-faint">{c.rationale}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }
    case 'selection-subtree':
      return (
        <pre
          aria-label="판례 subtree ASCII"
          className="whitespace-pre-wrap rounded-2xl border border-edge bg-surface px-4 py-3 font-mono text-xs text-cream"
        >
          {result.response.bodyAsciiTree}
        </pre>
      );
  }
}

export function SuggestionResultDialog({ open, onClose, result }: Props) {
  const meta = result ? PORT_META[result.port] : null;
  const provider = result ? providerLabel(result.response.providerContext) : null;
  return (
    <Dialog open={open} onClose={onClose} title={meta?.title ?? 'AI 제안'}>
      <div className="flex flex-col gap-4">
        {meta && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
              {meta.eyebrow}
            </span>
            {provider && (
              <span
                aria-label={`AI provider: ${result?.response.providerContext ?? ''}`}
                className="rounded-full border border-edge px-2 py-0.5 text-[10px] uppercase text-cream-mute"
              >
                {provider}
              </span>
            )}
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
