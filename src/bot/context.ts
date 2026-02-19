import { Context, SessionFlavor } from "grammy";
import { GameState } from "../game/GameState.js";

export interface SessionData {
  gameState: GameState | null;
  selectedCards: string[];    // cardId strings of toggled cards
  gameMessageId: number | null;
}

export type BotContext = Context & SessionFlavor<SessionData>;

export function initialSession(): SessionData {
  return {
    gameState: null,
    selectedCards: [],
    gameMessageId: null,
  };
}
