import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Dialog } from '@/components/Dialog';
import { Icon } from '@/components/Icon';
import { ApiError } from '@/lib/api/client';
import type { DeckSummary } from '@/lib/api/schemas/deck';
import { useDecks } from './hooks/useDecks';
import { useDeleteDeck } from './hooks/useDeleteDeck';
import { DeckItem } from './components/DeckItem';
import { CreateDeckDialog } from './components/CreateDeckDialog';
import { RenameDeckDialog } from './components/RenameDeckDialog';
import { MoveDeckDialog } from './components/MoveDeckDialog';
import { DeckDeprecatedBanner } from './components/DeckDeprecatedBanner';

interface DeleteTarget {
  deckId: string;
  name: string;
}

interface MoveTarget {
  deckId: string;
  name: string;
  parentDeckId: string | null;
}

export function DecksPage() {
  const decks = useDecks();
  const deleteDeck = useDeleteDeck();

  const [createOpen, setCreateOpen] = useState(false);
  const [createParent, setCreateParent] = useState<{ id: string; name: string } | null>(null);

  const [renameTarget, setRenameTarget] = useState<{ deckId: string; name: string } | null>(null);
  const [moveTarget, setMoveTarget] = useState<MoveTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openCreateRoot = () => {
    setCreateParent(null);
    setCreateOpen(true);
  };

  const openCreateSub = (deck: DeckSummary) => {
    setCreateParent({ id: deck.deckId, name: deck.name });
    setCreateOpen(true);
  };

  const openMove = (deck: DeckSummary, parentDeckId: string | null) => {
    setMoveTarget({ deckId: deck.deckId, name: deck.name, parentDeckId });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    deleteDeck.mutate(deleteTarget.deckId, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => {
        setDeleteError(err instanceof ApiError ? err.message : '삭제에 실패했어요.');
      },
    });
  };

  const roots = decks.data?.content ?? [];

  const topbar = (
    <>
      <div className="flex items-center gap-2.5 text-[13px] text-cream-faint">
        <span>나의 자료</span>
        <span className="opacity-50">/</span>
        <span className="font-medium text-cream-mute">덱 관리</span>
      </div>
      <button
        type="button"
        onClick={openCreateRoot}
        className="inline-flex items-center gap-2 rounded-full border-0 bg-amber px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-amber-deep"
      >
        <Icon name="solar:add-folder-linear" width={15} height={15} />
        새 덱
      </button>
    </>
  );

  return (
    <AppShell topbar={topbar}>
      <DeckDeprecatedBanner />
      <div className="mb-7">
        <h1 className="m-0 mb-2 font-serif text-[32px] font-medium leading-none tracking-[-0.02em] text-cream">
          덱 관리
        </h1>
        <p className="m-0 text-[13.5px] text-cream-mute">
          카드를 묶어두는 상자예요. 주제별로 모으고, 나눠두면 다시 꺼낼 때 빨라요.
        </p>
      </div>

      {decks.isLoading ? (
        <div className="rounded-[18px] border border-edge bg-surface p-10 text-center text-[13px] text-cream-faint">
          덱을 불러오는 중…
        </div>
      ) : decks.isError ? (
        <div className="rounded-[18px] border border-edge bg-surface p-10 text-center text-[13px] text-amber-deep">
          덱 목록을 불러오지 못했어요.
        </div>
      ) : roots.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-edge-strong bg-surface p-12 text-center">
          <p className="m-0 mb-1.5 font-serif text-lg text-cream">아직 덱이 없어요.</p>
          <p className="m-0 mb-5 text-[13px] text-cream-mute">
            첫 덱을 만들어 카드를 한곳에 모아볼까요?
          </p>
          <button
            type="button"
            onClick={openCreateRoot}
            className="inline-flex items-center gap-2 rounded-full border-0 bg-amber px-4 py-2.5 text-[13px] font-medium text-white hover:bg-amber-deep"
          >
            <Icon name="solar:add-folder-linear" width={15} height={15} />
            첫 덱 만들기
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {roots.map((deck) => (
            <DeckItem
              key={deck.deckId}
              deck={deck}
              parentDeckId={null}
              depth={0}
              onRename={(d) => setRenameTarget({ deckId: d.deckId, name: d.name })}
              onAddSub={openCreateSub}
              onMove={openMove}
              onDelete={(d) => {
                setDeleteError(null);
                setDeleteTarget({ deckId: d.deckId, name: d.name });
              }}
            />
          ))}
        </div>
      )}

      <CreateDeckDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        parentDeckId={createParent?.id ?? null}
        parentName={createParent?.name ?? null}
      />

      <RenameDeckDialog
        open={renameTarget !== null}
        onClose={() => setRenameTarget(null)}
        deckId={renameTarget?.deckId ?? null}
        initialName={renameTarget?.name ?? ''}
      />

      <MoveDeckDialog
        open={moveTarget !== null}
        onClose={() => setMoveTarget(null)}
        deckId={moveTarget?.deckId ?? null}
        deckName={moveTarget?.name ?? ''}
        currentParentId={moveTarget?.parentDeckId ?? null}
      />

      <Dialog
        open={deleteTarget !== null}
        onClose={() => {
          if (!deleteDeck.isPending) setDeleteTarget(null);
        }}
        title={`'${deleteTarget?.name ?? ''}' 삭제`}
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteDeck.isPending}
              className="rounded-full border border-edge-strong bg-transparent px-4 py-2 text-[13px] font-medium text-cream-mute transition-colors hover:bg-paper-2 hover:text-cream disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deleteDeck.isPending}
              className="rounded-full border-0 bg-amber-deep px-4 py-2 text-[13px] font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {deleteDeck.isPending ? '삭제 중…' : '삭제'}
            </button>
          </>
        }
      >
        <p className="m-0 text-[14px] leading-[1.6] text-cream-mute break-keep">
          이 덱과 <span className="font-semibold text-cream">하위 덱의 카드가 모두 삭제</span>됩니다. 이
          작업은 되돌릴 수 없어요.
        </p>
        {deleteError && (
          <p role="alert" className="m-0 mt-3 text-sm text-amber-deep">
            {deleteError}
          </p>
        )}
      </Dialog>
    </AppShell>
  );
}
