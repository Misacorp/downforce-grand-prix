import { DynamoDB } from "aws-sdk";
import { getPlayer } from "../../data/getPlayer";
import { GetItemInput, GetItemOutput } from "aws-sdk/clients/dynamodb";

// Mock the AWS DynamoDB DocumentClient get function
const mockGet = jest.fn().mockImplementation((): GetItemOutput => ({}));

jest.mock("aws-sdk", () => ({
  DynamoDB: {
    DocumentClient: jest.fn().mockReturnValue({
      get: (args: GetItemInput) => ({
        promise: () => mockGet(args),
      }),
    }),
  },
}));

// Mock the console warn function
const mockConsoleWarn = jest.spyOn(console, "warn");

describe("getPlayer", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should call DocumentClient.get with the correct parameters", async () => {
    mockGet.mockReturnValueOnce({ Item: {} });

    // Act
    await getPlayer("player#137", "season#01", "TEST_TABLE_NAME");

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith({
      TableName: "TEST_TABLE_NAME",
      Key: {
        pk1: "player#137",
        sk1: "season#01",
      },
    });
  });

  it("should log a warning when attempting to get a player with an id that does not exist", async () => {
    mockGet.mockReturnValueOnce({ Item: undefined });
    mockConsoleWarn.mockImplementationOnce(() => undefined); // Don't log in jest output

    // Act
    await getPlayer("player#137", "season#01", "TEST_TABLE_NAME");

    expect(mockConsoleWarn).toHaveBeenCalledWith(
      "Tried to get a player with id player#137 in season season#01 but no player with that id in that season exists."
    );
  });

  it("should return null when attempting to get a player with an id that does not exist", async () => {
    mockGet.mockReturnValueOnce({ Item: undefined });
    mockConsoleWarn.mockImplementationOnce(() => undefined); // Don't log in jest output

    const act = await getPlayer("player#137", "season#01", "TEST_TABLE_NAME");

    expect(act).toBe(null);
  });

  it("should return player data", async () => {
    const mockSeason: DynamoDB.DocumentClient.AttributeMap = {
      pk1: { S: "player#137" },
      sk1: { S: "season#01" },
      type: { S: "player" },
      name: { S: "Magellan" },
      season: { S: "season#01" },
      elo: { N: 1337 },
      gamesPlayed: { N: 42 },
    };

    mockGet.mockReturnValueOnce({
      Item: mockSeason,
    });

    const act = await getPlayer("player#137", "season#01", "TEST_TABLE_NAME");

    expect(act).toStrictEqual({
      pk1: "player#137",
      sk1: "season#01",
      name: "Magellan",
      season: "season#01",
      elo: 1337,
      gamesPlayed: 42,
      type: "player",
    });
  });
});
