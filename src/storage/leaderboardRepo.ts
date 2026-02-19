import { getDb } from "./db.js";

export interface LeaderboardEntry {
  id: string;
  first_name: string;
  username: string | null;
  elo: number;
  wins: number;
  games_played: number;
}

export function getLeaderboard(limit = 10): LeaderboardEntry[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, first_name, username, elo, wins, games_played
       FROM players
       WHERE games_played > 0
       ORDER BY elo DESC
       LIMIT ?`
    )
    .all(limit) as LeaderboardEntry[];
}

export function getPlayerRank(playerId: string): number | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT COUNT(*) + 1 as rank
       FROM players
       WHERE elo > (SELECT elo FROM players WHERE id = ?)
         AND games_played > 0`
    )
    .get(playerId) as { rank: number } | undefined;
  return row?.rank ?? null;
}
