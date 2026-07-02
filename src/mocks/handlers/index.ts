import { facadeHandlers } from './facade.handlers';
import { cardHandlers } from './card.handlers';
import { authHandlers } from './auth.handlers';
import { tagHandlers } from './tag.handlers';
import { deckHandlers } from './deck.handlers';
import { reviewHandlers } from './review.handlers';
import { scheduleHandlers } from './schedule.handlers';
import { layerHandlers } from './layer.handlers';
import { suggestionHandlers } from './suggestion.handlers';
import { axisRoadmapNodeHandlers } from './axisRoadmapNode.handlers';

export const handlers = [
  ...authHandlers,
  ...facadeHandlers,
  ...cardHandlers,
  ...tagHandlers,
  ...deckHandlers,
  ...reviewHandlers,
  ...scheduleHandlers,
  ...layerHandlers,
  ...suggestionHandlers,
  ...axisRoadmapNodeHandlers,
];
