import { Link } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { useAxisCards } from '@/features/cards/hooks/useAxisCards';

// Shows the cards a user has made under one learning axis, inside the map's axis
// row. Closes the loop opened by Issue 4 (cards now land in an axis) — Issue 5.
export function AxisCardsPanel({ axisId }: { axisId: string }) {
  const cards = useAxisCards(axisId);

  if (cards.isLoading) {
    return (
      <p className="mt-3 text-[12px] text-cream-faint">이 축의 카드를 불러오는 중…</p>
    );
  }

  if (cards.isError) {
    return (
      <p className="mt-3 text-[12px] text-cream-faint">카드를 불러오지 못했어요.</p>
    );
  }

  const list = cards.data ?? [];

  return (
    <div className="mt-4 border-t border-edge pt-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
          이 축의 카드 · {list.length}
        </span>
        <Link
          to="/cards/new"
          className="inline-flex items-center gap-1 text-[12px] text-cream-faint no-underline transition-colors hover:text-amber"
        >
          <Icon name="solar:add-square-linear" width={13} height={13} />
          새 카드
        </Link>
      </div>

      {list.length === 0 ? (
        <p className="text-[12.5px] text-cream-faint break-keep">
          이 축에 올린 카드가 아직 없어요. 새 카드를 만들어 이 축에 쌓아보세요.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {list.map((c) => (
            <li
              key={c.cardId}
              className="flex items-center gap-2.5 rounded-[10px] border border-edge bg-canvas px-3 py-2"
            >
              <span
                className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  c.status === 'ON_FIELD'
                    ? 'bg-amber-soft text-amber-deep'
                    : 'bg-paper-2 text-cream-mute'
                }`}
              >
                {c.status === 'ON_FIELD' ? '필드' : '보관'}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] text-cream">
                {c.summary}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
