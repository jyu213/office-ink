import { CARDS, DECKS } from './cards.js';

export const CUSTOM_DECK_SIZE = 20;
export const CARD_COPY_LIMIT = 2;
export const DECK_NAME_LIMIT = 24;
const collectibleIds = new Set(CARDS.map(card => card.id));

export function countCards(cards) {
  const counts = new Map();
  for (const id of cards) counts.set(id, (counts.get(id) || 0) + 1);
  return counts;
}

export function validCustomDeck(deck, { complete = false } = {}) {
  return typeof deck?.id === 'string' && /^[a-z0-9-]{1,64}$/i.test(deck.id) &&
    typeof deck.name === 'string' && deck.name.trim().length > 0 && deck.name.length <= DECK_NAME_LIMIT &&
    DECKS.some(preset => preset.id === deck.baseDeckId) && Array.isArray(deck.cards) &&
    deck.cards.length <= CUSTOM_DECK_SIZE && (!complete || deck.cards.length === CUSTOM_DECK_SIZE) &&
    [...countCards(deck.cards)].every(([id, count]) => collectibleIds.has(id) && count <= CARD_COPY_LIMIT);
}
