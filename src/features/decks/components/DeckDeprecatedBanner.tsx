import { Link } from 'react-router-dom';
import { Icon } from '@/components/Icon';

// product-deck (FE) · 🚨 SUPERSEDED (2026-07-22+).
// M5 신설: Deck 라우트 폐기 배너 · /decks · /decks/:deckId 진입 시 상단 자동 렌더.
// BE PR#1 (LT-E5-DECK-ABOLISH) 대응 · Axis로 이관 안내.
// v2 이관 · 이 파일 자체가 v0.1.0v 릴리스 이후 물리 삭제 예정 (M5 PR#5 계획).
export function DeckDeprecatedBanner() {
  return (
    <div
      role="status"
      aria-label="Deck 폐기 안내"
      className="mb-6 flex flex-col gap-2 rounded-[14px] border border-amber-line bg-amber-soft px-5 py-4 md:flex-row md:items-center md:justify-between"
    >
      <div className="flex items-start gap-3">
        <Icon
          name="solar:info-circle-linear"
          width={20}
          height={20}
          className="mt-0.5 shrink-0 text-amber-deep"
        />
        <div className="flex flex-col gap-1">
          <p className="m-0 text-sm font-semibold text-amber-deep">
            Deck 개념은 폐기되었어요
          </p>
          <p className="m-0 text-xs text-cream-mute break-keep">
            카드는 이제 <span className="font-semibold">Axis</span>에 직접 매핑됩니다. 지도에서 축을 클릭해 상세로 이동하세요.
          </p>
        </div>
      </div>
      <Link
        to="/map"
        className="inline-flex items-center gap-1.5 self-start rounded-full border-0 bg-amber px-4 py-2 text-xs font-medium text-white no-underline transition-colors hover:bg-amber-deep md:self-auto"
      >
        지도로 이동
        <Icon name="solar:alt-arrow-right-linear" width={13} height={13} />
      </Link>
    </div>
  );
}
