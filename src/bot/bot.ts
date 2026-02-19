import { Bot, session } from "grammy";
import { BotContext, initialSession, SessionData } from "./context.js";
import { handleStart, handleMainMenu } from "./handlers/start.js";
import {
  handleNewGame,
  handleStartGame,
  handleCardToggle,
  handlePlaySelected,
  handleSuitPick,
  handleDrawCard,
  handleCrazyCall,
} from "./handlers/game.js";
import { handleStats, handleLeaderboard } from "./handlers/stats.js";
import { handleHelp } from "./handlers/help.js";
import { Suit } from "../game/Card.js";
import { logger } from "../utils/logger.js";

export function createBot(token: string): Bot<BotContext> {
  const bot = new Bot<BotContext>(token);

  // Session middleware
  bot.use(
    session<SessionData, BotContext>({
      initial: initialSession,
    })
  );

  // Error handler
  bot.catch((err) => {
    const e = err.error;
    logger.error(
      {
        message: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
        update: JSON.stringify(err.ctx?.update),
      },
      "Bot error"
    );
  });

  // Commands
  bot.command("start", handleStart);

  // Callback queries
  bot.callbackQuery("main_menu", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleMainMenu(ctx);
  });

  bot.callbackQuery("new_game", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleNewGame(ctx);
  });

  bot.callbackQuery("show_stats", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleStats(ctx);
  });

  bot.callbackQuery("show_leaderboard", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleLeaderboard(ctx);
  });

  bot.callbackQuery("how_to_play", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleHelp(ctx);
  });

  // Game start with bot count
  bot.callbackQuery(/^start_game:(\d)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const botCount = parseInt(ctx.match![1], 10);
    if (botCount < 1 || botCount > 3) return;
    await handleStartGame(ctx, botCount);
  });

  // Card toggle
  bot.callbackQuery(/^card:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleCardToggle(ctx, ctx.match![1]);
  });

  // Play selected
  bot.callbackQuery("play_selected", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handlePlaySelected(ctx);
  });

  // Draw card
  bot.callbackQuery("draw_card", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleDrawCard(ctx);
  });

  // CRAZY! call
  bot.callbackQuery("call_crazy", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleCrazyCall(ctx);
  });

  // Suit pick
  bot.callbackQuery(/^suit:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const suit = ctx.match![1] as Suit;
    await handleSuitPick(ctx, suit);
  });

  // Play again
  bot.callbackQuery("play_again", async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleNewGame(ctx);
  });

  return bot;
}
