import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Dialog } from '@/components/Dialog';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { Skeleton } from '@/components/Skeleton';
import { ApiError } from '@/lib/api/client';
import { toastStore } from '@/lib/toast/toastQueue';
import { useCard } from './hooks/useCard';
import { useReturnToField } from './hooks/useReturnToField';
import { useArchiveCard } from './hooks/useArchiveCard';
import { useAddCardTag } from './hooks/useAddCardTag';
import { useRemoveCardTag } from './hooks/useRemoveCardTag';
import { useAddCardKeyword } from './hooks/useAddCardKeyword';
import { useRemoveCardKeyword } from './hooks/useRemoveCardKeyword';
import { useUpdateCardSummary } from './hooks/useUpdateCardSummary';
import { useDeleteCard } from './hooks/useDeleteCard';
import { CardScheduleBadge } from './components/CardScheduleBadge';
import { ArchiveReasonBadge } from './components/ArchiveReasonBadge';
import { UpcomingExposureIndicator } from './components/UpcomingExposureIndicator';
import { ReturnToFieldConfirmDialog } from './components/ReturnToFieldConfirmDialog';
import { useMySchedule } from '@/features/schedule/hooks/useMySchedule';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d
    .getDate()
    .toString()
    .padStart(2, '0')}`;
}

export function CardDetailPage() {
  const { cardId } = useParams<{ cardId: string }>();
  const navigate = useNavigate();

  const { data: card, isLoading, isError, error } = useCard(cardId);
  const ret = useReturnToField();
  const archive = useArchiveCard();
  const addTag = useAddCardTag(cardId ?? '');
  const removeTag = useRemoveCardTag(cardId ?? '');
  const addKeyword = useAddCardKeyword(cardId ?? '');
  const removeKeyword = useRemoveCardKeyword(cardId ?? '');
  const updateSummary = useUpdateCardSummary(cardId ?? '');
  const deleteCardMut = useDeleteCard(cardId ?? '');

  const [tagDraft, setTagDraft] = useState('');
  const [tagError, setTagError] = useState<string | null>(null);
  const [keywordDraft, setKeywordDraft] = useState('');
  const [keywordError, setKeywordError] = useState<string | null>(null);
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState('');
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // M4 Epic 3 Story 3-2: 필드 복귀 확인 게이트.
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const schedule = useMySchedule();
  const summaryRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingSummary) summaryRef.current?.focus();
  }, [editingSummary]);

  const isNotFound = isError && error instanceof ApiError && error.code === 'CARD_NOT_FOUND';

  const submitTag = () => {
    if (!card) return;
    const value = tagDraft.trim();
    if (!value) return;
    setTagError(null);
    addTag.mutate(value, {
      onSuccess: () => setTagDraft(''),
      onError: (err) => {
        if (err instanceof ApiError) {
          if (err.code === 'CARD_TAG_ALREADY_EXISTS') {
            setTagError('이미 있는 태그예요');
            return;
          }
          if (err.code === 'CARD_TAG_LIMIT_EXCEEDED') {
            setTagError('태그는 최대 3개까지');
            return;
          }
          setTagError(err.message);
          return;
        }
        setTagError('태그 추가에 실패했어요.');
      },
    });
  };

  const onTagKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitTag();
    }
  };

  const handleRemoveTag = (tagId: string) => {
    setTagError(null);
    removeTag.mutate(tagId, {
      onError: (err) => {
        const msg = err instanceof ApiError ? err.message : '태그 삭제에 실패했어요.';
        toastStore.push({ message: msg, tone: 'amber' });
      },
    });
  };

  const submitKeyword = () => {
    if (!card) return;
    const value = keywordDraft.trim();
    if (!value) return;
    setKeywordError(null);
    addKeyword.mutate(value, {
      onSuccess: () => setKeywordDraft(''),
      onError: (err) => {
        if (err instanceof ApiError) {
          if (err.code === 'CARD_KEYWORD_DUPLICATE') {
            setKeywordError('이미 있는 키워드예요');
            return;
          }
          if (err.code === 'CARD_KEYWORD_BLANK') {
            setKeywordError('키워드를 입력해주세요');
            return;
          }
          setKeywordError(err.message);
          return;
        }
        setKeywordError('키워드 추가에 실패했어요.');
      },
    });
  };

  const onKeywordKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitKeyword();
    }
  };

  const handleRemoveKeyword = (keywordId: string) => {
    if (!card) return;
    setKeywordError(null);
    if (card.keywords.length <= 1) {
      setKeywordError('마지막 키워드는 지울 수 없어요');
      return;
    }
    removeKeyword.mutate(keywordId, {
      onError: (err) => {
        if (err instanceof ApiError && err.code === 'CARD033') {
          setKeywordError('마지막 키워드는 지울 수 없어요');
          return;
        }
        const msg = err instanceof ApiError ? err.message : '키워드 삭제에 실패했어요.';
        toastStore.push({ message: msg, tone: 'amber' });
      },
    });
  };

  const startEditSummary = () => {
    if (!card) return;
    setSummaryDraft(card.summary);
    setSummaryError(null);
    setEditingSummary(true);
  };

  const cancelEditSummary = () => {
    setEditingSummary(false);
    setSummaryError(null);
  };

  const commitSummary = () => {
    if (!card) return;
    const next = summaryDraft.trim();
    if (!next) {
      setSummaryError('요약은 비울 수 없어요.');
      return;
    }
    if (next === card.summary) {
      setEditingSummary(false);
      return;
    }
    updateSummary.mutate(next, {
      onSuccess: () => {
        setEditingSummary(false);
        toastStore.push({ message: '요약을 저장했어요.', tone: 'cream' });
      },
      onError: (err) => {
        setSummaryError(err instanceof ApiError ? err.message : '저장에 실패했어요.');
      },
    });
  };

  const onSummaryKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      commitSummary();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditSummary();
    }
  };

  const handleArchive = () => {
    if (!card) return;
    archive.mutate(card.cardId, {
      onSuccess: () => navigate('/archive'),
      onError: (err) => {
        const msg = err instanceof ApiError ? err.message : '보관에 실패했어요.';
        toastStore.push({ message: msg, tone: 'amber' });
      },
    });
  };

  const openReturnDialog = () => {
    if (!card) return;
    setReturnDialogOpen(true);
  };

  const commitReturn = () => {
    if (!card) return;
    ret.mutate(card.cardId, {
      onSuccess: () => {
        setReturnDialogOpen(false);
        navigate('/home');
      },
      onError: (err) => {
        setReturnDialogOpen(false);
        const msg = err instanceof ApiError ? err.message : '되돌리기에 실패했어요.';
        toastStore.push({ message: msg, tone: 'amber' });
      },
    });
  };

  const performDelete = () => {
    if (!card) return;
    setDeleteError(null);
    deleteCardMut.mutate(undefined, {
      onSuccess: () => {
        toastStore.push({ message: '카드를 삭제했어요.', tone: 'cream' });
        navigate('/archive');
      },
      onError: (err) => {
        setDeleteError(err instanceof ApiError ? err.message : '삭제에 실패했어요.');
      },
    });
  };

  const topbar = (
    <>
      <div className="flex items-center gap-2.5 text-[13px] text-cream-faint">
        <Link to="/archive" className="no-underline transition-colors hover:text-amber">
          보관함
        </Link>
        <span className="opacity-50">/</span>
        <span className="font-medium text-cream-mute">카드</span>
      </div>
      <Link
        to="/archive"
        className="inline-flex items-center gap-2 rounded-full border border-edge-strong bg-transparent px-4 py-2.5 text-[13px] font-medium text-cream-mute no-underline transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:bg-paper-2 hover:text-cream"
      >
        <Icon name="solar:alt-arrow-left-linear" width={15} height={15} />
        보관함으로
      </Link>
    </>
  );

  return (
    <AppShell topbar={topbar}>
      {isLoading && (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-20 w-2/3" />
          <Skeleton className="h-40" />
        </div>
      )}

      {isError && !isNotFound && (
        <EmptyState
          name="card_detail_error"
          title="지금 길이 막혀있어요"
          body="잠시 후 다시 이어가주세요."
        />
      )}

      {isNotFound && (
        <EmptyState
          name="card_not_found"
          title="이 카드는 찾을 수 없어요"
          body="다른 카드를 고르러 보관함으로 돌아가볼까요?"
          action={
            <Link
              to="/archive"
              className="rounded-full bg-amber px-5 py-2.5 text-sm font-medium text-white no-underline shadow-[0_10px_24px_-12px_rgba(196,103,63,0.65)] hover:bg-amber-deep"
            >
              보관함으로
            </Link>
          }
        />
      )}

      {card && (
        <article
          className="rounded-[20px] border border-edge bg-surface p-9"
          style={{ animation: 'fadeInUp .45s var(--ease-spring) both' }}
        >
          <div className="mb-7 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs text-sage-ink">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sage" />
              {card.status === 'ARCHIVE' ? '참조 보관' : '필드'}
            </span>
            {card.effectiveMax && (
              <CardScheduleBadge
                createdMode={card.createdMode ?? null}
                effectiveMax={card.effectiveMax}
              />
            )}
            {card.status === 'ON_FIELD' && card.effectiveMax && (
              <UpcomingExposureIndicator
                viewCount={card.viewCount}
                createdMode={card.createdMode ?? null}
                effectiveMax={card.effectiveMax}
              />
            )}
            {card.status === 'ARCHIVE' && card.archiveReason && (
              <ArchiveReasonBadge reason={card.archiveReason} />
            )}
            <span className="ml-auto text-xs text-cream-faint">
              {formatDate(card.enteredFieldAt)} {card.status === 'ARCHIVE' ? '보관' : '진입'}
            </span>
          </div>

          {editingSummary ? (
            <div className="mb-9">
              <textarea
                ref={summaryRef}
                value={summaryDraft}
                onChange={(e) => setSummaryDraft(e.target.value)}
                onBlur={commitSummary}
                onKeyDown={onSummaryKey}
                rows={3}
                className="w-full resize-none rounded-[12px] border border-amber-line bg-surface p-4 font-serif text-[32px] font-medium leading-[1.25] tracking-[-0.02em] text-cream caret-amber outline-none focus:shadow-[0_0_0_3px_var(--color-amber-soft)]"
              />
              <div className="mt-2 flex items-center gap-3 text-[12px] text-cream-faint">
                <span>Ctrl + Enter 저장 · Esc 취소</span>
                {updateSummary.isPending && <span>저장 중…</span>}
                {summaryError && (
                  <span role="alert" className="text-amber-deep">
                    {summaryError}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <h1
              onClick={startEditSummary}
              title="클릭해서 수정"
              className="m-0 mb-9 cursor-text font-serif text-[42px] font-medium leading-[1.18] tracking-[-0.02em] text-cream break-keep hover:text-amber"
            >
              {card.summary}
            </h1>
          )}

          <div className="grid gap-9 lg:grid-cols-[1fr_2fr]">
            <div className="flex flex-col gap-7 border-t border-edge pt-7 lg:border-r lg:border-t-0 lg:pr-7 lg:pt-0">
              <Meta label="Cycle" value={`${card.viewCount} / 5`} />
              <Meta label="Status" value={card.status === 'ARCHIVE' ? '참조 보관' : '필드'} />
              <Meta label="Entered" value={formatDate(card.enteredFieldAt)} />
            </div>
            <div>
              <div className="mt-1 border-t border-edge pt-7">
                <span className="mb-3.5 block text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
                  Keywords
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {card.keywords.map((kw) => {
                    const isLast = card.keywords.length <= 1;
                    return (
                      <span
                        key={kw.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-paper-2 px-3 py-1 text-xs text-cream-mute"
                      >
                        {kw.value}
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(kw.id)}
                          disabled={isLast || removeKeyword.isPending}
                          aria-label={`${kw.value} 키워드 삭제`}
                          title={isLast ? '마지막 키워드는 지울 수 없어요' : '삭제'}
                          className="grid h-4 w-4 place-items-center rounded-full text-cream-faint transition-colors hover:bg-edge hover:text-cream disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-cream-faint"
                        >
                          <Icon name="solar:close-circle-linear" width={12} height={12} />
                        </button>
                      </span>
                    );
                  })}
                  <input
                    value={keywordDraft}
                    onChange={(e) => {
                      setKeywordDraft(e.target.value);
                      if (keywordError) setKeywordError(null);
                    }}
                    onKeyDown={onKeywordKey}
                    disabled={addKeyword.isPending}
                    placeholder="+ 키워드 추가 · Enter"
                    className="min-w-[180px] rounded-full border border-dashed border-edge-strong bg-transparent px-3 py-1 text-xs text-cream caret-amber outline-none placeholder:text-cream-faint focus:border-amber-line"
                  />
                </div>
                {keywordError && (
                  <p role="alert" className="m-0 mt-2 text-xs text-amber-deep">
                    {keywordError}
                  </p>
                )}
              </div>

              <div className="mt-7 border-t border-edge pt-7">
                <span className="mb-3.5 block text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
                  Tags
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {card.tags.map((t) => (
                    <span
                      key={t.tagId}
                      className="inline-flex items-center gap-1.5 rounded-full bg-amber-soft px-3 py-1 text-xs font-medium text-amber-deep"
                    >
                      <Link
                        to={`/tags/${t.tagId}`}
                        className="text-amber-deep no-underline hover:underline"
                      >
                        {t.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t.tagId)}
                        disabled={removeTag.isPending}
                        aria-label={`${t.name} 태그 삭제`}
                        className="grid h-4 w-4 place-items-center rounded-full text-amber-deep transition-colors hover:bg-amber-line disabled:opacity-50"
                      >
                        <Icon name="solar:close-circle-linear" width={12} height={12} />
                      </button>
                    </span>
                  ))}
                  {card.tags.length < 3 && (
                    <input
                      value={tagDraft}
                      onChange={(e) => {
                        setTagDraft(e.target.value);
                        if (tagError) setTagError(null);
                      }}
                      onKeyDown={onTagKey}
                      disabled={addTag.isPending}
                      placeholder="+ 태그 추가 · Enter"
                      className="min-w-[160px] rounded-full border border-dashed border-edge-strong bg-transparent px-3 py-1 text-xs text-cream caret-amber outline-none placeholder:text-cream-faint focus:border-amber-line"
                    />
                  )}
                </div>
                {tagError && (
                  <p role="alert" className="m-0 mt-2 text-xs text-amber-deep">
                    {tagError}
                  </p>
                )}
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                {card.status === 'ON_FIELD' && (
                  <button
                    type="button"
                    onClick={handleArchive}
                    disabled={archive.isPending}
                    className="inline-flex items-center gap-2.5 rounded-full bg-amber px-6 py-3 text-[14px] font-medium text-white shadow-[0_10px_24px_-12px_rgba(196,103,63,0.65)] transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)] hover:-translate-y-px hover:bg-amber-deep disabled:opacity-50"
                  >
                    <Icon name="solar:archive-down-linear" width={15} height={15} />
                    {archive.isPending ? '보관 중…' : '보관하기'}
                  </button>
                )}
                {card.status === 'ARCHIVE' && (
                  <button
                    type="button"
                    onClick={openReturnDialog}
                    disabled={ret.isPending}
                    className="group inline-flex items-center gap-3 rounded-full bg-amber py-3 pl-6 pr-4 text-[14px] font-medium text-white shadow-[0_10px_24px_-12px_rgba(196,103,63,0.65)] transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)] hover:-translate-y-px hover:bg-amber-deep disabled:opacity-50"
                  >
                    이 카드로 다시 이어가기 · 새 사이클
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-white/20 transition-transform duration-[var(--dur-base)] ease-[var(--ease-spring)] group-hover:translate-x-0.5">
                      <Icon name="solar:refresh-linear" width={14} height={14} />
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    setConfirmDeleteOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-edge-strong bg-transparent px-5 py-2.5 text-[13px] font-medium text-cream-mute transition-colors hover:border-[rgba(180,69,58,0.4)] hover:text-[#b4453a]"
                >
                  <Icon name="solar:trash-bin-trash-linear" width={14} height={14} />
                  카드 삭제
                </button>
              </div>
            </div>
          </div>
        </article>
      )}

      <Dialog
        open={confirmDeleteOpen}
        onClose={() => {
          if (!deleteCardMut.isPending) {
            setConfirmDeleteOpen(false);
            setDeleteError(null);
          }
        }}
        title="카드 삭제"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setConfirmDeleteOpen(false);
                setDeleteError(null);
              }}
              disabled={deleteCardMut.isPending}
              className="rounded-full border border-edge-strong bg-transparent px-4 py-2 text-[13px] font-medium text-cream-mute transition-colors hover:bg-paper-2 hover:text-cream disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={performDelete}
              disabled={deleteCardMut.isPending}
              className="rounded-full border-0 bg-amber-deep px-4 py-2 text-[13px] font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {deleteCardMut.isPending ? '삭제 중…' : '삭제'}
            </button>
          </>
        }
      >
        <p className="m-0 text-[14px] leading-[1.6] text-cream-mute break-keep">
          이 카드를 <span className="font-semibold text-cream">완전히 삭제</span>합니다. 되돌릴 수
          없어요.
        </p>
        {deleteError && (
          <p role="alert" className="m-0 mt-3 text-sm text-amber-deep">
            {deleteError}
          </p>
        )}
      </Dialog>

      {card && schedule.data?.schedule.mappedMode && (
        <ReturnToFieldConfirmDialog
          open={returnDialogOpen}
          onClose={() => setReturnDialogOpen(false)}
          onConfirm={commitReturn}
          previousCreatedMode={card.createdMode ?? null}
          currentUserMode={schedule.data.schedule.mappedMode}
          isPending={ret.isPending}
        />
      )}
    </AppShell>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="mb-1.5 block text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
        {label}
      </span>
      <p className="m-0 font-serif text-lg text-cream">{value}</p>
    </div>
  );
}
