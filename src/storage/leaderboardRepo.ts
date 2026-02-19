import { getPool } from "./db.js";

export interface LeaderboardEntry {
  id: string;
  first_name: string;
  username: string | null;
  elo: number;
  wins: number;
  games_played: number;
}

export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  const pool = getPool();
  const { rows } = await pool.query<LeaderboardEntry>(
    `SELECT id, first_name, username, elo, wins, games_played
     FROM players
     WHERE games_played > 0
     ORDER BY elo DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

export async function getPlayerRank(playerId: string): Promise<number | null> {
  const pool = getPool();
  const { rows } = await pool.query<{ rank: string }>(
    `SELECT COUNT(*) + 1 as rank
     FROM players
     WHERE elo > (SELECT elo FROM players WHERE id = $1)
       AND games_played > 0`,
    [playerId]
  );
  return rows[0] ? parseInt(rows[0].rank, 10) : null;
}
