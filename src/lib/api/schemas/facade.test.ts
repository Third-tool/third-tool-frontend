import { describe, it, expect } from 'vitest';
import {
  CoverageStatusSchema,
  ProficiencyLevelSchema,
  MaterialTypeSchema,
  AxisSchema as _AxisSchema,
  TopicSchema,
  LearningFacadeSchema,
} from './facade';

describe('CoverageStatusSchema', () => {
  it('accepts the three states', () => {
    ['NO_MATERIAL', 'PARTIAL', 'COVERED'].forEach((v) =>
      expect(CoverageStatusSchema.parse(v)).toBe(v),
    );
  });
});

describe('ProficiencyLevelSchema', () => {
  it('accepts null', () => {
    expect(ProficiencyLevelSchema.parse(null)).toBeNull();
  });
  it('accepts known levels', () => {
    ['UNFAMILIAR', 'FAMILIARIZING', 'MASTERED'].forEach((v) =>
      expect(ProficiencyLevelSchema.parse(v)).toBe(v),
    );
  });
});

describe('MaterialTypeSchema', () => {
  it('accepts BOOK/COURSE/AI_CONVERSATION/WEB_RESOURCE', () => {
    ['BOOK', 'COURSE', 'AI_CONVERSATION', 'WEB_RESOURCE'].forEach((v) =>
      expect(MaterialTypeSchema.parse(v)).toBe(v),
    );
  });
});

describe('TopicSchema', () => {
  it('parses a focused topic', () => {
    const t = TopicSchema.parse({
      topicId: 't1',
      name: '관계형 모델링',
      description: '키, 정규화',
      displayOrder: 1,
      coverageStatus: 'PARTIAL',
      isFocused: true,
    });
    expect(t.isFocused).toBe(true);
  });
});

describe('LearningFacadeSchema', () => {
  it('parses tree with coverage summary', () => {
    const f = LearningFacadeSchema.parse({
      facadeId: 'f1',
      concept: '백엔드 개발자',
      axes: [],
      coverageSummary: { totalTopics: 0, uncoveredTopics: 0, axesWithUncovered: [] },
    });
    expect(f.concept).toBe('백엔드 개발자');
  });
});
