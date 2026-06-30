import { describe, it, expect } from 'vitest';
import { MaterialSchema } from './material';

describe('MaterialSchema (discriminated union)', () => {
  it('parses BOOK', () => {
    const m = MaterialSchema.parse({
      materialId: 'm1',
      type: 'BOOK',
      name: 'DDD Distilled',
      author: 'Vaughn Vernon',
      proficiencyLevel: 'FAMILIARIZING',
    });
    expect(m.type).toBe('BOOK');
  });
  it('parses COURSE', () => {
    const m = MaterialSchema.parse({
      materialId: 'm2',
      type: 'COURSE',
      name: '관계형 DB 설계',
      platform: 'Inflearn',
      url: 'https://example.com',
      proficiencyLevel: null,
    });
    expect(m.type).toBe('COURSE');
  });
  it('rejects mismatched fields', () => {
    expect(() =>
      MaterialSchema.parse({
        materialId: 'm3',
        type: 'BOOK',
        name: 'x',
        platform: 'wrong',
        proficiencyLevel: null,
      }),
    ).toThrow();
  });
});
