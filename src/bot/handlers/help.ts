import { BotContext } from "../context.js";
import { InlineKeyboard } from "grammy";

const HELP_TEXT = `
❓ <b>HOW TO PLAY CRAZY GRID</b>

🎯 <b>Goal:</b> Be the first to empty your hand!

🃏 <b>Basic Rules:</b>
• Match the top card by <b>suit</b> or <b>rank</b>
• Can't play? Draw a card from the pile

⚡ <b>Special Cards:</b>
• <b>2</b> — Next player draws 2 (stackable!)
• <b>8</b> — Wild! Pick any suit
• <b>J</b> — Skip next player
• <b>Q</b> — Reverse direction
• <b>K</b> — Next player draws 1
• <b>A</b> — Play again!

💥 <b>Combos:</b>
Play multiple cards of the <b>same rank</b> at once!
Effects multiply (e.g. two 2s = draw 4)

🔴 <b>CRAZY! Call:</b>
When you're down to 1 card, press CRAZY!
Forget and you'll draw 2 penalty cards!

📊 <b>Progression:</b>
Win games to earn coins and climb the ELO rankings!
`.trim();

export async function handleHelp(ctx: BotContext): Promise<void> {
  const keyboard = new InlineKeyboard().text("⬅️ Back", "main_menu");

  await ctx.editMessageText(HELP_TEXT, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
}
