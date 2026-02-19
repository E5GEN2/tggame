import { BOT_TOKEN } from "./config.js";
import { createBot } from "./bot/bot.js";
import { getDb, closeDb } from "./storage/db.js";
import { logger } from "./utils/logger.js";

if (!BOT_TOKEN) {
  logger.fatal("BOT_TOKEN environment variable is required");
  process.exit(1);
}

// Initialize database
getDb();

// Create and start bot
const bot = createBot(BOT_TOKEN);

bot.start({
  onStart: (info) => {
    logger.info({ username: info.username }, "Bot started");
  },
});

// Graceful shutdown
function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down...");
  bot.stop();
  closeDb();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
