import { APIGatewayProxyEvent } from "aws-lambda";
import {
  GameDTO,
  GameResultItem,
  Season,
  SeasonPlayer,
} from "../../services/types";
import * as createGameResultModule from "../../services/createGameResult";
import * as getSeasonModule from "../../data/getSeason";
import * as createPlayerModule from "../../data/createPlayer";
import * as getPlayerModule from "../../data/getPlayer";
import SpyInstance = jest.SpyInstance;
import { updateELORatings } from "../../services/createGameResult";

const { handler } = createGameResultModule;

describe("createGameResults", () => {
  beforeAll(() => {
    setup();
  });

  afterAll(() => {
    teardown();
  });

  describe("handler", () => {
    it("should return status 500 when the given season does not exist", async () => {
      getSeasonMock.mockResolvedValueOnce(null);

      const body: GameDTO = {
        seasonId: "season#does-not-exist",
        results: [
          {
            playerId: null,
            playerName: "Doug Judy",
            points: 13,
          },
          {
            playerId: null,
            playerName: "Trudy Judy",
            points: 21,
          },
        ],
      };

      const event: APIGatewayProxyEvent = {
        body: JSON.stringify(body),
      } as any;

      const act = await handler(event);

      expect(act.statusCode).toBe(500);
      expect(JSON.parse(act.body).description).toBe(
        "A season with id season#does-not-exist does not exist"
      );
    });

    it("should create a game when three new players play", async () => {
      const body: GameDTO = {
        seasonId: "season#001",
        results: [
          {
            playerId: null,
            playerName: "Doug Judy",
            points: 13,
          },
          {
            playerId: null,
            playerName: "Trudy Judy",
            points: 21,
          },
          {
            playerId: null,
            playerName: "Abed Nadir",
            points: 4,
          },
        ],
      };

      // Mock createPlayer to return Trudy Judy from above
      const playerOne: SeasonPlayer = createMockSeasonPlayer(
        "player#001",
        "Doug Judy"
      );
      const playerTwo: SeasonPlayer = createMockSeasonPlayer(
        "player#002",
        "Trudy Judy"
      );
      const playerThree: SeasonPlayer = createMockSeasonPlayer(
        "player#003",
        "Abed Nadir"
      );
      createPlayerMock.mockResolvedValueOnce(playerOne);
      createPlayerMock.mockResolvedValueOnce(playerTwo);
      createPlayerMock.mockResolvedValueOnce(playerThree);

      const event: APIGatewayProxyEvent = {
        body: JSON.stringify(body),
      } as any;

      const act = await handler(event);

      expect(act.statusCode).toBe(200);
      expect(JSON.parse(act.body)).toStrictEqual({
        id: "game#001",
      });
    });

    it("should create a game when an existing player and a new player play", async () => {
      const body: GameDTO = {
        seasonId: "season#001",
        results: [
          {
            playerId: "player#001",
            playerName: "Doug Judy",
            points: 13,
          },
          {
            playerId: null,
            playerName: "Trudy Judy",
            points: 21,
          },
        ],
      };

      // Mock createPlayer to return Trudy Judy from above
      const seasonPlayer: SeasonPlayer = {
        pk1: "player#002",
        sk1: "season#001",
        pk2: "season#001",
        sk2: "player#002",
        type: "player",

        name: "Trudy Judy",
        createdAt: "2022-07-03T19:07:16.211Z",
        season: "season#001",
        elo: 1200,
        gamesPlayed: 1,
      };
      createPlayerMock.mockResolvedValueOnce(seasonPlayer);

      const event: APIGatewayProxyEvent = {
        body: JSON.stringify(body),
      } as any;

      const act = await handler(event);

      expect(act.statusCode).toBe(200);
      expect(JSON.parse(act.body)).toStrictEqual({
        id: "game#001",
      });
    });
  });

  describe("updateELORatings", () => {
    const winner: GameResultItem = {
      player: {
        id: "winner",
        name: "Winner",
      },
      points: 22,
      eloBeforeGame: 1200,
      eloAfterGame: 0,
    };
    const loser: GameResultItem = {
      player: {
        id: "loser",
        name: "Loser",
      },
      points: 1,
      eloBeforeGame: 1200,
      eloAfterGame: 0,
    };

    it("should calculate ELO ratings when the first player beats the second player", () => {
      const gameResultItems: GameResultItem[] = [winner, loser];

      const act = updateELORatings(gameResultItems);

      const winnerElo = act.find(
        (gameResultItem) => gameResultItem.player.id === "winner"
      )!.eloAfterGame;
      const loserElo = act.find(
        (gameResultItem) => gameResultItem.player.id === "loser"
      )!.eloAfterGame;

      expect(winnerElo).toBeGreaterThan(loserElo);
    });

    it("should calculate ELO ratings when the second player beats the first player", () => {
      const gameResultItems: GameResultItem[] = [loser, winner];

      const act = updateELORatings(gameResultItems);

      const winnerElo = act.find(
        (gameResultItem) => gameResultItem.player.id === "winner"
      )!.eloAfterGame;
      const loserElo = act.find(
        (gameResultItem) => gameResultItem.player.id === "loser"
      )!.eloAfterGame;

      expect(winnerElo).toBeGreaterThan(loserElo);
    });

    it("should calculate ELO ratings when two players tie", () => {
      const gameResultItems: GameResultItem[] = [
        { ...winner, player: { id: "first-player", name: "First Player" } },
        { ...winner, player: { id: "second-player", name: "Second Player" } },
      ];

      const act = updateELORatings(gameResultItems);

      const firstElo = act.find(
        (gameResultItem) => gameResultItem.player.id === "first-player"
      )!.eloAfterGame;
      const secondElo = act.find(
        (gameResultItem) => gameResultItem.player.id === "second-player"
      )!.eloAfterGame;

      expect(firstElo).toEqual(secondElo);
    });
  });
});

// Test setup

const { env: originalEnv } = process;

let getSeasonMock: SpyInstance;
let createPlayerMock: SpyInstance;
let getPlayerMock: SpyInstance;
let writeToDatabaseMock: SpyInstance;

/**
 * Sets up mocked functions etc.
 */
const setup = () => {
  process.env.TABLE_NAME = "TEST_TABLE_NAME";
  mockGetSeason();
  mockCreatePlayer();
  mockGetPlayer();
  mockWriteToDatabase();
};

/**
 * Restores all mocks and other configurations
 */
const teardown = () => {
  process.env = { ...originalEnv };
  jest.restoreAllMocks();
};

/**
 * Mocks the getSeason function
 */
const mockGetSeason = () => {
  const seasonMock: Season = {
    pk1: "season#001",
    sk1: "season",
    pk3: "season",
    name: "Test Season for createGameResults Test",
    startDate: "2022-07-03T19:07:16.211Z",
    endDate: "2022-12-03T19:07:16.211Z",
    config: {
      startingElo: 1200,
      k: 32,
      d: 400,
    },
    type: "season",
    createdAt: "2022-07-03T19:07:16.211Z",
  };

  getSeasonMock = jest
    .spyOn(getSeasonModule, "getSeason")
    .mockResolvedValue(seasonMock);
};

/**
 * Mocks the createPlayer function
 */
const mockCreatePlayer = () => {
  const seasonPlayer: SeasonPlayer = {
    pk1: "player#900",
    sk1: "season#001",
    pk2: "season#001",
    sk2: "player#900",
    type: "player",

    name: "Created Player Name",
    createdAt: "2022-07-03T19:07:16.211Z",
    season: "season#001",
    elo: 1200,
    gamesPlayed: 1,
  };

  createPlayerMock = jest
    .spyOn(createPlayerModule, "createPlayer")
    .mockResolvedValue(seasonPlayer);
};

const mockGetPlayer = () => {
  const seasonPlayer: SeasonPlayer = {
    pk1: "player#001",
    sk1: "season#001",
    pk2: "season#001",
    sk2: "player#001",
    type: "player",

    name: "Existing Player Name",
    createdAt: "2022-07-03T19:07:16.211Z",
    season: "season#001",
    elo: 1200,
    gamesPlayed: 1,
  };

  getPlayerMock = jest
    .spyOn(getPlayerModule, "getPlayer")
    .mockResolvedValue(seasonPlayer);
};

const mockWriteToDatabase = () => {
  writeToDatabaseMock = jest
    .spyOn(createGameResultModule, "writeToDatabase")
    .mockResolvedValue("game#001");
};

const createMockSeasonPlayer = (
  id: string,
  name: string,
  seasonId = "season#001"
) => ({
  pk1: id,
  sk1: seasonId,
  pk2: seasonId,
  sk2: id,
  type: "player",

  name,
  createdAt: "2022-07-03T19:07:16.211Z",
  season: seasonId,
  elo: 1200,
  gamesPlayed: 0,
});
