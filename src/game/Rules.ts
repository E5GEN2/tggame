import { Card, Rank, Suit } from "./Card.js";

export type CardEffect =
  | { type: "normal" }
  | { type: "draw"; count: number }
  | { type: "skip" }
  | { type: "reverse" }
  | { type: "wild" }
  | { type: "playAgain" };

/** Get the special effect of a single card. */
export function getCardEffect(rank: Rank): CardEffect {
  switch (rank) {
    case Rank.Two:
      return { type: "draw", count: 2 };
    case Rank.Eight:
      return { type: "wild" };
    case Rank.Jack:
      return { type: "skip" };
    case Rank.Queen:
      return { type: "reverse" };
    case Rank.King:
      return { type: "draw", count: 1 };
    case Rank.Ace:
      return { type: "playAgain" };
    default:
      return { type: "normal" };
  }
}

/**
 * Can a single card be played on the current top card + active suit?
 * 8 (wild) can always be played.
 * Otherwise must match suit (activeSuit) or rank.
 */
export function canPlayCard(card: Card, topCard: Card, activeSuit: Suit): boolean {
  if (card.rank === Rank.Eight) return true;
  return card.suit === activeSuit || card.rank === topCard.rank;
}

/**
 * Validate a combo (multiple cards played at once).
 * All cards must be the same rank, and the first card must be playable.
 */
export function canPlayCombo(cards: Card[], topCard: Card, activeSuit: Suit): boolean {
  if (cards.length === 0) return false;
  if (cards.length === 1) return canPlayCard(cards[0], topCard, activeSuit);

  const rank = cards[0].rank;
  if (!cards.every((c) => c.rank === rank)) return false;
  return canPlayCard(cards[0], topCard, activeSuit);
}

/**
 * Resolve the combined effect of a combo.
 * Draw effects stack (multiply). Other effects apply once.
 */
export function resolveComboEffect(cards: Card[]): CardEffect {
  if (cards.length === 0) return { type: "normal" };

  const base = getCardEffect(cards[0].rank);

  if (base.type === "draw") {
    return { type: "draw", count: base.count * cards.length };
  }

  return base;
}

/** Check if a card is a special card. */
export function isSpecialCard(rank: Rank): boolean {
  return getCardEffect(rank).type !== "normal";
}
