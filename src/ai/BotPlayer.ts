import { Card, Suit } from "../game/Card.js";
import { GameState } from "../game/GameState.js";

export interface BotDecision {
  action: "play" | "draw";
  cards?: Card[];       // cards to play (if action=play)
  suitPick?: Suit;      // suit to pick if playing wild 8
  callCrazy?: boolean;  // whether to call CRAZY before playing
}

export interface BotPlayer {
  decide(hand: Card[], state: GameState, playerId: string): BotDecision;
}

export type BotPersonality = "aggressive" | "defensive" | "chaotic";
