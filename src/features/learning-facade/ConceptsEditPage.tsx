import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/Button';
import { useLearningFacade } from '@/features/auth/hooks/useLearningFacade';
import { ApiError } from '@/lib/api/client';
import { ConceptsInput } from './components/ConceptsInput';
import { useConceptsMutation } from './hooks/useConceptsMutation';

export function ConceptsEditPage() {
  const navigate = useNavigate();
  const facade = useLearningFacade();
  const mutation = useConceptsMutation();
  const [draft, setDraft] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (facade.data && draft.length === 0) {
      setDraft(facade.data.concepts ?? []);
    }
  }, [facade.data, draft.length]);

  const canSave = draft.length >= 1 && !mutation.isPending;

  const onSave = async () => {
    setError(null);
    try {
      await mutation.mutateAsync(draft);
      navigate('/me');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message ?? '저장에 실패했어요');
      } else {
        setError('저장에 실패했어요');
      }
    }
  };

  return (
    <AppShell>
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-cream">학습 컨셉 편집</h1>
          <p className="text-sm text-cream-mute">
            내가 다루는 관점을 1~5개까지 태그로 정리해요. 순서는 나중에 조정할 수 있어요.
          </p>
        </header>

        <section aria-label="컨셉 입력">
          <ConceptsInput value={draft} onChange={setDraft} />
        </section>

        {error && (
          <p role="alert" className="text-sm text-amber">
            {error}
          </p>
        )}

        <footer className="flex items-center gap-3">
          <Button variant="primary" onClick={onSave} disabled={!canSave}>
            {mutation.isPending ? '저장 중…' : '저장'}
          </Button>
          <Button variant="ghost" onClick={() => navigate(-1)} disabled={mutation.isPending}>
            취소
          </Button>
        </footer>
      </div>
    </AppShell>
  );
}
