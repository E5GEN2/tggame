import { Card, Rank, Suit } from "../game/Card.js";
import { GameState } from "../game/GameState.js";
import { getPlayableCards } from "../game/GameSession.js";
import { isSpecialCard } from "../game/Rules.js";
import { BotDecision, BotPlayer } from "./BotPlayer.js";

/**
 * Defensive bot: holds onto special cards, plays normal cards first.
 * Only uses specials when it has no normal plays left.
 */
export class DefensiveBot implements BotPlayer {
  decide(hand: Card[], state: GameState, playerId: string): BotDecision {
    const playable = getPlayableCards(state, playerId);

    if (playable.length === 0) {
      return { action: "draw" };
    }

    const shouldCallCrazy = hand.length === 2;

    // Prefer normal cards
    const normals = playable.filter((c) => !isSpecialCard(c.rank));
    const specials = playable.filter((c) => isSpecialCard(c.rank));

    const pick = normals.length > 0 ? normals[0] : specials[0];
    const needsSuit = pick.rank === Rank.Eight;

    return {
      action: "play",
      cards: [pick],
      suitPick: needsSuit ? pickMostCommonSuit(hand, [pick]) : undefined,
      callCrazy: shouldCallCrazy,
    };
  }
}

function pickMostCommonSuit(hand: Card[], played: Card[]): Suit {
  const remaining = hand.filter(
    (h) => !played.some((p) => p.suit === h.suit && p.rank === h.rank)
  );
  const counts: Record<string, number> = {};
  for (const c of remaining) {
    counts[c.suit] = (counts[c.suit] || 0) + 1;
  }
  let best = Suit.Hearts;
  let bestN = -1;
  for (const [s, n] of Object.entries(counts)) {
    if (n > bestN) { bestN = n; best = s as Suit; }
  }
  return best;
}
