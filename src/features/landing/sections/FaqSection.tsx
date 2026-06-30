import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { useFadeUp } from '@/lib/motion/useFadeUp';

interface Faq {
  q: string;
  a: string;
}

const FAQS: Faq[] = [
  {
    q: '정말 무료인가요?',
    a: '네. 카드 쓰기, 1·3·7 순환, 학습 지도, 보관함 등 핵심 기능은 모두 무료로 쓸 수 있어요. 나중에 팀·고급 기능이 생기더라도, 혼자 공부하는 데 필요한 건 계속 무료입니다.',
  },
  {
    q: '제 학습 데이터는 어떻게 다뤄지나요?',
    a: '당신의 카드와 지도는 당신의 것이에요. 광고를 위해 팔지 않고, 언제든 전체를 내보내거나 완전히 삭제할 수 있어요. 학습을 돕는 것 외의 목적으로 쓰지 않습니다.',
  },
  {
    q: '하루에 얼마나 시간을 써야 하나요?',
    a: '정해진 할당량은 없어요. 오늘의 순환이 그날 만날 카드만 골라주기 때문에, 5분이든 30분이든 당신 페이스로. 며칠 쉬어도 카드가 알아서 다시 찾아옵니다.',
  },
  {
    q: '다른 암기 앱과 뭐가 다른가요?',
    a: '"외운다"가 아니라 "순환한다"는 관점이에요. 카드를 점수로 채점하는 대신, 충분히 만난 카드를 배경으로 쉬게 하고 — 그 과정이 "내가 어떤 사람이 되어가는가"라는 학습 지도로 이어집니다.',
  },
  {
    q: '중간에 그만두면 기록이 사라지나요?',
    a: '아니요. 모든 카드와 지도는 그대로 보관돼요. 언제 돌아와도 당신이 멈춘 그 자리에서, 쉬고 있던 카드들이 다시 곁으로 돌아옵니다.',
  },
];

export function FaqSection() {
  const [open, setOpen] = useState(0);
  const ref = useFadeUp<HTMLDivElement>();

  return (
    <section
      id="faq"
      className="relative border-t border-edge bg-paper-2 px-7 pt-[30px] pb-[120px]"
    >
      <div className="mx-auto w-full max-w-[1180px] pt-[90px]">
        <div
          ref={ref}
          className="grid items-start gap-16 lg:grid-cols-[0.85fr_1.15fr]"
        >
          <div>
            <div className="mb-[18px] flex items-center gap-3">
              <span className="font-serif text-[19px] italic text-amber">05</span>
              <span className="text-xs uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
                No Catch
              </span>
            </div>
            <h2 className="m-0 mb-5 font-serif text-[40px] font-medium leading-[1.12] tracking-[-0.02em] text-cream break-keep">
              묻기 전에, <span className="italic text-amber">먼저 답할게요.</span>
            </h2>
            <div className="rounded-[18px] border border-edge bg-surface p-6">
              <div className="mb-3.5 flex items-baseline gap-2">
                <span className="font-serif text-[38px] font-medium leading-none text-cream">
                  무료
                </span>
                <span className="text-sm text-cream-faint">로 시작해요</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {[
                  '카드·지도·보관함, 핵심은 전부 무료',
                  '신용카드 없이 가입',
                  '언제든 내 데이터 내보내기·삭제',
                ].map((line) => (
                  <div key={line} className="flex items-center gap-2.5 text-sm text-cream-mute">
                    <span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-sage-soft text-sage-ink">
                      <Icon name="solar:check-bold" width={12} height={12} />
                    </span>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            {FAQS.map((f, i) => {
              const isOpen = open === i;
              return (
                <div
                  key={f.q}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setOpen(isOpen ? -1 : i);
                  }}
                  className="cursor-pointer border-b border-edge px-1 py-6"
                >
                  <div className="flex items-center justify-between gap-5">
                    <h3 className="m-0 font-serif text-[21px] font-medium text-cream break-keep">
                      {f.q}
                    </h3>
                    <span
                      className="grid h-[30px] w-[30px] flex-shrink-0 place-items-center rounded-full border border-edge-strong text-cream-mute transition-transform duration-[var(--dur-base)] ease-[var(--ease-spring)]"
                      style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0)' }}
                      aria-hidden
                    >
                      <Icon name="solar:add-square-linear" width={16} height={16} />
                    </span>
                  </div>
                  <div
                    className="overflow-hidden transition-all duration-300 ease-[var(--ease-spring)]"
                    style={{
                      maxHeight: isOpen ? 200 : 0,
                      opacity: isOpen ? 1 : 0,
                      marginTop: isOpen ? 14 : 0,
                    }}
                  >
                    <p className="m-0 max-w-[56ch] text-[15px] leading-[1.7] text-cream-mute break-keep">
                      {f.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
