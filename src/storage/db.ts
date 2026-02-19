import pg from "pg";
import { DATABASE_URL } from "../config.js";
import { logger } from "../utils/logger.js";

let pool: pg.Pool;

export function getPool(): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL.includes("railway")
        ? { rejectUnauthorized: false }
        : undefined,
    });
    logger.info("PostgreSQL pool created");
  }
  return pool;
}

export async function initDb(): Promise<void> {
  const p = getPool();
  await p.query(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      username TEXT,
      first_name TEXT NOT NULL,
      elo INTEGER NOT NULL DEFAULT 1000,
      coins INTEGER NOT NULL DEFAULT 0,
      games_played INTEGER NOT NULL DEFAULT 0,
      wins INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS game_history (
      id SERIAL PRIMARY KEY,
      player_id TEXT NOT NULL REFERENCES players(id),
      won BOOLEAN NOT NULL,
      elo_change INTEGER NOT NULL,
      coins_earned INTEGER NOT NULL,
      bot_count INTEGER NOT NULL,
      played_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  logger.info("Database schema initialized");
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    logger.info("Database pool closed");
  }
}
