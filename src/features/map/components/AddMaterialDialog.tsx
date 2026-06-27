import { useState } from 'react';
import { Dialog } from '@/components/Dialog';
import { UnderlineInput } from '@/components/UnderlineInput';
import { InvertButton } from '@/components/InvertButton';
import { Icon } from '@/components/Icon';
import { ApiError } from '@/lib/api/client';
import { track } from '@/lib/analytics/track';
import { useCreateMaterial } from '../hooks/useCreateMaterial';
import type { MaterialType, CreateMaterialResponse } from '@/lib/api/schemas/facade';

interface Props {
  open: boolean;
  axisName: string;
  topicId: string;
  topicName: string;
  onClose: () => void;
}

const TYPE_LABEL: Record<MaterialType, string> = {
  BOOK: '책',
  COURSE: '강의',
  AI_CONVERSATION: 'AI 대화',
  WEB_RESOURCE: '웹 리소스',
};

const TYPE_HINT: Record<MaterialType, string> = {
  BOOK: '저자를 알려주세요',
  COURSE: '플랫폼과 URL이 필요해요',
  AI_CONVERSATION: '어떤 AI인지 + 대화 요약',
  WEB_RESOURCE: '출처와 URL이 필요해요',
};

const TYPES: MaterialType[] = ['BOOK', 'COURSE', 'AI_CONVERSATION', 'WEB_RESOURCE'];

export function AddMaterialDialog({ open, axisName, topicId, topicName, onClose }: Props) {
  const [type, setType] = useState<MaterialType>('BOOK');
  const [name, setName] = useState('');
  const [author, setAuthor] = useState('');
  const [platform, setPlatform] = useState('');
  const [url, setUrl] = useState('');
  const [aiProvider, setAiProvider] = useState('Claude');
  const [source, setSource] = useState('Notion');
  const [note, setNote] = useState('');
  const [inline, setInline] = useState<string | null>(null);
  const [success, setSuccess] = useState<CreateMaterialResponse | null>(null);
  const create = useCreateMaterial();

  const reset = () => {
    setType('BOOK');
    setName('');
    setAuthor('');
    setPlatform('');
    setUrl('');
    setAiProvider('Claude');
    setSource('Notion');
    setNote('');
    setInline(null);
    setSuccess(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const requiredFilled = (() => {
    if (!name.trim()) return false;
    switch (type) {
      case 'BOOK':
        return author.trim().length > 0;
      case 'COURSE':
        return platform.trim().length > 0 && url.trim().length > 0;
      case 'AI_CONVERSATION':
        return aiProvider.trim().length > 0 && note.trim().length > 0;
      case 'WEB_RESOURCE':
        return source.trim().length > 0 && url.trim().length > 0;
    }
  })();

  const submit = () => {
    setInline(null);
    create.mutate(
      {
        name: name.trim(),
        materialType: type,
        linkedTopicIds: [topicId],
        author: type === 'BOOK' ? author.trim() : undefined,
        platform: type === 'COURSE' ? platform.trim() : undefined,
        url: type === 'COURSE' || type === 'WEB_RESOURCE' ? url.trim() : undefined,
        aiProvider: type === 'AI_CONVERSATION' ? aiProvider.trim() : undefined,
        webSource: type === 'WEB_RESOURCE' ? source.trim() : undefined,
        memo: type === 'AI_CONVERSATION' ? note.trim() : undefined,
      },
      {
        onSuccess: (res) => setSuccess(res),
        onError: (err) => {
          const code = err instanceof ApiError ? err.code : 'UNKNOWN';
          track('material_create_failed', { materialType: type, code });
          if (err instanceof ApiError) {
            setInline(err.message);
          } else {
            setInline('지금 등록이 어려워요. 잠시 후 다시 이어가주세요');
          }
        },
      },
    );
  };

  if (success) {
    return (
      <Dialog open={open} onClose={close} title="자료 등록 완료">
        <div className="flex flex-col gap-6">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-cream">
            <Icon name="solar:check-square-linear" width={28} height={28} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="font-display text-2xl text-cream">Deck이 자동 생성되었어요</h3>
            <p className="text-cream-mute break-keep">
              <span className="text-cream">{success.name}</span> Deck이 만들어졌어요. 연결된 주제 {success.linkedTopicIds.length}개의
              커버리지가 갱신됐어요.
            </p>
          </div>
          <div className="rounded-sm border border-edge bg-glass p-4">
            <span className="block font-mono text-[10px] uppercase tracking-[var(--tracking-mono)] text-cream-faint">
              영향 받은 주제
            </span>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-cream-mute">
              {success.updatedTopicsCoverage.map((t) => (
                <li key={t.topicId} className="flex items-center justify-between">
                  <span>{t.topicId === topicId ? topicName : t.topicId}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[var(--tracking-mono)] text-cream">
                    {t.coverageStatus}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-end">
            <InvertButton size="md" onClick={close}>
              닫기
            </InvertButton>
          </div>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={close} title={`${axisName} · ${topicName} 자료 추가`}>
      <div className="flex flex-col gap-6">
        <div>
          <span className="mb-3 block font-mono text-[10px] uppercase tracking-[var(--tracking-mono)] text-cream-faint">
            Type
          </span>
          <div className="grid grid-cols-4 gap-2">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-sm border px-3 py-3 font-mono text-[10px] uppercase tracking-[var(--tracking-mono)] transition-colors ${
                  type === t
                    ? 'border-cream bg-glass text-cream'
                    : 'border-edge text-cream-mute hover:text-cream'
                }`}
              >
                {TYPE_LABEL[t]}
              </button>
            ))}
          </div>
          <p className="mt-3 font-mono text-[11px] text-cream-faint">{TYPE_HINT[type]}</p>
        </div>

        <UnderlineInput
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="자료 이름"
        />

        {type === 'BOOK' && (
          <UnderlineInput
            label="Author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="예: Eric Evans"
          />
        )}

        {type === 'COURSE' && (
          <>
            <UnderlineInput
              label="Platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder="예: 인프런 / Coursera"
            />
            <UnderlineInput
              label="URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://"
            />
          </>
        )}

        {type === 'AI_CONVERSATION' && (
          <>
            <UnderlineInput
              label="AI Provider"
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value)}
              placeholder="Claude / ChatGPT / Gemini"
            />
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[var(--tracking-mono)] text-cream-faint">
                Note
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="대화 요약"
                className="resize-none border-b border-edge bg-transparent py-3 text-lg font-light text-cream outline-none transition-colors placeholder:text-cream-faint focus:border-cream"
              />
            </label>
          </>
        )}

        {type === 'WEB_RESOURCE' && (
          <>
            <UnderlineInput
              label="Source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Notion / 블로그 / 문서"
            />
            <UnderlineInput
              label="URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://"
            />
          </>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-edge pt-4">
          <p
            role="alert"
            className="font-mono text-[11px] uppercase tracking-[var(--tracking-mono)] text-red-300"
          >
            {inline ?? ' '}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={close}
              className="font-mono text-[11px] uppercase tracking-[var(--tracking-mono)] text-cream-mute transition-colors hover:text-cream"
            >
              취소
            </button>
            <InvertButton
              size="md"
              onClick={submit}
              disabled={!requiredFilled || create.isPending}
              rightIcon={<Icon name="solar:arrow-right-linear" width={16} height={16} />}
            >
              {create.isPending ? 'Saving…' : '자료 등록'}
            </InvertButton>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
