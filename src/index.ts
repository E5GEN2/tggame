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

await initDb();

const bot = createBot(BOT_TOKEN);

// Retry loop: wait for any previous instance to fully stop
async function startWithRetry(maxRetries = 10, delayMs = 5000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await bot.api.deleteWebhook({ drop_pending_updates: true });
      logger.info({ attempt }, "Cleared pending updates, starting poll...");

      await bot.start({
        onStart: (info) => {
          logger.info({ username: info.username }, "Bot started");
        },
      });
      return;
    } catch (err: any) {
      if (err?.error_code === 409 || err?.description?.includes("409")) {
        logger.warn({ attempt, maxRetries }, "409 conflict, old instance still polling. Retrying...");
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        throw err;
      }
    }
  }
  logger.fatal("Failed to start after max retries");
  process.exit(1);
}

startWithRetry();

// Graceful shutdown
async function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down...");
  bot.stop();
  await closeDb();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
