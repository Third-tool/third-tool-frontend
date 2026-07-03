import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { ApiError } from '@/lib/api/client';
import {
  useCreateAxisSelection,
  useUpdateAxisSelection,
} from '../hooks/useAxisSelectionMutations';
import type { AxisSelection } from '@/lib/api/schemas/axisSelection';

// product-learning-tower Story 3-5 개정. Selection 컨테이너 이름 create/edit in-place 폼.
// 이슈 #11 정책 계승: name UNIQUE per axis → 409 시 인라인 에러.

const MAX_NAME = 100;

interface Props {
  axisId: string;
  mode: 'create' | 'edit';
  selection?: AxisSelection; // mode='edit' 필수
  onDone: () => void;
  onCancel: () => void;
}

export function AxisSelectionForm({ axisId, mode, selection, onDone, onCancel }: Props) {
  const [name, setName] = useState(selection?.name ?? '');
  const [inline, setInline] = useState<string | null>(null);
  const create = useCreateAxisSelection(axisId);
  const update = useUpdateAxisSelection(axisId, selection?.id ?? '');
  const mutation = mode === 'edit' ? update : create;

  useEffect(() => {
    setName(selection?.name ?? '');
    setInline(null);
  }, [selection?.id, mode]);

  const trimmed = name.trim();
  const tooLong = trimmed.length > MAX_NAME;
  const canSave = trimmed.length > 0 && !tooLong && !mutation.isPending;

  const handleError = (err: unknown) => {
    if (err instanceof ApiError) {
      if (err.code === 'AXIS_SELECTION_NAME_DUPLICATE') {
        setInline('같은 이름의 Selection 이 이미 있어요. 다른 이름을 써주세요.');
      } else if (err.code === 'C001') {
        setInline(`이름은 1~${MAX_NAME}자여야 해요.`);
      } else {
        setInline('저장에 실패했어요. 잠시 후 다시 시도해주세요.');
      }
    } else {
      setInline('저장에 실패했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  const submit = () => {
    if (!canSave) return;
    setInline(null);
    if (mode === 'edit') {
      update.mutate({ name: trimmed }, { onSuccess: onDone, onError: handleError });
    } else {
      create.mutate({ name: trimmed }, { onSuccess: onDone, onError: handleError });
    }
  };

  return (
    <form
      aria-label={mode === 'edit' ? 'Selection 이름 변경' : '새 Selection 추가'}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-3 rounded-2xl border border-edge bg-surface px-4 py-4"
    >
      <label className="flex flex-col gap-2">
        <span className="text-sm text-cream-mute">Selection 이름</span>
        <input
          aria-label="Selection 이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          maxLength={MAX_NAME + 20}
          placeholder="예: 웹 서비스 실전 v1"
          className="rounded-2xl bg-glass px-3 py-2 text-sm text-cream outline-none ring-1 ring-edge focus:ring-cream"
        />
        <span className="text-xs text-cream-faint">
          {trimmed.length}/{MAX_NAME}
        </span>
      </label>

      {tooLong && (
        <p role="alert" className="text-sm text-amber">
          이름은 {MAX_NAME}자를 넘을 수 없어요.
        </p>
      )}
      {inline && (
        <p role="alert" className="text-sm text-amber">
          {inline}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button
          variant="ghost"
          type="button"
          onClick={onCancel}
          disabled={mutation.isPending}
        >
          취소
        </Button>
        <Button variant="primary" type="submit" disabled={!canSave}>
          {mutation.isPending ? '저장 중…' : mode === 'edit' ? '변경' : '추가'}
        </Button>
      </div>
    </form>
  );
}
