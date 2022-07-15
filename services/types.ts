export interface DatabaseItem {
  pk1: string;
  readonly createdAt: string;
  type: string;
}

/**
 * Describes a player in a single season
 */
export interface SeasonPlayer extends DatabaseItem {
  sk1: string;
  pk2: string;
  sk2: string;
  name: string;
  season: string;
  elo: number;
  gamesPlayed: number;
}

/**
 * Describes a season
 */
export interface Season extends DatabaseItem {
  sk1: string;
  name: string;
  startDate: string;
  endDate: string;
  config: {
    startingElo: number;
    k: number;
    d: number;
  };
}

/**
 * Data used to identify a player in a game results item
 */
export interface GameResultItemPlayer {
  id: string;
  name: string;
}

/**
 * Describes the results of a game from a single player's perspective
 */
export interface GameResultItem {
  player: GameResultItemPlayer;
  points: number;
  eloBeforeGame: number;
  eloAfterGame: number;
}

/**
 * Describes a single game that was played
 */
export interface Game extends DatabaseItem {
  sk1: string;
  pk2: string;
  sk2: string;

  playerIds: string[];
  results: GameResultItem[];
  season: Season;
}

/**
 * Game results received from the client
 */
export interface GameDTO {
  seasonId: string;
  results: {
    playerId: string | null;
    playerName: string;
    points: number;
  }[];
}
