import { BotPersonality, BotPlayer } from "./BotPlayer.js";
import { AggressiveBot } from "./AggressiveBot.js";
import { DefensiveBot } from "./DefensiveBot.js";
import { ChaoticBot } from "./ChaoticBot.js";

export interface BotProfile {
  name: string;
  emoji: string;
  personality: BotPersonality;
  difficulty: "easy" | "medium" | "hard";
}

export const BOT_PROFILES: BotProfile[] = [
  { name: "Blaze", emoji: "🔥", personality: "aggressive", difficulty: "hard" },
  { name: "Sage", emoji: "🧙", personality: "defensive", difficulty: "medium" },
  { name: "Chaos", emoji: "🎲", personality: "chaotic", difficulty: "easy" },
  { name: "Viper", emoji: "🐍", personality: "aggressive", difficulty: "hard" },
  { name: "Zen", emoji: "🧘", personality: "defensive", difficulty: "medium" },
  { name: "Joker", emoji: "🃏", personality: "chaotic", difficulty: "easy" },
];

export function createBotPlayer(personality: BotPersonality): BotPlayer {
  switch (personality) {
    case "aggressive":
      return new AggressiveBot();
    case "defensive":
      return new DefensiveBot();
    case "chaotic":
      return new ChaoticBot();
  }
}

/** Pick N random bot profiles (no duplicates). */
export function pickBotProfiles(count: number): BotProfile[] {
  const shuffled = [...BOT_PROFILES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
