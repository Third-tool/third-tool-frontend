import { http, HttpResponse } from 'msw';

export const facadeHandlers = [
  http.get('/api/learning-facade', () => {
    return HttpResponse.json({
      facadeId: 'mock-facade-1',
      concept: '백엔드 개발자',
      axes: [],
      coverageSummary: { totalTopics: 0, uncoveredTopics: 0, axesWithUncovered: [] },
    });
  }),
];
