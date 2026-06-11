import { useState } from 'react';
import { Dialog } from '@/components/Dialog';
import { Button } from '@/components/Button';
import { KeywordInput } from './KeywordInput';
import { TagInput } from './TagInput';
import { useCreateCard } from '../hooks/useCreateCard';
import { ApiError } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
}

const FIELD_ERROR: Record<string, string> = {
  CARD_SUMMARY_REQUIRED: '한 줄 요약을 채워주세요.',
  CARD_KEYWORD_MIN_REQUIRED: '키워드 1개 이상이 필요해요.',
};

export function CreateCardDialog({ open, onClose }: Props) {
  const [summary, setSummary] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const create = useCreateCard();

  const canSubmit = summary.trim().length > 0 && keywords.length > 0;

  const reset = () => {
    setSummary('');
    setKeywords([]);
    setTags([]);
    setBannerError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    setBannerError(null);
    create.mutate(
      { summary: summary.trim(), keywords, tags },
      {
        onSuccess: handleClose,
        onError: (err) => {
          if (err instanceof ApiError && FIELD_ERROR[err.code]) {
            setBannerError(FIELD_ERROR[err.code]!);
          } else {
            setBannerError('지금 카드를 펼치기 어려워요. 잠시 후 다시 시도해주세요.');
          }
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="새 카드 펴기"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={create.isPending}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || create.isPending}>
            카드 펴기
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {bannerError && (
          <div className="rounded-2xl bg-amber-soft px-4 py-2 text-sm text-amber">
            {bannerError}
          </div>
        )}
        <label className="flex flex-col gap-2 text-sm text-cream-mute">
          <span>한 줄 요약</span>
          <textarea
            aria-label="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="이 카드에 무엇을 담을까요?"
            className="resize-none rounded-2xl bg-glass px-4 py-3 text-cream outline-none ring-1 ring-edge focus:ring-amber"
          />
          <span className="text-right text-xs text-cream-faint">{summary.length} / 500</span>
        </label>
        <KeywordInput value={keywords} onChange={setKeywords} label="키워드" />
        <TagInput value={tags} onChange={setTags} />
      </div>
    </Dialog>
  );
}
