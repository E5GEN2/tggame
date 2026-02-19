import { InlineKeyboard } from "grammy";
import { Card, cardId, Suit, SUITS } from "../../game/Card.js";
import { GameState } from "../../game/GameState.js";
import { currentPlayer, topCard } from "../../game/TurnManager.js";
import {
  renderCard,
  renderCardButton,
  renderSuit,
  renderSuitButton,
} from "./cardRenderer.js";

interface RenderResult {
  text: string;
  keyboard: InlineKeyboard;
}

export function renderGameScreen(
  state: GameState,
  humanId: string,
  selectedCards: Set<string>,
  suitPickMode: boolean = false
): RenderResult {
  const top = topCard(state);
  const current = currentPlayer(state);
  const dirArrow = state.direction === 1 ? "➡️" : "⬅️";

  let text = "";
  text += `🎴 <b>CRAZY GRID</b>\n\n`;
  text += `🃏 Top: <b>${esc(renderCard(top))}</b>  |  Suit: ${renderSuit(state.activeSuit)}  |  ${dirArrow}\n`;

  if (state.pendingDraw > 0) {
    text += `⚠️ <b>+${state.pendingDraw} cards pending!</b>\n`;
  }
  text += `\n`;

  for (let i = 0; i < state.players.length; i++) {
    const p = state.players[i];
    const cardCount = state.hands[p.id].length;
    const turnMark = i === state.currentPlayerIndex ? "👉 " : "    ";
    const botTag = p.isBot ? ` 🤖` : "";
    const crazyMark = cardCount === 1 && state.calledCrazy[p.id] ? " 🔴CRAZY!" : "";
    text += `${turnMark}${esc(p.name)}${botTag}: ${cardCount} cards${crazyMark}\n`;
  }
  text += `\n`;

  text += `💬 <i>${esc(state.lastAction)}</i>\n`;

  const keyboard = new InlineKeyboard();

  if (state.gameOver) {
    keyboard.text("🔄 Play Again", "play_again").text("🏠 Main Menu", "main_menu");
    return { text, keyboard };
  }

  if (suitPickMode) {
    text += `\n🎨 <b>Pick a suit:</b>`;
    for (const suit of SUITS) {
      keyboard.text(renderSuitButton(suit), `suit:${suit}`);
    }
    return { text, keyboard };
  }

  const isHumanTurn = current.id === humanId;

  if (isHumanTurn) {
    text += `\n🖐️ <b>Your hand:</b>`;
    const hand = state.hands[humanId];

    for (let i = 0; i < hand.length; i++) {
      const card = hand[i];
      const id = cardId(card);
      const selected = selectedCards.has(id);
      const label = renderCardButton(card, selected);
      if (i % 3 === 0) keyboard.row();
      keyboard.text(label, `card:${id}`);
    }

    keyboard.row();

    if (selectedCards.size > 0) {
      keyboard.text("▶️ Play Selected", "play_selected");
    }
    keyboard.text("📥 Draw Card", "draw_card");

    const handSize = hand.length;
    if (handSize <= 2 && !state.calledCrazy[humanId]) {
      keyboard.row().text("🔴 CRAZY!", "call_crazy");
    }
  } else {
    text += `\n⏳ <i>${esc(current.name)} is thinking...</i>`;
  }

  return { text, keyboard };
}

export function renderGameOver(
  state: GameState,
  humanId: string,
  eloChange: number,
  coinsEarned: number
): RenderResult {
  const winner = state.players.find((p) => p.id === state.winnerId);
  const humanWon = state.winnerId === humanId;

  let text = `🎴 <b>CRAZY GRID — GAME OVER</b>\n\n`;

  if (humanWon) {
    text += `🏆 <b>You win!</b> Congratulations! 🎉\n\n`;
  } else {
    text += `😔 <b>${esc(winner?.name || "Bot")} wins!</b>\n\n`;
  }

  const sorted = [...state.players].sort(
    (a, b) => state.hands[a.id].length - state.hands[b.id].length
  );
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];
    const medals = ["🥇", "🥈", "🥉", "4️⃣"];
    const cards = state.hands[p.id].length;
    text += `${medals[i]} ${esc(p.name)}: ${cards} cards left\n`;
  }

  text += `\n`;
  const sign = eloChange >= 0 ? "+" : "";
  text += `📊 ELO: ${sign}${eloChange}\n`;
  text += `🪙 Coins: +${coinsEarned}\n`;

  const keyboard = new InlineKeyboard()
    .text("🔄 Play Again", "play_again")
    .text("🏠 Main Menu", "main_menu");

  return { text, keyboard };
}

export function renderMainMenu(): RenderResult {
  const text =
    `🎴 <b>CRAZY GRID</b>\n\n` +
    `Welcome to Crazy Grid! A fast-paced card game ` +
    `inspired by Crazy Eights.\n\n` +
    `Match cards by suit or rank, use special cards ` +
    `strategically, and don't forget to call CRAZY! 🔴`;

  const keyboard = new InlineKeyboard()
    .text("🎮 New Game", "new_game")
    .text("📊 Stats", "show_stats")
    .row()
    .text("🏆 Leaderboard", "show_leaderboard")
    .text("❓ How to Play", "how_to_play");

  return { text, keyboard };
}

export function renderOpponentPicker(): RenderResult {
  const text = `🎴 <b>NEW GAME</b>\n\nHow many bots do you want to play against?`;

  const keyboard = new InlineKeyboard()
    .text("1 Bot 🤖", "start_game:1")
    .text("2 Bots 🤖🤖", "start_game:2")
    .text("3 Bots 🤖🤖🤖", "start_game:3")
    .row()
    .text("⬅️ Back", "main_menu");

  return { text, keyboard };
}

/** Escape HTML special characters. */
function esc(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
