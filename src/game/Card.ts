export enum Suit {
  Hearts = "hearts",
  Diamonds = "diamonds",
  Clubs = "clubs",
  Spades = "spades",
}

export enum Rank {
  Ace = "A",
  Two = "2",
  Three = "3",
  Four = "4",
  Five = "5",
  Six = "6",
  Seven = "7",
  Eight = "8",
  Nine = "9",
  Ten = "10",
  Jack = "J",
  Queen = "Q",
  King = "K",
}

export interface Card {
  suit: Suit;
  rank: Rank;
}

export const SUITS = [Suit.Hearts, Suit.Diamonds, Suit.Clubs, Suit.Spades] as const;
export const RANKS = [
  Rank.Ace, Rank.Two, Rank.Three, Rank.Four, Rank.Five,
  Rank.Six, Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten,
  Rank.Jack, Rank.Queen, Rank.King,
] as const;

/** Serialize a card to a unique string id, e.g. "hearts:A" */
export function cardId(card: Card): string {
  return `${card.suit}:${card.rank}`;
}

/** Parse a card id back to a Card object. */
export function parseCardId(id: string): Card {
  const [suit, rank] = id.split(":");
  return { suit: suit as Suit, rank: rank as Rank };
}

/** Check if two cards are the same. */
export function cardsEqual(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}
