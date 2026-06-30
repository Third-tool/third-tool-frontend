import { useEffect, useRef, useState, type ChangeEvent, type ClipboardEvent, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { MarkdownView } from '@/components/MarkdownView';
import { useCreateCard } from '@/features/cards/hooks/useCreateCard';
import { useSelectedDeck } from '@/features/decks/DeckContext';
import { useDecks } from '@/features/decks/hooks/useDecks';

type Mode = 'edit' | 'preview';

const AI_DRAFT = (subject: string): string =>
  [
    `## ${subject || '멱등성 (Idempotency)'}`,
    '같은 요청을 **여러 번** 보내도 결과가 **한 번** 보낸 것과 같도록 보장하는 성질.',
    '### 핵심',
    '- 클라이언트가 **멱등 키**를 생성해 함께 전송',
    '- 서버는 키로 이전 결과를 조회 → 있으면 그대로 반환',
    '- 없으면 처리하고 결과를 키와 함께 저장',
    '```\nPOST /payments\nIdempotency-Key: 9f8b-...-c21\n```',
    '> AI가 정리한 초안이에요. 내 언어로 다듬어보세요.',
  ].join('\n\n');

export function CardEditorPage() {
  const navigate = useNavigate();
  const create = useCreateCard();
  const { selectedDeckId } = useSelectedDeck();
  const decks = useDecks();
  const activeDeckId = selectedDeckId ?? decks.data?.content[0]?.deckId ?? null;

  const [subject, setSubject] = useState('');
  const [goal, setGoal] = useState('');
  const [note, setNote] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordDraft, setKeywordDraft] = useState('');
  const [summary, setSummary] = useState('');
  const [mode, setMode] = useState<Mode>('edit');
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const objectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const now = new Date();
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const today = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(
    now.getDate(),
  ).padStart(2, '0')} (${days[now.getDay()]})`;

  const insert = (snippet: string, wrap?: [string, string]) => {
    const ta = taRef.current;
    if (!ta) {
      setNote((s) => (s ? `${s}\n${snippet}` : snippet));
      return;
    }
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const cur = note;
    let next: string;
    let caret: number;
    if (wrap && e > s) {
      const sel = cur.slice(s, e);
      next = cur.slice(0, s) + wrap[0] + sel + wrap[1] + cur.slice(e);
      caret = e + wrap[0].length + wrap[1].length;
    } else {
      const pre = cur.slice(0, s);
      const needNl = pre && !pre.endsWith('\n') ? '\n' : '';
      next = pre + needNl + snippet + cur.slice(e);
      caret = (pre + needNl + snippet).length;
    }
    setNote(next);
    requestAnimationFrame(() => {
      if (taRef.current) {
        taRef.current.focus();
        taRef.current.setSelectionRange(caret, caret);
      }
    });
  };

  const addKeyword = () => {
    const v = keywordDraft.trim();
    if (!v) return;
    setKeywords((s) => (s.includes(v) ? s : [...s, v]));
    setKeywordDraft('');
  };

  const removeKeyword = (i: number) => {
    setKeywords((s) => s.filter((_, idx) => idx !== i));
  };

  const onKeywordKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  const aiFill = () => {
    const draft = AI_DRAFT(subject.trim());
    setNote(draft);
    setKeywords((s) => (s.length ? s : ['멱등성', '멱등 키']));
    setSummary(
      (s) => s || '멱등 키로 이전 결과를 재사용해, 재시도해도 한 번만 처리되게 한다.',
    );
    setMode('edit');
  };

  const ready =
    subject.trim().length > 0 && note.trim().length > 0 && summary.trim().length > 0;

  const missing: string[] = [];
  if (!subject.trim()) missing.push('제목');
  if (!note.trim()) missing.push('노트');
  if (!summary.trim()) missing.push('요약');

  const onSave = () => {
    if (!ready || !activeDeckId) return;
    create.mutate(
      {
        deckId: activeDeckId,
        summary: summary.trim(),
        mainText: note.trim(),
        keywords: keywords.length > 0 ? keywords : [subject.trim()],
        tags: [],
      },
      {
        onSuccess: () => navigate('/home', { replace: true }),
      },
    );
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhoto = () => {
    fileInputRef.current?.click();
  };

  const onPickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      insertPastedImage(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const insertPastedImage = (file: File) => {
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.push(url);
    const alt = file.name.replace(/\.[^.]+$/, '') || '붙여넣은 이미지';
    insert(`![${alt}](${url})`);
  };

  const onPasteNote = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (item && item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          insertPastedImage(file);
          return;
        }
      }
    }
  };

  return (
    <div className="min-h-[100dvh] bg-canvas text-cream">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onPickFile}
        className="hidden"
        aria-hidden
        tabIndex={-1}
      />
      <div className="sticky top-0 z-30 flex items-center justify-between gap-5 border-b border-edge bg-canvas/85 px-8 py-4 backdrop-blur-md">
        <Link
          to="/home"
          className="inline-flex items-center gap-2 text-[13px] text-cream-faint no-underline transition-colors hover:text-cream"
        >
          <Icon name="solar:alt-arrow-left-linear" width={16} height={16} />
          나가기
        </Link>
        <span className="text-[13px] font-medium text-cream-mute">새 카드</span>
        <div className="flex items-center gap-2.5">
          <span
            className={`text-[12.5px] ${ready ? 'text-sage-ink' : 'text-cream-faint'}`}
          >
            {ready ? '올릴 준비 완료' : missing.length > 0 ? `${missing.join(' · ')} 필요` : ''}
          </span>
          <button
            type="button"
            onClick={onSave}
            disabled={!ready || create.isPending}
            className={`inline-flex items-center gap-2 rounded-full border-0 px-5 py-2.5 text-[13.5px] font-medium transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)] ${
              ready
                ? 'bg-amber text-white shadow-[0_10px_24px_-12px_rgba(196,103,63,0.65)] hover:-translate-y-px hover:bg-amber-deep'
                : 'cursor-not-allowed bg-paper-2 text-cream-faint'
            }`}
          >
            <Icon name="solar:diskette-linear" width={15} height={15} />
            필드에 올리기
          </button>
        </div>
      </div>

      <div
        className="mx-auto w-full max-w-[1000px] px-8 pb-24 pt-8"
        style={{ animation: 'fadeInUp .4s var(--ease-spring) both' }}
      >
        <div className="overflow-hidden rounded-[22px] border border-edge bg-surface shadow-[0_30px_70px_-42px_rgba(33,31,26,0.36)]">
          {/* 1. 제목 */}
          <div className="border-b border-edge bg-paper-2 px-7 py-[22px]">
            <div className="mb-3.5 flex items-center gap-[7px]">
              <span className="font-serif text-[15px] italic text-amber">제목</span>
              <span className="text-[10.5px] uppercase tracking-[0.06em] text-cream-faint">
                과목 · 단원 · 목표
              </span>
            </div>
            <input
              value={subject}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
              placeholder="과목 · 단원 — 예: 분산 시스템 · 멱등성"
              className="mb-2 w-full border-0 bg-transparent font-serif text-[25px] font-semibold tracking-[-0.01em] text-cream caret-amber outline-none placeholder:text-cream-faint"
            />
            <div className="flex flex-wrap items-center gap-4">
              <input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="학습 목표 (선택) — 예: 재시도 안전성 이해"
                className="min-w-[200px] flex-1 border-0 bg-transparent text-sm text-cream-mute caret-amber outline-none placeholder:text-cream-faint"
              />
              <span className="text-xs tabular-nums text-cream-faint">{today}</span>
            </div>
          </div>

          {/* 3 + 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr]">
            {/* 3. 단서영역 */}
            <div className="flex flex-col gap-3.5 border-b border-edge bg-[rgba(243,239,230,0.5)] px-5 py-6 lg:border-b-0 lg:border-r">
              <div className="flex items-center gap-[7px]">
                <span className="font-serif text-[15px] italic text-amber">단서</span>
                <span className="text-[10.5px] uppercase tracking-[0.06em] text-cream-faint">
                  Cue
                </span>
              </div>
              <p className="m-0 text-xs leading-[1.55] text-cream-faint break-keep">
                학습할 때 가려질, 내가 떠올릴 핵심 키워드예요.
              </p>

              <div className="flex flex-col gap-2">
                {keywords.map((k, i) => (
                  <div
                    key={`${k}-${i}`}
                    className="group/k flex items-center gap-2.5 rounded-[11px] border border-amber-line bg-surface px-3 py-2.5"
                  >
                    <span aria-hidden className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber" />
                    <span className="flex-1 text-[13.5px] font-medium text-cream break-keep">
                      {k}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeKeyword(i)}
                      className="grid h-[18px] w-[18px] flex-shrink-0 place-items-center border-0 bg-transparent text-cream-faint opacity-50 transition-opacity hover:text-amber group-hover/k:opacity-100"
                    >
                      <Icon name="solar:close-circle-linear" width={13} height={13} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-[7px] rounded-[11px] border border-dashed border-edge-strong bg-surface px-3 py-2.5">
                <Icon name="solar:add-square-linear" width={14} height={14} className="flex-shrink-0 text-cream-faint" />
                <input
                  value={keywordDraft}
                  onChange={(e) => setKeywordDraft(e.target.value)}
                  onKeyDown={onKeywordKey}
                  placeholder="키워드 추가 · Enter"
                  className="w-full border-0 bg-transparent text-[13px] text-cream caret-amber outline-none placeholder:text-cream-faint"
                />
              </div>
            </div>

            {/* 2. 노트 필기 영역 */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 px-[22px] pt-4">
                <span className="font-serif text-[15px] italic text-cream-faint">노트</span>
                <span className="text-[10.5px] uppercase tracking-[0.06em] text-cream-faint">
                  Material
                </span>
                <div className="ml-auto flex gap-1.5">
                  <button
                    type="button"
                    onClick={aiFill}
                    className="inline-flex items-center gap-1.5 rounded-full border border-edge-strong bg-transparent px-3 py-1.5 text-xs font-medium text-cream-mute transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:border-amber-line hover:bg-amber-soft hover:text-amber-deep"
                  >
                    <Icon name="solar:magic-stick-3-linear" width={13} height={13} />
                    AI로 자료 정리
                  </button>
                  <button
                    type="button"
                    onClick={handlePhoto}
                    className="inline-flex items-center gap-1.5 rounded-full border border-edge-strong bg-transparent px-3 py-1.5 text-xs font-medium text-cream-mute transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:border-amber-line hover:bg-amber-soft hover:text-amber-deep"
                  >
                    <Icon name="solar:gallery-linear" width={13} height={13} />
                    사진
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 px-[22px] pt-3.5 pb-3">
                <div className="flex gap-0.5 rounded-full border border-edge bg-paper-2 p-1">
                  <ModeTab active={mode === 'edit'} onClick={() => setMode('edit')}>
                    편집
                  </ModeTab>
                  <ModeTab active={mode === 'preview'} onClick={() => setMode('preview')}>
                    미리보기
                  </ModeTab>
                </div>
                {mode === 'edit' && (
                  <div className="flex gap-0.5">
                    <ToolButton title="굵게" onClick={() => insert('**굵게**', ['**', '**'])}>
                      <span className="font-serif text-[15px] font-bold">B</span>
                    </ToolButton>
                    <ToolButton title="제목" onClick={() => insert('## 제목')}>
                      <span className="font-serif text-sm font-semibold">H</span>
                    </ToolButton>
                    <ToolButton title="목록" onClick={() => insert('- 항목')}>
                      <Icon name="solar:list-linear" width={16} height={16} />
                    </ToolButton>
                    <ToolButton title="코드" onClick={() => insert('```\n코드\n```')}>
                      <Icon name="solar:code-linear" width={16} height={16} />
                    </ToolButton>
                    <ToolButton title="인용" onClick={() => insert('> 인용')}>
                      <Icon name="solar:quote-up-linear" width={16} height={16} />
                    </ToolButton>
                    <ToolButton title="사진" onClick={handlePhoto}>
                      <Icon name="solar:gallery-linear" width={16} height={16} />
                    </ToolButton>
                  </div>
                )}
              </div>

              <div className="min-h-[340px] px-[22px] pb-6">
                {mode === 'edit' ? (
                  <textarea
                    ref={taRef}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onPaste={onPasteNote}
                    onDragOver={(e) => {
                      if (e.dataTransfer?.types?.includes('Files')) e.preventDefault();
                    }}
                    onDrop={(e) => {
                      const file = e.dataTransfer?.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        e.preventDefault();
                        insertPastedImage(file);
                      }
                    }}
                    placeholder="수업·책의 핵심 내용을 적어요. 마크다운으로 제목(##), 목록(-), 코드(```), 사진(![](url))을 넣을 수 있어요. 클립보드 사진은 그대로 붙여넣기(⌘V) 또는 드래그&드롭으로 추가할 수 있어요."
                    className="min-h-[300px] w-full resize-y border-0 bg-transparent font-mono text-[13.5px] leading-[1.7] text-cream caret-amber outline-none placeholder:text-cream-faint"
                    style={{ fontFamily: "ui-monospace, 'SF Mono', monospace" }}
                  />
                ) : note.trim() ? (
                  <MarkdownView source={note} />
                ) : (
                  <p className="m-0 text-sm text-cream-faint">
                    아직 노트가 비어 있어요. 편집 탭에서 자료를 채워보세요.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 4. 요약 */}
          <div className="border-t border-edge bg-[rgba(243,239,230,0.5)] px-7 py-[22px]">
            <div className="mb-3 flex items-center gap-[7px]">
              <span className="font-serif text-[15px] italic text-amber">요약</span>
              <span className="text-[10.5px] uppercase tracking-[0.06em] text-cream-faint">
                Summary · 내 언어로 한 문장
              </span>
            </div>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="자료의 핵심을 내 언어로 한 문장. 학습할 때 가려졌다가, 떠올린 뒤 펼쳐 확인해요."
              rows={2}
              className="w-full resize-none border-0 bg-transparent font-serif text-[19px] leading-[1.5] text-cream caret-amber outline-none placeholder:text-cream-faint"
            />
          </div>
        </div>

        <p className="m-0 mt-[22px] text-center text-[12.5px] text-cream-faint break-keep">
          노트의 자료는 학습 중 항상 보여요. 단서와 요약은 가려졌다가, 자료를 보고 떠올린 뒤 펼쳐 확인합니다.
        </p>
      </div>
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border-0 px-3.5 py-1.5 text-[12.5px] font-medium transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] ${
        active
          ? 'bg-surface text-cream shadow-[0_1px_3px_rgba(0,0,0,0.1)]'
          : 'bg-transparent text-cream-faint hover:text-cream'
      }`}
    >
      {children}
    </button>
  );
}

function ToolButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="grid h-8 w-8 place-items-center rounded-lg border-0 bg-transparent text-cream-faint transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:bg-paper-2 hover:text-cream"
    >
      {children}
    </button>
  );
}
