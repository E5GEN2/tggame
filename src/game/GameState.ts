import { Card, Suit } from "./Card.js";

export interface Player {
  id: string;
  name: string;
  isBot: boolean;
  botPersonality?: string;
}

export interface GameState {
  players: Player[];
  hands: Record<string, Card[]>;     // playerId → hand
  drawPile: Card[];
  discardPile: Card[];
  currentPlayerIndex: number;
  direction: 1 | -1;                 // 1 = clockwise, -1 = counter
  activeSuit: Suit;                  // current suit to match (changes on wild)
  pendingDraw: number;               // stacked draw-2 / draw-1 accumulation
  lastAction: string;                // description of last action for display
  calledCrazy: Record<string, boolean>;  // playerId → whether they called CRAZY
  gameOver: boolean;
  winnerId: string | null;
  turnCount: number;
}
