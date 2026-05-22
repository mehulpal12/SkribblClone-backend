export interface Player {
  id: string;
  playerId: string;
  name: string;
  score: number;
}

export class ScoreManager {
  private static readonly SCORE_TABLE = [
    100,
    80,
    60,
    40,
    20,
  ];

  private static readonly DEDUCT_POINTS =
    10;

  static awardPoints(
    players: Player[],
    socketId: string,
    guessOrder: number
  ): number {
    const player =
      players.find(
        (p) =>
          p.id === socketId
      );

    if (!player) {
      console.warn(
        `Player not found: ${socketId}`
      );
      return 0;
    }

    const points =
      this.SCORE_TABLE[
        Math.max(0, guessOrder)
      ] ?? 10;

    player.score += points;

    return points;
  }

static deductPoints(
  players: Player[],
  socketId: string
): void {
  const player =
    players.find(
      (p) =>
        p.id === socketId
    );

  if (!player) {
    console.log(
      "PLAYER NOT FOUND"
    );
    return;
  }

  console.log(
    "BEFORE:",
    player.score
  );

  player.score = Math.max(
    0,
    player.score - 10
  );

  console.log(
    "AFTER:",
    player.score
  );
}

  static leaderboard(
    players: Player[]
  ): Player[] {
    return [...players].sort(
      (a, b) =>
        b.score - a.score
    );
  }

  static resetScores(
    players: Player[]
  ): void {
    players.forEach((p) => {
      p.score = 0;
    });
  }
}