import { getPool } from "./db.js";
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

export async function ensurePlayer(
  id: string,
  username: string | null,
  firstName: string
): Promise<PlayerRow> {
  const pool = getPool();

  const { rows } = await pool.query<PlayerRow>(
    `INSERT INTO players (id, username, first_name, elo)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET
       username = EXCLUDED.username,
       first_name = EXCLUDED.first_name,
       updated_at = NOW()
     RETURNING *`,
    [id, username, firstName, DEFAULT_ELO]
  );

  return rows[0];
}

export async function getPlayer(id: string): Promise<PlayerRow | undefined> {
  const pool = getPool();
  const { rows } = await pool.query<PlayerRow>(
    "SELECT * FROM players WHERE id = $1",
    [id]
  );
  return rows[0];
}

export async function recordGameResult(
  playerId: string,
  won: boolean,
  eloChange: number,
  coinsEarned: number,
  botCount: number
): Promise<void> {
  const pool = getPool();

  await pool.query(
    `INSERT INTO game_history (player_id, won, elo_change, coins_earned, bot_count)
     VALUES ($1, $2, $3, $4, $5)`,
    [playerId, won, eloChange, coinsEarned, botCount]
  );

  await pool.query(
    `UPDATE players SET
       elo = GREATEST(0, elo + $1),
       coins = coins + $2,
       games_played = games_played + 1,
       wins = wins + $3,
       updated_at = NOW()
     WHERE id = $4`,
    [eloChange, coinsEarned, won ? 1 : 0, playerId]
  );
}
