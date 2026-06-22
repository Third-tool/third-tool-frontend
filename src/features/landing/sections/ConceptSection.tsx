import { useState } from 'react';
import { useFadeUp } from '@/lib/motion/useFadeUp';

interface CycleRow {
  day: string;
  title: string;
  caption: string;
  badge: string;
  meta: string;
  detailTitle: string;
  body: string;
  tone: 'clay' | 'sage';
}

const CYCLE_DATA: CycleRow[] = [
  {
    day: '1',
    title: '필드에 올리기',
    caption: '오늘 만난 한 문장을 카드로',
    badge: 'DAY 1',
    meta: '첫 만남',
    detailTitle: '"멱등성 — 같은 요청을 여러 번 보내도 결과는 한 번과 같다."',
    body: '오늘 읽은 한 문장을 카드 한 장으로 남겨요. 키워드 하나와 태그면 충분합니다. 이 카드는 오늘부터 필드 위에 올라가요.',
    tone: 'clay',
  },
  {
    day: '3',
    title: '다시 만나기',
    caption: '잊을 만하면 한 번 더',
    badge: 'DAY 3',
    meta: '두 번째 노출',
    detailTitle: '"이틀 뒤, 같은 카드가 조용히 돌아옵니다."',
    body: '정답을 맞히는 시험이 아니에요. 머릿속에 한 번 떠올려 보고 넘어가면, 그 만남이 기억을 한 겹 더 단단하게 만들어요.',
    tone: 'clay',
  },
  {
    day: '7',
    title: '배경으로 쉬게',
    caption: '충분히 만난 카드는 보관함으로',
    badge: 'DAY 7',
    meta: '마스터',
    detailTitle: '"충분히 만난 카드는 잠시 쉬러 보관함으로."',
    body: '다섯 번을 넘기면 카드는 배경 지식으로 옮겨 쉬어요. 사라지는 게 아니라, 잊을 만하면 다시 곁으로 돌아옵니다.',
    tone: 'sage',
  },
];

export function ConceptSection() {
  const [cycle, setCycle] = useState(0);
  const eyebrowRef = useFadeUp<HTMLDivElement>();
  const titleRef = useFadeUp<HTMLHeadingElement>();
  const bodyRef = useFadeUp<HTMLDivElement>();
  const statsRef = useFadeUp<HTMLDivElement>();
  const diagramRef = useFadeUp<HTMLDivElement>();
  const detail = CYCLE_DATA[cycle]!;
  const isSage = detail.tone === 'sage';

  return (
    <section id="concept" className="relative px-7 py-[120px]">
      <div className="mx-auto w-full max-w-[1180px]">
        <div ref={eyebrowRef} className="mb-[22px] flex items-center gap-3">
          <span className="font-serif text-[19px] italic text-amber">02</span>
          <span className="text-xs uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
            The Workbench
          </span>
          <span aria-hidden className="h-px w-[120px] bg-edge" />
        </div>

        <div className="grid items-start gap-[72px] lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2
              ref={titleRef}
              className="mb-7 font-serif text-[46px] font-medium leading-[1.12] tracking-[-0.02em] text-cream break-keep"
            >
              학습은 실패가 아니라{' '}
              <span className="italic text-amber">순환</span>입니다.
            </h2>

            <div
              ref={bodyRef}
              className="flex max-w-[54ch] flex-col gap-[18px] text-[17px] leading-[1.75] text-cream-mute break-keep"
            >
              <p className="m-0">
                머릿속에 한 번 들어왔다고 끝나는 지식은 없습니다. 우리는 카드 한 장 한 장을{' '}
                <span className="font-medium text-cream">필드</span>에 올려두고, 충분히 만났다고
                느끼면 <span className="font-medium text-cream">배경 지식</span>으로 옮겨 잠시
                쉬게 합니다.
              </p>
              <p className="m-0">
                잊는 것은 실패가 아닙니다. 다시 만나는 일이고, 그 만남이 더 깊은 이해를 만듭니다.
                그래서 우리는 "외운다"는 말 대신{' '}
                <span className="font-medium text-cream">순환</span>이라는 말을 씁니다.
              </p>
            </div>

            <div ref={statsRef} className="mt-11 flex gap-0">
              <div className="pr-8">
                <div className="font-serif text-[42px] font-medium leading-none text-cream">4</div>
                <div className="mt-2 text-[12.5px] text-cream-faint">Bounded Contexts</div>
              </div>
              <div className="border-l border-edge px-8">
                <div className="font-serif text-[42px] font-medium leading-none text-cream">
                  1·3·7
                  <span className="text-[18px] text-cream-faint">일</span>
                </div>
                <div className="mt-2 text-[12.5px] text-cream-faint">Soft Schedule</div>
              </div>
              <div className="border-l border-edge px-8">
                <div className="font-serif text-[42px] font-medium leading-none text-amber">
                  47,200<span className="text-[18px]">+</span>
                </div>
                <div className="mt-2 text-[12.5px] text-cream-faint">함께 펼친 카드</div>
              </div>
            </div>
          </div>

          <div
            ref={diagramRef}
            className="relative rounded-3xl border border-edge bg-surface p-9"
          >
            <div className="mb-6 text-xs uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
              하나의 카드가 도는 길
            </div>
            <div className="-mx-3.5 flex flex-col">
              {CYCLE_DATA.map((row, i) => {
                const active = i === cycle;
                const sage = row.tone === 'sage';
                return (
                  <div
                    key={row.day}
                    onMouseEnter={() => setCycle(i)}
                    onClick={() => setCycle(i)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setCycle(i);
                    }}
                    className={`group flex cursor-pointer items-center gap-4 rounded-[12px] px-3.5 py-4 transition-colors ${
                      i < CYCLE_DATA.length - 1 ? 'border-b border-edge' : ''
                    } ${active ? 'bg-paper-2' : ''}`}
                  >
                    <span
                      className={`grid h-[38px] w-[38px] flex-shrink-0 place-items-center rounded-full font-serif text-base italic transition-all ${
                        active
                          ? sage
                            ? 'bg-sage text-white'
                            : 'bg-amber text-white'
                          : sage
                            ? 'bg-sage-soft text-sage-ink'
                            : 'bg-amber-soft text-amber-deep'
                      }`}
                    >
                      {row.day}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-serif text-lg font-medium text-cream">{row.title}</div>
                      <div className="text-[13px] text-cream-faint">{row.caption}</div>
                    </div>
                    <span
                      className={`flex-shrink-0 text-amber transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`}
                      aria-hidden
                    >
                      ›
                    </span>
                  </div>
                );
              })}
            </div>
            <div
              className={`mt-5 rounded-[16px] border p-[22px] transition-colors duration-300 ${
                isSage ? 'border-[rgba(125,148,114,0.3)] bg-sage-soft' : 'border-amber-line bg-amber-soft'
              }`}
            >
              <div className="mb-3 flex items-center gap-2.5">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold text-white ${
                    isSage ? 'bg-sage' : 'bg-amber'
                  }`}
                >
                  {detail.badge}
                </span>
                <span className="text-xs text-cream-faint">{detail.meta}</span>
              </div>
              <p className="m-0 mb-2 font-serif text-[19px] font-medium leading-[1.4] text-cream break-keep">
                {detail.detailTitle}
              </p>
              <p className="m-0 text-sm leading-[1.6] text-cream-mute break-keep">{detail.body}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
