/**
 * Calculate ELO rating change for a multiplayer game result.
 * playerRating: current ELO of the human player
 * opponentRatings: phantom ratings of bots
 * playerWon: did the human player win?
 * K-factor: 32 (standard)
 */
export function calculateEloChange(
  playerRating: number,
  opponentRatings: number[],
  playerWon: boolean
): number {
  const K = 32;
  let totalChange = 0;

  for (const oppRating of opponentRatings) {
    const expected = 1 / (1 + Math.pow(10, (oppRating - playerRating) / 400));
    const actual = playerWon ? 1 : 0;
    totalChange += K * (actual - expected);
  }

  // Average over opponents
  return Math.round(totalChange / opponentRatings.length);
}
