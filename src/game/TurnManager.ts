import { GameState } from "./GameState.js";

/** Advance to the next player in current direction. */
export function advanceTurn(state: GameState): void {
  const n = state.players.length;
  state.currentPlayerIndex =
    ((state.currentPlayerIndex + state.direction) % n + n) % n;
  state.turnCount++;
}

/** Skip the next player (Jack effect). */
export function skipNextPlayer(state: GameState): void {
  advanceTurn(state); // move to skipped player
  advanceTurn(state); // move past them
}

/** Reverse direction (Queen effect). In 2-player acts like skip. */
export function reverseDirection(state: GameState): void {
  state.direction = state.direction === 1 ? -1 : 1;
  if (state.players.length === 2) {
    // In 2-player, reverse = skip, so advance twice
    advanceTurn(state);
    advanceTurn(state);
  } else {
    advanceTurn(state);
  }
}

/** Get the current player. */
export function currentPlayer(state: GameState) {
  return state.players[state.currentPlayerIndex];
}

/** Get top card of discard pile. */
export function topCard(state: GameState) {
  return state.discardPile[state.discardPile.length - 1];
}
