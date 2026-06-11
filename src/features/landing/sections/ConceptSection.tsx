import { Section } from '@/components/Section';

export function ConceptSection() {
  return (
    <Section eyebrow="WHY" title={<>학습은 실패가 아니라 순환입니다.</>}>
      <div className="grid gap-12 md:grid-cols-2 md:gap-20">
        <div className="max-w-[58ch] text-lg leading-relaxed text-cream-mute break-keep">
          <p>
            머릿속에 한 번 들어왔다고 끝나는 지식은 없습니다.
            우리는 카드 한 장 한 장을 <strong className="text-cream">ON_FIELD</strong>에 올려두고,
            충분히 만났다고 느끼면 <strong className="text-cream">배경 지식</strong>으로 옮겨 잠시 쉬게 합니다.
          </p>
          <p className="mt-6">
            잊는 것은 실패가 아닙니다. 다시 만나는 일이고, 그 만남이 더 깊은 이해를 만듭니다.
          </p>
        </div>
        <div className="max-w-[58ch] text-lg leading-relaxed text-cream-mute break-keep">
          <p>
            그래서 우리는 "외운다"는 말 대신 <strong className="text-cream">순환</strong>이라는 말을 씁니다.
            오늘 만난 카드, 3일 뒤 다시 만날 카드, 7일 뒤에 또 한번.
          </p>
          <p className="mt-6">
            카페 한 켠에서 책장을 한 장씩 넘기듯, 우리는 당신의 학습을 천천히 함께 합니다.
          </p>
        </div>
      </div>
    </Section>
  );
}
