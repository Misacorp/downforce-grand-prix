import { handler } from "../../services/createGameResult";
import { APIGatewayProxyEvent } from "aws-lambda";
import { GameDTO, Season } from "../../services/types";
import * as getSeasonModule from "../../data/getSeason";
import SpyInstance = jest.SpyInstance;

describe("createGameResults", () => {
  beforeAll(() => {
    setupMocks();
  });

  afterAll(() => {
    teardownMocks();
  });

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
});

// Test setup

const { env: originalEnv } = process;

let getSeasonMock: SpyInstance;

/**
 * Sets up mocked functions etc.
 */
const setupMocks = () => {
  process.env.TABLE_NAME = "TEST_TABLE_NAME";
  mockGetSeason();
};

/**
 * Restores all mocks and other configurations
 */
const teardownMocks = () => {
  process.env = { ...originalEnv };
  getSeasonMock.mockRestore();
};

/**
 * Mocks the getSeason function
 */
const mockGetSeason = () => {
  const seasonMock: Season = {
    pk1: "season#001",
    sk1: "season",
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
