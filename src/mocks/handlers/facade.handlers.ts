import { http, HttpResponse } from 'msw';

interface MockTopic {
  topicId: string;
  axisId: string;
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
  materialType: 'BOOK' | 'COURSE' | 'AI_CONVERSATION' | 'WEB_RESOURCE';
  name: string;
  linkedTopicIds: string[];
  proficiencyLevel: null | 'UNFAMILIAR' | 'FAMILIARIZING' | 'MASTERED';
  deckId: string;
}

interface FacadeState {
  facadeId: string;
  exists: boolean;
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
    exists: false,
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

function findAxis(axisId: string): MockAxis | undefined {
  return state.axes.find((a) => a.axisId === axisId);
}

function findTopicInAxis(axis: MockAxis, topicId: string): MockTopic | undefined {
  return axis.topics.find((t) => t.topicId === topicId);
}

export const facadeHandlers = [
  http.get('/api/v1/learning-facade', () => {
    if (!state.exists) {
      return HttpResponse.json(
        { code: 'LF001', message: '학습 Facade를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }
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
          description: t.description,
          displayOrder: t.displayOrder,
          coverageStatus: t.coverageStatus,
          isFocused: t.isFocused,
        })),
      })),
      coverageSummary: computeCoverage(),
    });
  }),

  http.post('/api/v1/learning-facade', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { concept?: string };
    const trimmed = body.concept?.trim();
    if (!trimmed) {
      return HttpResponse.json(
        { code: 'C001', message: '잘못된 입력 값입니다.' },
        { status: 400 },
      );
    }
    if (state.exists) {
      return HttpResponse.json(
        { code: 'LF002', message: '이미 Facade가 존재합니다.' },
        { status: 409 },
      );
    }
    state.exists = true;
    state.concept = trimmed;
    return HttpResponse.json(
      {
        facadeId: state.facadeId,
        concept: trimmed,
        createdAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  http.patch('/api/v1/learning-facade/concept', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { concept?: string };
    const trimmed = body.concept?.trim();
    if (!trimmed) {
      return HttpResponse.json(
        { code: 'C001', message: '잘못된 입력 값입니다.' },
        { status: 400 },
      );
    }
    if (!state.exists) {
      return HttpResponse.json(
        { code: 'LF001', message: '학습 Facade를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }
    const changed = state.concept !== trimmed;
    state.concept = trimmed;
    return HttpResponse.json({
      facadeId: state.facadeId,
      concept: trimmed,
      changed,
      updatedAt: new Date().toISOString(),
    });
  }),

  http.post('/api/v1/learning-facade/axes', async ({ request }) => {
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
    if (!state.exists) {
      state.exists = true;
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

  http.post('/api/v1/learning-facade/axes/:axisId/topics', async ({ params, request }) => {
    const axisId = params.axisId as string;
    const axis = findAxis(axisId);
    if (!axis) {
      return HttpResponse.json(
        { code: 'LF_AXIS_NOT_FOUND', message: '축을 찾을 수 없습니다' },
        { status: 404 },
      );
    }
    const body = (await request.json()) as { name?: string; description?: string | null };
    const trimmed = body.name?.trim();
    if (!trimmed) {
      return HttpResponse.json(
        { code: 'AXIS_TOPIC_NAME_BLANK', message: '주제 이름을 입력해주세요' },
        { status: 400 },
      );
    }
    if (axis.topics.some((t) => t.name === trimmed)) {
      return HttpResponse.json(
        { code: 'AXIS_TOPIC_DUPLICATE_NAME', message: `이미 존재하는 주제입니다: ${trimmed}` },
        { status: 409 },
      );
    }
    const topic: MockTopic = {
      topicId: `topic-${state.nextTopicId++}`,
      axisId,
      name: trimmed,
      description: body.description ?? null,
      displayOrder: axis.topics.length + 1,
      coverageStatus: 'NO_MATERIAL',
      isFocused: axis.topics.length < 3,
      revisionCount: 0,
    };
    axis.topics.push(topic);
    return HttpResponse.json(
      {
        topicId: topic.topicId,
        axisId,
        name: topic.name,
        description: topic.description,
        displayOrder: topic.displayOrder,
        coverageStatus: topic.coverageStatus,
        isFocused: topic.isFocused,
        isTopicCountExceedsRecommended: axis.topics.length > 10,
      },
      { status: 201 },
    );
  }),

  http.get('/api/v1/learning-facade/revision-reason-options', () => {
    return HttpResponse.json({ options: REVISION_REASONS });
  }),

  http.patch(
    '/api/v1/learning-facade/axes/:axisId/topics/:topicId',
    async ({ params, request }) => {
      const axisId = params.axisId as string;
      const topicId = params.topicId as string;
      const axis = findAxis(axisId);
      if (!axis) {
        return HttpResponse.json(
          { code: 'LF_AXIS_NOT_FOUND', message: '축을 찾을 수 없습니다' },
          { status: 404 },
        );
      }
      const topic = findTopicInAxis(axis, topicId);
      if (!topic) {
        return HttpResponse.json(
          { code: 'TOPIC_NOT_FOUND', message: '주제를 찾을 수 없습니다' },
          { status: 404 },
        );
      }
      const body = (await request.json()) as {
        name?: string;
        description?: string | null;
        revisionReasonOptionId?: number | null;
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
      if (body.revisionReasonOptionId != null) {
        const exists = REVISION_REASONS.some((r) => r.id === body.revisionReasonOptionId);
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
        description: topic.description,
        coverageStatus: topic.coverageStatus,
        changed,
        isRefinementSuggested: topic.revisionCount >= 3,
        revisionCount: topic.revisionCount,
      });
    },
  ),

  http.post('/api/v1/learning-facade/materials', async ({ request }) => {
    const body = (await request.json()) as {
      name?: string;
      materialType?: 'BOOK' | 'COURSE' | 'AI_CONVERSATION' | 'WEB_RESOURCE';
      linkedTopicIds?: string[];
    };
    const name = body.name?.trim();
    const materialType = body.materialType;
    if (!name || !materialType) {
      return HttpResponse.json(
        { code: 'C001', message: '잘못된 입력 값입니다.' },
        { status: 400 },
      );
    }
    const materialId = `material-${state.nextMaterialId++}`;
    const deckId = `deck-${state.nextDeckId++}`;
    const linkedTopicIds = body.linkedTopicIds ?? [];
    linkedTopicIds.forEach((tid) => {
      for (const axis of state.axes) {
        const t = findTopicInAxis(axis, tid);
        if (t && t.coverageStatus === 'NO_MATERIAL') {
          t.coverageStatus = 'PARTIAL';
          break;
        }
      }
    });
    const material: MockMaterial = {
      materialId,
      materialType,
      name,
      linkedTopicIds,
      proficiencyLevel: null,
      deckId,
    };
    state.materials.push(material);
    return HttpResponse.json(
      {
        materialId,
        name,
        materialType,
        linkedTopicIds,
        deckId,
        deckAutoCreated: true,
        proficiencyLevel: null,
        updatedTopicsCoverage: linkedTopicIds
          .map((tid) => {
            for (const axis of state.axes) {
              const t = findTopicInAxis(axis, tid);
              if (t) return { topicId: t.topicId, coverageStatus: t.coverageStatus };
            }
            return null;
          })
          .filter((x): x is { topicId: string; coverageStatus: MockTopic['coverageStatus'] } => x !== null),
      },
      { status: 201 },
    );
  }),
];
