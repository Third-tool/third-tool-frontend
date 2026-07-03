// product-learning-tower Epic 3 Story 3-2 (M4 · 2026-07-15+).
// AxisDetailPage Cards 탭 shell.
// BE PR#4 (LT-E4-CARD-AXIS) 배선 후 `card.axis_id` 응답 소비 예정.
// M4 shell 단계 · 실 리스트 렌더는 M5+ 예정.
interface Props {
  axisId: string;
}

export function CardsAxisShell({ axisId }: Props) {
  return (
    <section
      aria-label="이 축의 카드"
      className="rounded-[14px] border border-dashed border-edge px-5 py-6 text-center"
    >
      <p className="m-0 text-sm text-cream-mute break-keep">
        이 축에 연결된 카드 목록이 여기에 표시돼요.
      </p>
      <p className="m-0 mt-2 text-xs text-cream-faint break-keep">
        BE `card.axis_id` 직접 매핑(LT-E4-CARD-AXIS) 배선 후 활성화 예정입니다.
      </p>
      <p className="m-0 mt-3 font-mono text-[11px] text-cream-faint">
        axisId: <span className="text-cream-mute">{axisId}</span>
      </p>
    </section>
  );
}
