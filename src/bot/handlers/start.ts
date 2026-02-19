import { BotContext } from "../context.js";
import { renderMainMenu } from "../renderers/gameRenderer.js";
import { ensurePlayer } from "../../storage/playerRepo.js";

export async function handleStart(ctx: BotContext): Promise<void> {
  const user = ctx.from!;
  ensurePlayer(
    String(user.id),
    user.username || null,
    user.first_name
  );

  const { text, keyboard } = renderMainMenu();

  const msg = await ctx.reply(text, {
    parse_mode: "MarkdownV2",
    reply_markup: keyboard,
  });

  ctx.session.gameMessageId = msg.message_id;
  ctx.session.gameState = null;
  ctx.session.selectedCards = [];
}

export async function handleMainMenu(ctx: BotContext): Promise<void> {
  const { text, keyboard } = renderMainMenu();

  ctx.session.gameState = null;
  ctx.session.selectedCards = [];

  await ctx.editMessageText(text, {
    parse_mode: "MarkdownV2",
    reply_markup: keyboard,
  });
}
