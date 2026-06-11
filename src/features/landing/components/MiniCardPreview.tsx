import { Card } from '@/components/Card';
import { EyebrowTag } from '@/components/EyebrowTag';

export function MiniCardPreview() {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <EyebrowTag>DAY_3</EyebrowTag>
        <span className="text-xs text-cream-faint">노출 2 / 5</span>
      </div>
      <p className="mt-4 font-display text-xl leading-snug text-cream break-keep">
        키 정규화: 함수 종속성에서 부분 종속이란?
      </p>
      <p className="mt-3 text-sm leading-relaxed text-cream-mute break-keep">
        후보키의 일부에만 의존하는 속성을 분리해 제2정규형을 만들어요.
      </p>
      <div className="mt-6 flex gap-2">
        <span className="rounded-full bg-glass px-3 py-1 text-xs text-cream-mute">RDB</span>
        <span className="rounded-full bg-glass px-3 py-1 text-xs text-cream-mute">정규화</span>
      </div>
    </Card>
  );
}
