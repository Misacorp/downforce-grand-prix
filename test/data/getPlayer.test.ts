import { DynamoDB } from "aws-sdk";
import { getPlayer } from "../../data/getPlayer";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

// Mock DynamoDB
const ddbMock = mockClient(DynamoDBDocumentClient);

// Mock the console warn function
const mockConsoleWarn = jest.spyOn(console, "warn");

describe("getPlayer", () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should call DocumentClient.get with the correct parameters", async () => {
    ddbMock.on(GetCommand).resolvesOnce({
      Item: {},
    });

    // Act
    await getPlayer("player#137", "season#01", "TEST_TABLE_NAME");

    expect(ddbMock).toHaveReceivedCommandTimes(GetCommand, 1);
    expect(ddbMock).toHaveReceivedCommandWith(GetCommand, {
      TableName: "TEST_TABLE_NAME",
      Key: {
        pk1: "player#137",
        sk1: "season#01",
      },
    });
  });

  it("should log a warning when attempting to get a player with an id that does not exist", async () => {
    ddbMock.on(GetCommand).resolvesOnce({
      Item: undefined,
    });

    mockConsoleWarn.mockImplementationOnce(() => undefined); // Don't log in jest output

    // Act
    await getPlayer("player#137", "season#01", "TEST_TABLE_NAME");

    expect(mockConsoleWarn).toHaveBeenCalledWith(
      "Tried to get a player with id player#137 in season season#01 but no player with that id in that season exists."
    );
  });

  it("should return null when attempting to get a player with an id that does not exist", async () => {
    ddbMock.on(GetCommand).resolvesOnce({
      Item: undefined,
    });

    mockConsoleWarn.mockImplementationOnce(() => undefined); // Don't log in jest output

    const act = await getPlayer("player#137", "season#01", "TEST_TABLE_NAME");

    expect(act).toBe(null);
  });

  it("should return player data", async () => {
    ddbMock.on(GetCommand).resolvesOnce({
      Item: {
        pk1: "player#137",
        sk1: "season#01",
        name: "Magellan",
        season: "season#01",
        elo: 1337,
        gamesPlayed: 42,
        type: "player",
      },
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
