import { http, HttpResponse } from 'msw';

interface MockTopic {
  topicId: string;
  name: string;
  description: string | null;
  displayOrder: number;
  coverageStatus: 'NO_MATERIAL' | 'PARTIAL' | 'COVERED';
  isFocused: boolean;
  revisionCount: number;
}

interface MockAxis {
  axisId: string;
  name: string;
  displayOrder: number;
  topics: MockTopic[];
}

interface MockMaterial {
  materialId: string;
  type: 'BOOK' | 'COURSE' | 'AI_CONVERSATION' | 'WEB_RESOURCE';
  name: string;
  topicIds: string[];
  proficiencyLevel: null | 'UNFAMILIAR' | 'FAMILIARIZING' | 'MASTERED';
  deckId: string;
}

interface FacadeState {
  facadeId: string;
  concept: string | null;
  axes: MockAxis[];
  materials: MockMaterial[];
  nextAxisId: number;
  nextTopicId: number;
  nextMaterialId: number;
  nextDeckId: number;
}

function seed(): FacadeState {
  return {
    facadeId: 'facade-1',
    concept: null,
    axes: [],
    materials: [],
    nextAxisId: 1,
    nextTopicId: 1,
    nextMaterialId: 1,
    nextDeckId: 1,
  };
}

const state: FacadeState = seed();

export function resetFacadeMockState(): void {
  Object.assign(state, seed());
}

const AXIS_SUGGESTIONS: ReadonlyArray<{ description: string; rationale: string }> = [
  { description: '데이터 모델링', rationale: '시스템의 근간이 되는 영역' },
  { description: '분산 시스템', rationale: '확장성 설계의 핵심' },
  { description: 'API 설계', rationale: '서비스 경계의 명확성' },
  { description: '인프라와 운영', rationale: '시스템이 실제로 사는 환경' },
  { description: '도메인 설계', rationale: '비즈니스를 코드로 표현하는 축' },
];

const TOPIC_SUGGESTIONS: ReadonlyArray<{ description: string; rationale: string }> = [
  { description: '도메인 중심 설계', rationale: '비즈니스를 코드로 표현하는 출발점' },
  { description: '정규화와 역정규화', rationale: '데이터 무결성과 성능의 균형' },
  { description: '인덱스 전략', rationale: '쿼리 패턴을 미리 그려보는 작업' },
  { description: '트랜잭션 격리 수준', rationale: '동시성 문제의 본질을 이해' },
  { description: '이벤트 소싱', rationale: '상태 변화를 사실로 다루는 관점' },
];

const REVISION_REASONS = [
  { id: 1, label: '기존 표현이 너무 좁았다', displayOrder: 1 },
  { id: 2, label: '기존 표현이 너무 넓었다', displayOrder: 2 },
  { id: 3, label: '더 정확한 표현을 찾았다', displayOrder: 3 },
  { id: 4, label: '방향 자체가 바뀌었다', displayOrder: 4 },
];

function computeCoverage(): {
  totalTopics: number;
  uncoveredTopics: number;
  axesWithUncovered: string[];
} {
  let total = 0;
  let uncovered = 0;
  const axesWithUncovered = new Set<string>();
  state.axes.forEach((a) => {
    a.topics.forEach((t) => {
      total += 1;
      if (t.coverageStatus === 'NO_MATERIAL') {
        uncovered += 1;
        axesWithUncovered.add(a.axisId);
      }
    });
  });
  return {
    totalTopics: total,
    uncoveredTopics: uncovered,
    axesWithUncovered: [...axesWithUncovered],
  };
}

function findTopic(topicId: string): MockTopic | undefined {
  for (const axis of state.axes) {
    const found = axis.topics.find((t) => t.topicId === topicId);
    if (found) return found;
  }
  return undefined;
}

export const facadeHandlers = [
  http.get('/api/learning-facade', () => {
    return HttpResponse.json({
      facadeId: state.facadeId,
      concept: state.concept,
      axes: state.axes.map((a) => ({
        axisId: a.axisId,
        name: a.name,
        displayOrder: a.displayOrder,
        topics: a.topics.map((t) => ({
          topicId: t.topicId,
          name: t.name,
          description: t.description ?? undefined,
          displayOrder: t.displayOrder,
          coverageStatus: t.coverageStatus,
          isFocused: t.isFocused,
        })),
      })),
      coverageSummary: computeCoverage(),
    });
  }),

  http.post('/api/learning-facade/concept', async ({ request }) => {
    const body = (await request.json()) as { concept?: string };
    const trimmed = body.concept?.trim();
    if (!trimmed) {
      return HttpResponse.json(
        { code: 'LF_CONCEPT_REQUIRED', message: '직업적 컨셉을 입력해주세요' },
        { status: 400 },
      );
    }
    const changed = state.concept !== trimmed;
    state.concept = trimmed;
    return HttpResponse.json(
      {
        facadeId: state.facadeId,
        concept: trimmed,
        changed,
        updatedAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  http.post('/api/learning-facade/axes', async ({ request }) => {
    const body = (await request.json()) as { name?: string };
    const trimmed = body.name?.trim();
    if (!trimmed) {
      return HttpResponse.json(
        { code: 'LEARNING_AXIS_NAME_BLANK', message: '축 이름을 입력해주세요' },
        { status: 400 },
      );
    }
    if (state.axes.some((a) => a.name === trimmed)) {
      return HttpResponse.json(
        { code: 'LEARNING_AXIS_DUPLICATE_NAME', message: '이미 같은 이름의 축이 있습니다' },
        { status: 409 },
      );
    }
    const axisId = `axis-${state.nextAxisId++}`;
    const axis: MockAxis = {
      axisId,
      name: trimmed,
      displayOrder: state.axes.length + 1,
      topics: [],
    };
    state.axes.push(axis);
    return HttpResponse.json(
      {
        axisId,
        name: trimmed,
        displayOrder: axis.displayOrder,
        isAxisCountExceedsRecommended: state.axes.length > 5,
        createdAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  http.post('/api/learning-facade/axes/suggestions', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { limit?: number };
    const limit = Math.min(Math.max(body.limit ?? 5, 1), 5);
    return HttpResponse.json({
      suggestions: AXIS_SUGGESTIONS.slice(0, limit),
      suggestionsAvailable: true,
      provider_context: 'none',
    });
  }),

  http.post('/api/learning-facade/axes/:axisId/topics', async ({ params, request }) => {
    const axisId = params.axisId as string;
    const axis = state.axes.find((a) => a.axisId === axisId);
    if (!axis) {
      return HttpResponse.json(
        { code: 'LF_AXIS_NOT_FOUND', message: '축을 찾을 수 없습니다' },
        { status: 404 },
      );
    }
    const body = (await request.json()) as {
      topics?: Array<{ name?: string; description?: string | null }>;
    };
    const incoming = (body.topics ?? []).map((t) => ({
      name: t.name?.trim() ?? '',
      description: t.description ?? null,
    }));
    if (incoming.length === 0 || incoming.some((t) => !t.name)) {
      return HttpResponse.json(
        { code: 'AXIS_TOPIC_NAME_BLANK', message: '주제 이름을 입력해주세요' },
        { status: 400 },
      );
    }
    const duplicate = incoming.find((t) => axis.topics.some((existing) => existing.name === t.name));
    if (duplicate) {
      return HttpResponse.json(
        { code: 'AXIS_TOPIC_DUPLICATE_NAME', message: `이미 존재하는 주제입니다: ${duplicate.name}` },
        { status: 409 },
      );
    }
    const added: MockTopic[] = incoming.map((t, i) => ({
      topicId: `topic-${state.nextTopicId++}`,
      name: t.name,
      description: t.description ?? null,
      displayOrder: axis.topics.length + i + 1,
      coverageStatus: 'NO_MATERIAL' as const,
      isFocused: axis.topics.length + i < 3,
      revisionCount: 0,
    }));
    axis.topics.push(...added);
    return HttpResponse.json(
      {
        topics: added.map((t) => ({
          topicId: t.topicId,
          name: t.name,
          description: t.description ?? undefined,
          displayOrder: t.displayOrder,
          coverageStatus: t.coverageStatus,
          isFocused: t.isFocused,
        })),
        isTopicCountExceedsRecommended: axis.topics.length > 10,
      },
      { status: 201 },
    );
  }),

  http.post('/api/learning-facade/axes/:axisId/topics/suggestions', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { limit?: number };
    const limit = Math.min(Math.max(body.limit ?? 5, 1), 5);
    return HttpResponse.json({
      suggestions: TOPIC_SUGGESTIONS.slice(0, limit),
      suggestionsAvailable: true,
      provider_context: 'none',
    });
  }),

  http.get('/api/learning-facade/revision-reasons', () => {
    return HttpResponse.json({ options: REVISION_REASONS });
  }),

  http.patch('/api/learning-facade/topics/:topicId', async ({ params, request }) => {
    const topicId = params.topicId as string;
    const topic = findTopic(topicId);
    if (!topic) {
      return HttpResponse.json(
        { code: 'TOPIC_NOT_FOUND', message: '주제를 찾을 수 없습니다' },
        { status: 404 },
      );
    }
    const body = (await request.json()) as {
      name?: string;
      description?: string | null;
      revisionReasonId?: number | null;
    };
    const trimmedName = body.name?.trim();
    const newName = trimmedName ?? topic.name;
    const changed = newName !== topic.name;
    if (changed) {
      topic.name = newName;
      topic.coverageStatus = 'NO_MATERIAL';
      topic.revisionCount += 1;
    }
    if (body.description !== undefined) {
      topic.description = body.description ?? null;
    }
    if (body.revisionReasonId != null) {
      const exists = REVISION_REASONS.some((r) => r.id === body.revisionReasonId);
      if (!exists) {
        return HttpResponse.json(
          { code: 'REVISION_REASON_NOT_FOUND', message: '선택지를 찾을 수 없어요' },
          { status: 404 },
        );
      }
    }
    return HttpResponse.json({
      topicId: topic.topicId,
      name: topic.name,
      description: topic.description ?? null,
      coverageStatus: topic.coverageStatus,
      changed,
      isRefinementSuggested: topic.revisionCount >= 3,
      revisionCount: topic.revisionCount,
    });
  }),

  http.post('/api/learning-facade/materials', async ({ request }) => {
    const body = (await request.json()) as {
      name?: string;
      type?: 'BOOK' | 'COURSE' | 'AI_CONVERSATION' | 'WEB_RESOURCE';
      topicIds?: string[];
    };
    const name = body.name?.trim();
    const type = body.type;
    if (!name || !type) {
      return HttpResponse.json(
        { code: 'MATERIAL_VALIDATION', message: '필수 필드를 입력해주세요' },
        { status: 400 },
      );
    }
    const materialId = `material-${state.nextMaterialId++}`;
    const deckId = `deck-${state.nextDeckId++}`;
    const topicIds = body.topicIds ?? [];
    topicIds.forEach((tid) => {
      const t = findTopic(tid);
      if (t && t.coverageStatus === 'NO_MATERIAL') t.coverageStatus = 'PARTIAL';
    });
    const material: MockMaterial = {
      materialId,
      type,
      name,
      topicIds,
      proficiencyLevel: null,
      deckId,
    };
    state.materials.push(material);
    return HttpResponse.json(
      {
        materialId,
        name,
        type,
        topicIds,
        deckId,
        deckAutoCreated: true,
        proficiencyLevel: null,
        updatedTopicsCoverage: topicIds
          .map((tid) => {
            const t = findTopic(tid);
            return t ? { topicId: t.topicId, coverageStatus: t.coverageStatus } : null;
          })
          .filter(Boolean),
      },
      { status: 201 },
    );
  }),
];
