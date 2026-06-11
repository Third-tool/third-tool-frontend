import { facadeHandlers } from './facade.handlers';
import { cardHandlers } from './card.handlers';

export const handlers = [...facadeHandlers, ...cardHandlers];
