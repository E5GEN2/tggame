import { Card, Rank, Suit, SUITS } from "../game/Card.js";
import { GameState } from "../game/GameState.js";
import { getPlayableCards } from "../game/GameSession.js";
import { canPlayCombo } from "../game/Rules.js";
import { topCard } from "../game/TurnManager.js";
import { BotDecision, BotPlayer } from "./BotPlayer.js";

/**
 * Chaotic bot: 70% random, 30% smart.
 * Sometimes plays combos, sometimes picks random cards.
 * Occasionally "forgets" to call CRAZY.
 */
export class ChaoticBot implements BotPlayer {
  decide(hand: Card[], state: GameState, playerId: string): BotDecision {
    const playable = getPlayableCards(state, playerId);

    if (playable.length === 0) {
      return { action: "draw" };
    }

    const smart = Math.random() > 0.7;
    // 80% chance to remember CRAZY call
    const shouldCallCrazy = hand.length === 2 && Math.random() < 0.8;

    if (smart) {
      // Try to play a combo
      const combo = findRandomCombo(playable, state);
      if (combo.length > 1) {
        const needsSuit = combo[0].rank === Rank.Eight;
        return {
          action: "play",
          cards: combo,
          suitPick: needsSuit ? randomSuit() : undefined,
          callCrazy: shouldCallCrazy,
        };
      }
    }

    // Pick a random playable card
    const pick = playable[Math.floor(Math.random() * playable.length)];
    const needsSuit = pick.rank === Rank.Eight;

    return {
      action: "play",
      cards: [pick],
      suitPick: needsSuit ? randomSuit() : undefined,
      callCrazy: shouldCallCrazy,
    };
  }
}

function findRandomCombo(playable: Card[], state: GameState): Card[] {
  const byRank = new Map<Rank, Card[]>();
  for (const c of playable) {
    if (!byRank.has(c.rank)) byRank.set(c.rank, []);
    byRank.get(c.rank)!.push(c);
  }

  const combos: Card[][] = [];
  const top = topCard(state);
  for (const [, cards] of byRank) {
    if (cards.length > 1 && canPlayCombo(cards, top, state.activeSuit)) {
      combos.push(cards);
    }
  }

  if (combos.length === 0) return [];
  return combos[Math.floor(Math.random() * combos.length)];
}

function randomSuit(): Suit {
  return SUITS[Math.floor(Math.random() * SUITS.length)];
}
