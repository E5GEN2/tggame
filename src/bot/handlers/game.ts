import { BotContext } from "../context.js";
import { Card, cardId, parseCardId, Suit } from "../../game/Card.js";
import { GameState, Player } from "../../game/GameState.js";
import {
  createGame,
  playCards,
  drawCards,
  pickSuit,
  callCrazy,
  getPlayableCards,
} from "../../game/GameSession.js";
import { currentPlayer, topCard } from "../../game/TurnManager.js";
import {
  renderGameScreen,
  renderGameOver,
  renderOpponentPicker,
} from "../renderers/gameRenderer.js";
import { pickBotProfiles, createBotPlayer } from "../../ai/botProfiles.js";
import { BotDecision } from "../../ai/BotPlayer.js";
import { ensurePlayer, recordGameResult } from "../../storage/playerRepo.js";
import { calculateEloChange } from "../../utils/elo.js";
import {
  BOT_RATINGS,
  BOT_THINK_MIN_MS,
  BOT_THINK_MAX_MS,
  COINS_PARTICIPATION,
  COINS_WIN_1BOT,
  COINS_WIN_2BOT,
  COINS_WIN_3BOT,
} from "../../utils/constants.js";
import { logger } from "../../utils/logger.js";

/** Show the opponent picker screen. */
export async function handleNewGame(ctx: BotContext): Promise<void> {
  const { text, keyboard } = renderOpponentPicker();
  await ctx.editMessageText(text, {
    parse_mode: "MarkdownV2",
    reply_markup: keyboard,
  });
}

/** Start the actual game with N bots. */
export async function handleStartGame(
  ctx: BotContext,
  botCount: number
): Promise<void> {
  const user = ctx.from!;
  ensurePlayer(String(user.id), user.username || null, user.first_name);

  const humanPlayer: Player = {
    id: String(user.id),
    name: user.first_name,
    isBot: false,
  };

  const profiles = pickBotProfiles(botCount);
  const botPlayers: Player[] = profiles.map((p, i) => ({
    id: `bot_${i}`,
    name: `${p.emoji} ${p.name}`,
    isBot: true,
    botPersonality: p.personality,
  }));

  const players = [humanPlayer, ...botPlayers];
  const state = createGame(players);

  ctx.session.gameState = state;
  ctx.session.selectedCards = [];

  await updateGameMessage(ctx, state, false);

  // If first turn is a bot, process it
  if (currentPlayer(state).isBot) {
    await processBotTurns(ctx);
  }
}

/** Toggle a card selection. */
export async function handleCardToggle(
  ctx: BotContext,
  cardIdStr: string
): Promise<void> {
  const state = ctx.session.gameState;
  if (!state || state.gameOver) return;

  const humanId = String(ctx.from!.id);
  const current = currentPlayer(state);
  if (current.id !== humanId) return;

  const selected = ctx.session.selectedCards;
  const idx = selected.indexOf(cardIdStr);
  if (idx >= 0) {
    selected.splice(idx, 1);
  } else {
    // For combos: all selected must be same rank
    const newCard = parseCardId(cardIdStr);
    if (selected.length > 0) {
      const firstCard = parseCardId(selected[0]);
      if (firstCard.rank !== newCard.rank) {
        // Different rank — replace selection
        ctx.session.selectedCards = [cardIdStr];
        await updateGameMessage(ctx, state, false);
        return;
      }
    }
    selected.push(cardIdStr);
  }

  await updateGameMessage(ctx, state, false);
}

/** Play the selected cards. */
export async function handlePlaySelected(ctx: BotContext): Promise<void> {
  const state = ctx.session.gameState;
  if (!state || state.gameOver) return;

  const humanId = String(ctx.from!.id);
  const current = currentPlayer(state);
  if (current.id !== humanId) return;

  const selected = ctx.session.selectedCards;
  if (selected.length === 0) {
    await ctx.answerCallbackQuery({ text: "Select cards first!" });
    return;
  }

  const cards = selected.map(parseCardId);
  const result = playCards(state, cards);

  if (!result.success) {
    await ctx.answerCallbackQuery({ text: result.error || "Invalid play!" });
    return;
  }

  ctx.session.selectedCards = [];

  if (result.needsSuitPick) {
    await updateGameMessage(ctx, state, true);
    return;
  }

  if (state.gameOver) {
    await handleGameOver(ctx, state);
    return;
  }

  await updateGameMessage(ctx, state, false);

  // Process bot turns
  if (currentPlayer(state).isBot) {
    await processBotTurns(ctx);
  }
}

/** Handle suit pick after wild 8. */
export async function handleSuitPick(
  ctx: BotContext,
  suit: Suit
): Promise<void> {
  const state = ctx.session.gameState;
  if (!state || state.gameOver) return;

  pickSuit(state, suit);

  if (state.gameOver) {
    await handleGameOver(ctx, state);
    return;
  }

  await updateGameMessage(ctx, state, false);

  if (currentPlayer(state).isBot) {
    await processBotTurns(ctx);
  }
}

/** Handle draw card. */
export async function handleDrawCard(ctx: BotContext): Promise<void> {
  const state = ctx.session.gameState;
  if (!state || state.gameOver) return;

  const humanId = String(ctx.from!.id);
  const current = currentPlayer(state);
  if (current.id !== humanId) return;

  const drawn = drawCards(state);
  ctx.session.selectedCards = [];

  await updateGameMessage(ctx, state, false);

  if (currentPlayer(state).isBot) {
    await processBotTurns(ctx);
  }
}

/** Handle CRAZY! call. */
export async function handleCrazyCall(ctx: BotContext): Promise<void> {
  const state = ctx.session.gameState;
  if (!state || state.gameOver) return;

  const humanId = String(ctx.from!.id);
  const success = callCrazy(state, humanId);

  if (success) {
    await ctx.answerCallbackQuery({ text: "🔴 CRAZY! called!" });
    await updateGameMessage(ctx, state, false);
  } else {
    await ctx.answerCallbackQuery({ text: "You can only call CRAZY with 1 card!" });
  }
}

/** Process all bot turns until it's the human's turn again. */
async function processBotTurns(ctx: BotContext): Promise<void> {
  const state = ctx.session.gameState!;
  const humanId = String(ctx.from!.id);

  let safetyCounter = 0;
  while (
    !state.gameOver &&
    currentPlayer(state).isBot &&
    safetyCounter < 20
  ) {
    safetyCounter++;
    const bot = currentPlayer(state);

    // Thinking delay
    const delay =
      BOT_THINK_MIN_MS +
      Math.random() * (BOT_THINK_MAX_MS - BOT_THINK_MIN_MS);
    await sleep(delay);

    const hand = state.hands[bot.id];
    const personality = bot.botPersonality || "chaotic";
    const ai = createBotPlayer(personality as any);
    const decision: BotDecision = ai.decide(hand, state, bot.id);

    if (decision.callCrazy) {
      callCrazy(state, bot.id);
    }

    if (decision.action === "play" && decision.cards) {
      const result = playCards(state, decision.cards);
      if (result.success && result.needsSuitPick && decision.suitPick) {
        pickSuit(state, decision.suitPick);
      } else if (!result.success) {
        // Fallback: draw
        logger.warn({ bot: bot.name, error: result.error }, "Bot play failed, drawing");
        drawCards(state);
      }
    } else {
      drawCards(state);
    }

    // Update message to show bot's action
    if (!state.gameOver) {
      try {
        await updateGameMessage(ctx, state, false);
      } catch (e) {
        // Rate limit or message not modified — skip
      }
    }
  }

  if (state.gameOver) {
    await handleGameOver(ctx, state);
  }
}

/** Handle end of game — record stats and show results. */
async function handleGameOver(
  ctx: BotContext,
  state: GameState
): Promise<void> {
  const humanId = String(ctx.from!.id);
  const humanWon = state.winnerId === humanId;
  const botCount = state.players.filter((p) => p.isBot).length;

  // Calculate ELO
  const opponentRatings = state.players
    .filter((p) => p.isBot)
    .map((p) => {
      const diff = p.botPersonality === "aggressive" ? "hard" : p.botPersonality === "defensive" ? "medium" : "easy";
      return BOT_RATINGS[diff] || 1000;
    });

  const player = ensurePlayer(
    humanId,
    ctx.from!.username || null,
    ctx.from!.first_name
  );
  const eloChange = calculateEloChange(player.elo, opponentRatings, humanWon);

  // Calculate coins
  let coins = COINS_PARTICIPATION;
  if (humanWon) {
    if (botCount === 1) coins += COINS_WIN_1BOT;
    else if (botCount === 2) coins += COINS_WIN_2BOT;
    else coins += COINS_WIN_3BOT;
  }

  recordGameResult(humanId, humanWon, eloChange, coins, botCount);

  const { text, keyboard } = renderGameOver(state, humanId, eloChange, coins);

  try {
    await ctx.editMessageText(text, {
      parse_mode: "MarkdownV2",
      reply_markup: keyboard,
    });
  } catch {
    // Message may have been deleted
  }

  ctx.session.gameState = null;
  ctx.session.selectedCards = [];
}

/** Update the game message with current state. */
async function updateGameMessage(
  ctx: BotContext,
  state: GameState,
  suitPickMode: boolean
): Promise<void> {
  const humanId = String(ctx.from!.id);
  const selectedSet = new Set(ctx.session.selectedCards);
  const { text, keyboard } = renderGameScreen(
    state,
    humanId,
    selectedSet,
    suitPickMode
  );

  try {
    await ctx.editMessageText(text, {
      parse_mode: "MarkdownV2",
      reply_markup: keyboard,
    });
  } catch {
    // "message is not modified" or rate limit
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
