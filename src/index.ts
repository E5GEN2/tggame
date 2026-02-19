import { BOT_TOKEN, DATABASE_URL } from "./config.js";
import { createBot } from "./bot/bot.js";
import { initDb, closeDb } from "./storage/db.js";
import { logger } from "./utils/logger.js";

if (!BOT_TOKEN) {
  logger.fatal("BOT_TOKEN environment variable is required");
  process.exit(1);
}

if (!DATABASE_URL) {
  logger.fatal("DATABASE_URL environment variable is required");
  process.exit(1);
}

// Initialize database then start bot
await initDb();

const bot = createBot(BOT_TOKEN);

bot.start({
  onStart: (info) => {
    logger.info({ username: info.username }, "Bot started");
  },
});

// Graceful shutdown
async function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down...");
  bot.stop();
  await closeDb();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
