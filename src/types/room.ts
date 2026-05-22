export interface Player {
  id: string;          // socket.id
  playerId: string;    // persistent id from localStorage
  name: string;
  score: number;
}

export interface Stroke {
  prevPoint: {
    x: number;
    y: number;
  } | null;

  currentPoint: {
    x: number;
    y: number;
  };
}

export interface Room {
  id: string;
  hostId: string | null;

  players: Player[];

  strokes: any[];

  gameStarted: boolean;

  currentRound: number;
  maxRounds: number;

  currentDrawerIndex: number;
  currentDrawerId: string | null;

  currentWord: string | null;

  turnOrder: string[];

  guessedPlayers: string[];

  timeLeft: number;

  timer: NodeJS.Timeout | null;
}