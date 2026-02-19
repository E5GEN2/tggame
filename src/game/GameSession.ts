import { Card, cardId, cardsEqual, Rank, Suit } from "./Card.js";
import { createShuffledDeck, recycleIfNeeded } from "./Deck.js";
import { GameState, Player } from "./GameState.js";
import { canPlayCombo, resolveComboEffect } from "./Rules.js";
import {
  advanceTurn,
  currentPlayer,
  reverseDirection,
  skipNextPlayer,
  topCard,
} from "./TurnManager.js";
import { HAND_SIZE, CRAZY_PENALTY } from "../utils/constants.js";

/** Create a new game with the given players. */
export function createGame(players: Player[]): GameState {
  const deck = createShuffledDeck();
  const hands: Record<string, Card[]> = {};

  for (const p of players) {
    hands[p.id] = deck.splice(0, HAND_SIZE);
  }

  const firstCard = findStarterCard(deck);
  const discardPile = [firstCard];

  const state: GameState = {
    players,
    hands,
    drawPile: deck,
    discardPile,
    currentPlayerIndex: 0,
    direction: 1,
    activeSuit: firstCard.suit,
    pendingDraw: 0,
    lastAction: "Game started!",
    calledCrazy: {},
    gameOver: false,
    winnerId: null,
    turnCount: 0,
  };

  // If the starter card is a 2 or K, set up pending draw
  if (firstCard.rank === Rank.Two) {
    state.pendingDraw = 2;
  } else if (firstCard.rank === Rank.King) {
    state.pendingDraw = 1;
  }

  return state;
}

/**
 * Find a non-special card to start the game.
 * Removes it from the deck. Falls back to first card if none found.
 */
function findStarterCard(deck: Card[]): Card {
  const idx = deck.findIndex(
    (c) =>
      c.rank !== Rank.Two &&
      c.rank !== Rank.Eight &&
      c.rank !== Rank.Jack &&
      c.rank !== Rank.Queen &&
      c.rank !== Rank.King &&
      c.rank !== Rank.Ace
  );
  if (idx >= 0) {
    return deck.splice(idx, 1)[0];
  }
  return deck.splice(0, 1)[0];
}

export interface PlayResult {
  success: boolean;
  error?: string;
  needsSuitPick?: boolean;  // true when wild 8 is played
  effect?: string;          // description of what happened
}

/**
 * Play cards from the current player's hand.
 * Cards must all be the same rank (combo).
 */
export function playCards(state: GameState, cards: Card[]): PlayResult {
  const player = currentPlayer(state);
  const hand = state.hands[player.id];
  const top = topCard(state);

  // If there's a pending draw, player must draw or stack another draw card
  if (state.pendingDraw > 0) {
    const isDrawCard = cards.length > 0 && (cards[0].rank === Rank.Two || cards[0].rank === Rank.King);
    if (!isDrawCard) {
      return { success: false, error: "You must play a draw card or draw from the pile!" };
    }
  }

  if (!canPlayCombo(cards, top, state.activeSuit)) {
    return { success: false, error: "Invalid play! Cards must match suit or rank." };
  }

  // Verify all cards are in hand
  for (const card of cards) {
    const idx = hand.findIndex((h) => cardsEqual(h, card));
    if (idx === -1) {
      return { success: false, error: "Card not in hand!" };
    }
  }

  // Check CRAZY! penalty: if player had 1 card before and didn't call CRAZY
  checkCrazyPenalty(state, player.id);

  // Remove cards from hand
  for (const card of cards) {
    const idx = hand.findIndex((h) => cardsEqual(h, card));
    hand.splice(idx, 1);
  }

  // Add cards to discard pile
  state.discardPile.push(...cards);

  // Reset CRAZY call status
  state.calledCrazy[player.id] = false;

  // Resolve effect
  const effect = resolveComboEffect(cards);
  const comboText = cards.length > 1 ? ` x${cards.length} COMBO!` : "";

  switch (effect.type) {
    case "draw": {
      state.pendingDraw += effect.count;
      state.activeSuit = cards[cards.length - 1].suit;
      state.lastAction = `${player.name} played ${describeCards(cards)}${comboText} — +${effect.count} cards pending!`;
      advanceTurn(state);
      break;
    }
    case "wild": {
      state.lastAction = `${player.name} played ${describeCards(cards)}${comboText} — pick a suit!`;
      // Don't advance turn yet — wait for suit pick
      return { success: true, needsSuitPick: true, effect: state.lastAction };
    }
    case "skip": {
      state.activeSuit = cards[cards.length - 1].suit;
      const skippedIdx = ((state.currentPlayerIndex + state.direction) % state.players.length + state.players.length) % state.players.length;
      const skipped = state.players[skippedIdx];
      state.lastAction = `${player.name} played ${describeCards(cards)}${comboText} — ${skipped.name} skipped!`;
      skipNextPlayer(state);
      break;
    }
    case "reverse": {
      state.activeSuit = cards[cards.length - 1].suit;
      state.lastAction = `${player.name} played ${describeCards(cards)}${comboText} — direction reversed!`;
      reverseDirection(state);
      break;
    }
    case "playAgain": {
      state.activeSuit = cards[cards.length - 1].suit;
      state.lastAction = `${player.name} played ${describeCards(cards)}${comboText} — plays again!`;
      // Don't advance turn — same player goes again
      state.turnCount++;
      break;
    }
    default: {
      state.activeSuit = cards[cards.length - 1].suit;
      state.lastAction = `${player.name} played ${describeCards(cards)}${comboText}`;
      advanceTurn(state);
      break;
    }
  }

  // Check win
  if (hand.length === 0) {
    state.gameOver = true;
    state.winnerId = player.id;
    state.lastAction = `${player.name} wins! 🎉`;
  }

  return { success: true, effect: state.lastAction };
}

/** Pick a suit after playing a wild 8. */
export function pickSuit(state: GameState, suit: Suit): void {
  const player = currentPlayer(state);
  state.activeSuit = suit;
  const suitEmoji = suitToEmoji(suit);
  state.lastAction = `${player.name} chose ${suitEmoji} ${suit}!`;

  // Check win after wild play
  const hand = state.hands[player.id];
  if (hand.length === 0) {
    state.gameOver = true;
    state.winnerId = player.id;
    state.lastAction = `${player.name} wins! 🎉`;
  }

  advanceTurn(state);
}

/** Draw cards for the current player. */
export function drawCards(state: GameState): Card[] {
  const player = currentPlayer(state);
  const hand = state.hands[player.id];

  // Check CRAZY! penalty first
  checkCrazyPenalty(state, player.id);

  let count = state.pendingDraw > 0 ? state.pendingDraw : 1;
  state.pendingDraw = 0;

  const drawn: Card[] = [];
  for (let i = 0; i < count; i++) {
    recycleIfNeeded(state.drawPile, state.discardPile);
    if (state.drawPile.length === 0) break;
    const card = state.drawPile.pop()!;
    hand.push(card);
    drawn.push(card);
  }

  state.lastAction = `${player.name} drew ${drawn.length} card${drawn.length !== 1 ? "s" : ""}`;
  state.calledCrazy[player.id] = false;
  advanceTurn(state);

  return drawn;
}

/** Call CRAZY! when player has 1 card. */
export function callCrazy(state: GameState, playerId: string): boolean {
  const hand = state.hands[playerId];
  if (hand.length === 1) {
    state.calledCrazy[playerId] = true;
    return true;
  }
  return false;
}

/** Check and apply CRAZY! penalty if player has 1 card and didn't call it. */
function checkCrazyPenalty(state: GameState, playerId: string): void {
  const hand = state.hands[playerId];
  if (hand.length === 1 && !state.calledCrazy[playerId]) {
    // Penalty: draw 2 cards
    for (let i = 0; i < CRAZY_PENALTY; i++) {
      recycleIfNeeded(state.drawPile, state.discardPile);
      if (state.drawPile.length === 0) break;
      hand.push(state.drawPile.pop()!);
    }
    const player = state.players.find((p) => p.id === playerId);
    if (player) {
      state.lastAction = `${player.name} forgot to call CRAZY! +${CRAZY_PENALTY} penalty cards!`;
    }
  }
}

/** Get playable cards from a hand given current state. */
export function getPlayableCards(state: GameState, playerId: string): Card[] {
  const hand = state.hands[playerId];
  const top = topCard(state);

  if (state.pendingDraw > 0) {
    return hand.filter((c) => c.rank === Rank.Two || c.rank === Rank.King);
  }

  return hand.filter((c) => {
    if (c.rank === Rank.Eight) return true;
    return c.suit === state.activeSuit || c.rank === top.rank;
  });
}

function describeCards(cards: Card[]): string {
  return cards.map((c) => `${c.rank}${suitToEmoji(c.suit)}`).join(" ");
}

function suitToEmoji(suit: Suit): string {
  switch (suit) {
    case Suit.Hearts: return "♥️";
    case Suit.Diamonds: return "♦️";
    case Suit.Clubs: return "♣️";
    case Suit.Spades: return "♠️";
  }
}
