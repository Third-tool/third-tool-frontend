import { Card } from '@/components/Card';
import { Section } from '@/components/Section';

const voices = [
  {
    name: '도연',
    role: '주니어 백엔드 / 6개월차',
    body: '"실패"라는 말이 사라진 것만으로도 책상에 앉기가 쉬워졌어요.',
    height: 'md:row-span-2',
  },
  {
    name: '서준',
    role: '대학원생 / 자료 정리 중',
    body: '강의·책·블로그가 한 지도 위에 모여요. 다음에 뭘 볼지 결정하기 편해요.',
    height: '',
  },
  {
    name: '하린',
    role: 'PM에서 개발 전향 중',
    body: '하루 30장 같은 부담 대신, 오늘 만날 카드를 정해주는 게 좋아요.',
    height: '',
  },
  {
    name: '민재',
    role: '시니어 학습 코치',
    body: '학생에게 권하기 좋은 톤이에요. 따뜻하고 끈질겨요.',
    height: 'md:row-span-2',
  },
];

export function VoicesSection() {
  return (
    <Section eyebrow="VOICES" title="조용히 곁에서 들었던 이야기들.">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[160px]">
        {voices.map((v) => (
          <div key={v.name} className={v.height}>
            <Card interactive>
              <p className="text-base leading-relaxed text-cream break-keep">{v.body}</p>
              <p className="mt-6 text-sm text-cream-mute">{v.name}</p>
              <p className="text-xs text-cream-faint">{v.role}</p>
            </Card>
          </div>
        ))}
      </div>
    </Section>
  );
}
