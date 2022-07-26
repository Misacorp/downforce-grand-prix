import { createGamePrimaryKey, createPlayerPrimaryKey } from "../data/utils";

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
 * Implementation of the SeasonPlayer interface.
 */
export class SeasonPlayerImplementation implements SeasonPlayer {
  pk1: string;
  createdAt: string;
  sk1: string;
  pk2: string;
  sk2: string;
  name: string;
  season: string;
  elo: number;
  gamesPlayed: number;
  type: string;

  constructor(
    season: Season,
    name: string,
    gamesPlayed: number = 0,
    elo: number = season.config.startingElo
  ) {
    const createdAt = new Date();
    const createdPlayerPk = createPlayerPrimaryKey(createdAt);

    this.pk1 = createdPlayerPk;
    this.sk1 = season.pk1;
    this.pk2 = season.pk1;
    this.sk2 = createdPlayerPk;
    this.type = "player";

    this.name = name;
    this.createdAt = createdAt.toISOString();
    this.season = season.pk1;
    this.elo = elo;
    this.gamesPlayed = gamesPlayed;
  }
}

export interface SeasonConfig {
  startingElo: number;
  k: number;
  d: number;
}

/**
 * Describes a season
 */
export interface Season extends DatabaseItem {
  sk1: string;
  pk3: string;
  name: string;
  startDate: string;
  endDate: string | null;
  config: SeasonConfig;
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
  placement: number;
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
 * Implementation of the Game interface
 */
export class GameImplementation implements Game {
  pk1: string;
  sk1: string;
  pk2: string;
  sk2: string;
  createdAt: string;
  type: string;
  playerIds: string[];
  results: GameResultItem[];
  season: Season;

  constructor(season: Season, results: GameResultItem[]) {
    const createdAt = new Date();
    const pk = createGamePrimaryKey(createdAt);

    this.pk1 = pk;
    this.sk1 = season.pk1;
    this.pk2 = season.pk1;
    this.sk2 = pk;

    this.createdAt = createdAt.toISOString();
    this.playerIds = results.map((playerResults) => playerResults.player.id);
    this.results = results;
    this.season = season;
    this.type = "game";
  }
}

/**
 * Game results received from the client
 */
export interface GameDTO {
  seasonId: string;
  results: {
    playerId: string | null;
    playerName: string;
    placement: number;
  }[];
}
