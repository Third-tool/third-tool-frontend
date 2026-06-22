import { facadeHandlers } from './facade.handlers';
import { cardHandlers } from './card.handlers';
import { authHandlers } from './auth.handlers';
import { tagHandlers } from './tag.handlers';
import { deckHandlers } from './deck.handlers';

export const handlers = [
  ...authHandlers,
  ...facadeHandlers,
  ...cardHandlers,
  ...tagHandlers,
  ...deckHandlers,
];
