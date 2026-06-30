import { http, HttpResponse } from 'msw';

interface MockTag {
  id: number;
  value: string;
}

const TAG_SEED: ReadonlyArray<MockTag> = [
  { id: 1, value: 'JPA' },
  { id: 2, value: 'DB' },
  { id: 3, value: 'Kafka' },
  { id: 4, value: 'Network' },
];

interface MockCardSummary {
  cardId: number;
  keywords: Array<{ id: number; value: string }>;
  summary: string;
  tags: Array<{ id: number; value: string; linkedAt: string }>;
  contentType: 'TEXT';
  status: 'ON_FIELD' | 'ARCHIVE';
  enteredFieldAt: string;
  viewCount: number;
  lastViewedAt: string | null;
  createdDate: string;
}

const NOW = '2026-06-10T08:00:00Z';

function summary(
  cardId: number,
  status: 'ON_FIELD' | 'ARCHIVE',
  viewCount: number,
  s: string,
  kw: string[],
  tagPairs: Array<{ id: number; value: string }>,
): MockCardSummary {
  return {
    cardId,
    summary: s,
    keywords: kw.map((value, i) => ({ id: cardId * 100 + i, value })),
    tags: tagPairs.map((p) => ({ ...p, linkedAt: NOW })),
    contentType: 'TEXT',
    status,
    enteredFieldAt: NOW,
    viewCount,
    lastViewedAt: null,
    createdDate: NOW,
  };
}

const CARDS_BY_TAG: Record<number, { onField: MockCardSummary[]; archive: MockCardSummary[] }> = {
  1: { onField: [summary(1, 'ON_FIELD', 0, 'JPA의 영속성 컨텍스트는 1차 캐시 역할을 한다.', ['JPA'], [{ id: 1, value: 'JPA' }])], archive: [] },
  2: { onField: [summary(2, 'ON_FIELD', 1, 'B+ tree의 리프 노드만이 실제 데이터를 가진다.', ['Index'], [{ id: 2, value: 'DB' }])], archive: [] },
  3: { onField: [summary(3, 'ON_FIELD', 2, 'Kafka의 컨슈머 그룹은 파티션 단위로 오프셋을 관리한다.', ['Kafka'], [{ id: 3, value: 'Kafka' }])], archive: [] },
  4: {
    onField: [],
    archive: [
      summary(11, 'ARCHIVE', 5, 'HTTP/2의 헤더 압축(HPACK)은 정적 + 동적 테이블 기반이다.', ['HTTP/2'], [{ id: 4, value: 'Network' }]),
      summary(12, 'ARCHIVE', 5, 'TLS 1.3은 0-RTT 재개를 지원한다.', ['TLS'], [{ id: 4, value: 'Network' }]),
    ],
  },
};

export const tagHandlers = [
  http.get('/api/v1/tags', () => {
    const items = TAG_SEED.map((t) => {
      const buckets = CARDS_BY_TAG[t.id] ?? { onField: [], archive: [] };
      return {
        tagId: t.id,
        value: t.value,
        cardCount: buckets.onField.length + buckets.archive.length,
      };
    });
    return HttpResponse.json(items);
  }),

  http.get('/api/v1/tags/:tagId/cards', ({ params }) => {
    const id = Number(params.tagId);
    const buckets = CARDS_BY_TAG[id] ?? { onField: [], archive: [] };
    return HttpResponse.json(buckets);
  }),
];
