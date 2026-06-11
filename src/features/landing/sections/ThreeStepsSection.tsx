import { Card } from '@/components/Card';
import { Section } from '@/components/Section';
import { MiniCardPreview } from '../components/MiniCardPreview';

const steps = [
  { num: '01', title: '꿈을 적는다', body: '되고 싶은 모습을 한 줄로. 거기서부터 지도가 시작돼요.' },
  { num: '03', title: '매일 만난다', body: '오늘의 카드, 3일 뒤, 7일 뒤. 잊을 만하면 다시 만나요.' },
];

export function ThreeStepsSection() {
  return (
    <Section eyebrow="HOW" title="세 걸음이면 충분합니다.">
      <div className="grid gap-6 md:grid-cols-2 md:grid-rows-2 lg:grid-cols-[1fr_1.2fr_1fr]">
        <Card interactive>
          <p className="font-display text-sm text-amber">{steps[0]!.num}</p>
          <h3 className="mt-3 font-display text-2xl text-cream">{steps[0]!.title}</h3>
          <p className="mt-3 text-cream-mute break-keep">{steps[0]!.body}</p>
        </Card>
        <div className="md:row-span-2 lg:col-start-2">
          <Card interactive>
            <p className="font-display text-sm text-amber">02</p>
            <h3 className="mt-3 font-display text-2xl text-cream">지도가 생긴다</h3>
            <p className="mt-3 mb-6 text-cream-mute break-keep">
              꿈에서 출발해 축(axis)과 주제(topic)가 펼쳐져요. 빈 칸은 천천히 채워가요.
            </p>
            <MiniCardPreview />
          </Card>
        </div>
        <Card interactive>
          <p className="font-display text-sm text-amber">{steps[1]!.num}</p>
          <h3 className="mt-3 font-display text-2xl text-cream">{steps[1]!.title}</h3>
          <p className="mt-3 text-cream-mute break-keep">{steps[1]!.body}</p>
        </Card>
      </div>
    </Section>
  );
}
