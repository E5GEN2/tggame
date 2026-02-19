import { BotContext } from "../context.js";
import { InlineKeyboard } from "grammy";

const HELP_TEXT = `
❓ *HOW TO PLAY CRAZY GRID*

🎯 *Goal:* Be the first to empty your hand\\!

🃏 *Basic Rules:*
• Match the top card by *suit* or *rank*
• Can't play? Draw a card from the pile

⚡ *Special Cards:*
• *2* — Next player draws 2 \\(stackable\\!\\)
• *8* — Wild\\! Pick any suit
• *J* — Skip next player
• *Q* — Reverse direction
• *K* — Next player draws 1
• *A* — Play again\\!

💥 *Combos:*
Play multiple cards of the *same rank* at once\\!
Effects multiply \\(e\\.g\\. two 2s \\= draw 4\\)

🔴 *CRAZY\\! Call:*
When you're down to 1 card, press CRAZY\\!
Forget and you'll draw 2 penalty cards\\!

📊 *Progression:*
Win games to earn coins and climb the ELO rankings\\!
`.trim();

export async function handleHelp(ctx: BotContext): Promise<void> {
  const keyboard = new InlineKeyboard().text("⬅️ Back", "main_menu");

  await ctx.editMessageText(HELP_TEXT, {
    parse_mode: "MarkdownV2",
    reply_markup: keyboard,
  });
}
