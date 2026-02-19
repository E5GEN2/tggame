import { Card, Suit, Rank } from "../../game/Card.js";

const SUIT_EMOJI: Record<Suit, string> = {
  [Suit.Hearts]: "♥️",
  [Suit.Diamonds]: "♦️",
  [Suit.Clubs]: "♣️",
  [Suit.Spades]: "♠️",
};

const SUIT_SYMBOL: Record<Suit, string> = {
  [Suit.Hearts]: "♥",
  [Suit.Diamonds]: "♦",
  [Suit.Clubs]: "♣",
  [Suit.Spades]: "♠",
};

/** Render a card as a short string: "K♠️" */
export function renderCard(card: Card): string {
  return `${card.rank}${SUIT_EMOJI[card.suit]}`;
}

/** Render a card for inline button text (shorter). */
export function renderCardButton(card: Card, selected: boolean): string {
  const mark = selected ? "✅ " : "";
  return `${mark}${card.rank}${SUIT_SYMBOL[card.suit]}`;
}

/** Render suit as emoji. */
export function renderSuit(suit: Suit): string {
  return SUIT_EMOJI[suit];
}

/** Render suit for button. */
export function renderSuitButton(suit: Suit): string {
  const names: Record<Suit, string> = {
    [Suit.Hearts]: "Hearts ♥️",
    [Suit.Diamonds]: "Diamonds ♦️",
    [Suit.Clubs]: "Clubs ♣️",
    [Suit.Spades]: "Spades ♠️",
  };
  return names[suit];
}

/** Card back for display. */
export function cardBack(): string {
  return "🂠";
}
