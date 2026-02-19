import { Card, Rank, Suit } from "../game/Card.js";
import { GameState } from "../game/GameState.js";
import { getPlayableCards } from "../game/GameSession.js";
import { isSpecialCard, canPlayCombo } from "../game/Rules.js";
import { topCard } from "../game/TurnManager.js";
import { BotDecision, BotPlayer } from "./BotPlayer.js";

/**
 * Aggressive bot: prioritizes special cards and combos.
 * Plays draw cards first, then other specials, then normals.
 */
export class AggressiveBot implements BotPlayer {
  decide(hand: Card[], state: GameState, playerId: string): BotDecision {
    const playable = getPlayableCards(state, playerId);

    if (playable.length === 0) {
      return { action: "draw" };
    }

    const shouldCallCrazy = hand.length === 2; // will go to 1 after playing

    // Try combos first (same rank, multiple cards)
    const combo = findBestCombo(playable, state);
    if (combo.length > 1) {
      const needsSuit = combo[0].rank === Rank.Eight;
      return {
        action: "play",
        cards: combo,
        suitPick: needsSuit ? pickBestSuit(hand, combo) : undefined,
        callCrazy: shouldCallCrazy,
      };
    }

    // Prioritize: draw cards > specials > normals
    const sorted = [...playable].sort((a, b) => {
      const scoreA = cardPriority(a);
      const scoreB = cardPriority(b);
      return scoreB - scoreA;
    });

    const pick = sorted[0];
    const needsSuit = pick.rank === Rank.Eight;

    return {
      action: "play",
      cards: [pick],
      suitPick: needsSuit ? pickBestSuit(hand, [pick]) : undefined,
      callCrazy: shouldCallCrazy,
    };
  }
}

function cardPriority(card: Card): number {
  switch (card.rank) {
    case Rank.Two: return 10;   // Draw 2 — most aggressive
    case Rank.King: return 8;   // Draw 1
    case Rank.Jack: return 7;   // Skip
    case Rank.Queen: return 6;  // Reverse
    case Rank.Eight: return 5;  // Wild
    case Rank.Ace: return 4;    // Play again
    default: return 1;
  }
}

function findBestCombo(playable: Card[], state: GameState): Card[] {
  const byRank = new Map<Rank, Card[]>();
  for (const c of playable) {
    if (!byRank.has(c.rank)) byRank.set(c.rank, []);
    byRank.get(c.rank)!.push(c);
  }

  let bestCombo: Card[] = [];
  const top = topCard(state);
  for (const [, cards] of byRank) {
    if (cards.length > 1 && canPlayCombo(cards, top, state.activeSuit)) {
      if (cards.length > bestCombo.length) {
        bestCombo = cards;
      }
    }
  }
  return bestCombo;
}

function pickBestSuit(hand: Card[], played: Card[]): Suit {
  const remaining = hand.filter(
    (h) => !played.some((p) => p.suit === h.suit && p.rank === h.rank)
  );
  const suitCount: Record<string, number> = {};
  for (const c of remaining) {
    suitCount[c.suit] = (suitCount[c.suit] || 0) + 1;
  }
  let best = Suit.Hearts;
  let bestCount = -1;
  for (const [suit, count] of Object.entries(suitCount)) {
    if (count > bestCount) {
      bestCount = count;
      best = suit as Suit;
    }
  }
  return best;
}
