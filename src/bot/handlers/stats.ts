import { InlineKeyboard } from "grammy";
import { BotContext } from "../context.js";
import { getPlayer } from "../../storage/playerRepo.js";
import { getLeaderboard, getPlayerRank } from "../../storage/leaderboardRepo.js";

export async function handleStats(ctx: BotContext): Promise<void> {
  const userId = String(ctx.from!.id);
  const player = await getPlayer(userId);
  const keyboard = new InlineKeyboard().text("⬅️ Back", "main_menu");

  if (!player || player.games_played === 0) {
    await ctx.editMessageText(
      `📊 <b>YOUR STATS</b>\n\nNo games played yet! Start a game to build your stats.`,
      { parse_mode: "HTML", reply_markup: keyboard }
    );
    return;
  }

  const winRate =
    player.games_played > 0
      ? ((player.wins / player.games_played) * 100).toFixed(1)
      : "0.0";

  const rank = await getPlayerRank(userId);
  const rankText = rank ? `#${rank}` : "N/A";

  const text =
    `📊 <b>YOUR STATS</b>\n\n` +
    `🏅 Rank: <b>${rankText}</b>\n` +
    `📈 ELO: <b>${player.elo}</b>\n` +
    `🪙 Coins: <b>${player.coins}</b>\n` +
    `🎮 Games: <b>${player.games_played}</b>\n` +
    `🏆 Wins: <b>${player.wins}</b>\n` +
    `📊 Win Rate: <b>${winRate}%</b>`;

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
}

export async function handleLeaderboard(ctx: BotContext): Promise<void> {
  const entries = await getLeaderboard(10);
  const keyboard = new InlineKeyboard().text("⬅️ Back", "main_menu");

  if (entries.length === 0) {
    await ctx.editMessageText(
      `🏆 <b>LEADERBOARD</b>\n\nNo players yet! Be the first to play.`,
      { parse_mode: "HTML", reply_markup: keyboard }
    );
    return;
  }

  const medals = ["🥇", "🥈", "🥉"];
  let text = `🏆 <b>LEADERBOARD</b>\n\n`;

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const prefix = i < 3 ? medals[i] : `${i + 1}.`;
    const name = esc(e.first_name);
    const winRate =
      e.games_played > 0
        ? ((e.wins / e.games_played) * 100).toFixed(0)
        : "0";
    text += `${prefix} <b>${name}</b> — ${e.elo} ELO (${winRate}% WR)\n`;
  }

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
