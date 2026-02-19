import { Card, SUITS, RANKS } from "./Card.js";
import { shuffle } from "../utils/shuffle.js";

/** Create a standard 52-card deck. */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

/** Create and shuffle a new deck. */
export function createShuffledDeck(): Card[] {
  return shuffle(createDeck());
}

/**
 * If the draw pile is empty, recycle the discard pile (keeping the top card).
 * Returns true if recycling happened.
 */
export function recycleIfNeeded(drawPile: Card[], discardPile: Card[]): boolean {
  if (drawPile.length > 0) return false;
  if (discardPile.length <= 1) return false;

  const topCard = discardPile.pop()!;
  const recycled = discardPile.splice(0, discardPile.length);
  shuffle(recycled);
  drawPile.push(...recycled);
  discardPile.push(topCard);
  return true;
}
