import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { ApiError } from '@/lib/api/client';
import type { AxisRoadmapNode } from '@/lib/api/schemas/axisRoadmapNode';
import {
  useUpdateRoadmapNode,
  useDeleteRoadmapNode,
} from '../hooks/useRoadmapNodeMutations';
import { NodeBodyEditor } from './NodeBodyEditor';

// product-learning-tower Story 3-9 (신설 · 2026-07-02).
// 개별 챕터 노드 카드 — title / rationale / body preview 표시 + 편집 · 삭제.
// dnd-kit 드래그 핸들은 부모 RoadmapNodeList 가 SortableContext 로 감싸며 attach.

const MAX_TITLE = 200;
const MAX_RATIONALE = 500;
const BODY_PREVIEW_LINES = 3;

interface Props {
  node: AxisRoadmapNode;
  dragHandle?: React.ReactNode;
}

export function RoadmapNodeCard({ node, dragHandle }: Props) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [title, setTitle] = useState(node.title);
  const [rationale, setRationale] = useState(node.rationale ?? '');
  const [body, setBody] = useState(node.body);
  const [inline, setInline] = useState<string | null>(null);
  const update = useUpdateRoadmapNode(node.axisId, node.id);
  const del = useDeleteRoadmapNode(node.axisId);

  useEffect(() => {
    if (mode === 'view') {
      setTitle(node.title);
      setRationale(node.rationale ?? '');
      setBody(node.body);
      setInline(null);
    }
  }, [mode, node.title, node.rationale, node.body]);

  const handleError = (err: unknown) => {
    if (err instanceof ApiError) {
      if (err.code === 'ROADMAP_NODE_TITLE_BLANK') {
        setInline('노드 제목을 입력해주세요.');
      } else if (err.code === 'ROADMAP_NODE_BODY_BLANK') {
        setInline('노드 본문을 입력해주세요.');
      } else if (err.code === 'ROADMAP_NODE_NOT_FOUND') {
        setInline('이미 삭제된 노드예요.');
      } else {
        setInline('저장에 실패했어요. 잠시 후 다시 시도해주세요.');
      }
    } else {
      setInline('저장에 실패했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  const canSave =
    title.trim().length > 0 &&
    title.trim().length <= MAX_TITLE &&
    rationale.length <= MAX_RATIONALE &&
    body.trim().length > 0 &&
    !update.isPending;

  const onSave = () => {
    if (!canSave) return;
    setInline(null);
    update.mutate(
      {
        title: title.trim(),
        rationale: rationale.trim() === '' ? null : rationale.trim(),
        body,
      },
      {
        onSuccess: () => setMode('view'),
        onError: handleError,
      },
    );
  };

  const onDelete = () => {
    if (!window.confirm(`"${node.title}" 노드를 삭제할까요? 복원할 수 없어요.`)) return;
    setInline(null);
    del.mutate(node.id, { onError: handleError });
  };

  if (mode === 'edit') {
    return (
      <article
        aria-label={`${node.title} 편집`}
        className="flex flex-col gap-4 rounded-2xl border border-edge bg-surface px-4 py-4"
      >
        <label className="flex flex-col gap-2">
          <span className="text-sm text-cream-mute">제목</span>
          <input
            aria-label="노드 제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={MAX_TITLE + 20}
            className="rounded-2xl bg-glass px-3 py-2 text-sm text-cream outline-none ring-1 ring-edge focus:ring-cream"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm text-cream-mute">근거 (선택)</span>
          <input
            aria-label="노드 근거"
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            maxLength={MAX_RATIONALE + 20}
            className="rounded-2xl bg-glass px-3 py-2 text-sm text-cream outline-none ring-1 ring-edge focus:ring-cream"
          />
        </label>
        <NodeBodyEditor value={body} onChange={setBody} />
        {inline && (
          <p role="alert" className="text-sm text-amber">
            {inline}
          </p>
        )}
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" type="button" onClick={() => setMode('view')} disabled={update.isPending}>
            취소
          </Button>
          <Button variant="primary" type="button" onClick={onSave} disabled={!canSave}>
            {update.isPending ? '저장 중…' : '저장'}
          </Button>
        </div>
      </article>
    );
  }

  const bodyPreviewLines = node.body.split('\n').slice(0, BODY_PREVIEW_LINES);

  return (
    <article
      aria-label={`${node.title} 노드`}
      className="flex items-start gap-3 rounded-2xl border border-edge bg-surface px-4 py-4"
    >
      {dragHandle}
      <div className="flex flex-1 flex-col gap-2">
        <header className="flex items-baseline justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
              #{node.displayOrder}
            </span>
            <h3 className="text-base font-semibold text-cream">{node.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode('edit')}
              aria-label={`${node.title} 편집`}
              className="rounded-full px-2 py-1 text-xs text-cream-faint transition-colors hover:bg-paper-2 hover:text-cream"
            >
              편집
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label={`${node.title} 삭제`}
              className="rounded-full px-2 py-1 text-xs text-cream-faint transition-colors hover:bg-paper-2 hover:text-cream"
              disabled={del.isPending}
            >
              {del.isPending ? '삭제 중…' : '삭제'}
            </button>
          </div>
        </header>
        {node.rationale && (
          <p className="text-xs text-cream-mute">{node.rationale}</p>
        )}
        <pre
          aria-label={`${node.title} 본문 미리보기`}
          className="whitespace-pre-wrap rounded-xl bg-paper-2 px-3 py-2 font-mono text-xs text-cream-mute"
        >
          {bodyPreviewLines.join('\n')}
          {node.body.split('\n').length > BODY_PREVIEW_LINES && '\n…'}
        </pre>
        {inline && (
          <p role="alert" className="text-sm text-amber">
            {inline}
          </p>
        )}
      </div>
    </article>
  );
}
