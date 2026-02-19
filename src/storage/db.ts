import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { dirname } from "path";
import { DB_PATH } from "../config.js";
import { logger } from "../utils/logger.js";

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    mkdirSync(dirname(DB_PATH), { recursive: true });
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initSchema(db);
    logger.info({ path: DB_PATH }, "Database initialized");
  }
  return db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      username TEXT,
      first_name TEXT,
      elo INTEGER NOT NULL DEFAULT 1000,
      coins INTEGER NOT NULL DEFAULT 0,
      games_played INTEGER NOT NULL DEFAULT 0,
      wins INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS game_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT NOT NULL,
      won INTEGER NOT NULL,
      elo_change INTEGER NOT NULL,
      coins_earned INTEGER NOT NULL,
      bot_count INTEGER NOT NULL,
      played_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (player_id) REFERENCES players(id)
    );
  `);
}

export function closeDb(): void {
  if (db) {
    db.close();
    logger.info("Database closed");
  }
}
