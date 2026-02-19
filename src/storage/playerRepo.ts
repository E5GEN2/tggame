import { getDb } from "./db.js";
import { DEFAULT_ELO } from "../utils/constants.js";

export interface PlayerRow {
  id: string;
  username: string | null;
  first_name: string;
  elo: number;
  coins: number;
  games_played: number;
  wins: number;
}

export function ensurePlayer(
  id: string,
  username: string | null,
  firstName: string
): PlayerRow {
  const db = getDb();

  const existing = db
    .prepare("SELECT * FROM players WHERE id = ?")
    .get(id) as PlayerRow | undefined;

  if (existing) {
    // Update name/username if changed
    db.prepare(
      "UPDATE players SET username = ?, first_name = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(username, firstName, id);
    return { ...existing, username, first_name: firstName };
  }

  db.prepare(
    "INSERT INTO players (id, username, first_name, elo) VALUES (?, ?, ?, ?)"
  ).run(id, username, firstName, DEFAULT_ELO);

  return {
    id,
    username,
    first_name: firstName,
    elo: DEFAULT_ELO,
    coins: 0,
    games_played: 0,
    wins: 0,
  };
}

export function getPlayer(id: string): PlayerRow | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM players WHERE id = ?").get(id) as
    | PlayerRow
    | undefined;
}

export function recordGameResult(
  playerId: string,
  won: boolean,
  eloChange: number,
  coinsEarned: number,
  botCount: number
): void {
  const db = getDb();

  db.prepare(
    `INSERT INTO game_history (player_id, won, elo_change, coins_earned, bot_count)
     VALUES (?, ?, ?, ?, ?)`
  ).run(playerId, won ? 1 : 0, eloChange, coinsEarned, botCount);

  db.prepare(
    `UPDATE players SET
       elo = MAX(0, elo + ?),
       coins = coins + ?,
       games_played = games_played + 1,
       wins = wins + ?,
       updated_at = datetime('now')
     WHERE id = ?`
  ).run(eloChange, coinsEarned, won ? 1 : 0, playerId);
}
