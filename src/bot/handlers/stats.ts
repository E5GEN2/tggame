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
      `📊 *YOUR STATS*\n\nNo games played yet\\! Start a game to build your stats\\.`,
      { parse_mode: "MarkdownV2", reply_markup: keyboard }
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
    `📊 *YOUR STATS*\n\n` +
    `🏅 Rank: *${rankText}*\n` +
    `📈 ELO: *${player.elo}*\n` +
    `🪙 Coins: *${player.coins}*\n` +
    `🎮 Games: *${player.games_played}*\n` +
    `🏆 Wins: *${player.wins}*\n` +
    `📊 Win Rate: *${esc(winRate)}%*`;

  await ctx.editMessageText(text, {
    parse_mode: "MarkdownV2",
    reply_markup: keyboard,
  });
}

export async function handleLeaderboard(ctx: BotContext): Promise<void> {
  const entries = await getLeaderboard(10);
  const keyboard = new InlineKeyboard().text("⬅️ Back", "main_menu");

  if (entries.length === 0) {
    await ctx.editMessageText(
      `🏆 *LEADERBOARD*\n\nNo players yet\\! Be the first to play\\.`,
      { parse_mode: "MarkdownV2", reply_markup: keyboard }
    );
    return;
  }

  const medals = ["🥇", "🥈", "🥉"];
  let text = `🏆 *LEADERBOARD*\n\n`;

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const prefix = i < 3 ? medals[i] : `${i + 1}\\.`;
    const name = esc(e.first_name);
    const winRate =
      e.games_played > 0
        ? ((e.wins / e.games_played) * 100).toFixed(0)
        : "0";
    text += `${prefix} *${name}* — ${e.elo} ELO \\(${esc(winRate)}% WR\\)\n`;
  }

  await ctx.editMessageText(text, {
    parse_mode: "MarkdownV2",
    reply_markup: keyboard,
  });
}

function esc(s: string): string {
  return s.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}
