import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { getPlayers } from "../../data/getPlayers";
import { ENTITY_PREFIXES } from "../../data/utils";

// Mock DynamoDB
const ddbMock = mockClient(DynamoDBDocumentClient);

// Mock the console warn function
const mockConsoleWarn = jest.spyOn(console, "warn").mockReturnThis();

describe("getSeason", () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should call DocumentClient.get with the correct parameters", async () => {
    ddbMock.on(QueryCommand).resolvesOnce({
      Items: [],
    });

    // Act
    await getPlayers("test-season-id", "TEST_TABLE_NAME");

    expect(ddbMock).toHaveReceivedCommandTimes(QueryCommand, 1);
    expect(ddbMock).toHaveReceivedCommandWith(QueryCommand, {
      TableName: "TEST_TABLE_NAME",
      IndexName: "gsi2",
      KeyConditionExpression: `#pk2 = :season and begins_with(#sk2, ${ENTITY_PREFIXES.PLAYER})`,
      ExpressionAttributeValues: {
        ":season": "test-season-id",
      },
      ExpressionAttributeNames: {
        "#pk2": "pk2",
        "#sk2": "sk2",
        "#type": "type",
      },
      ProjectionExpression:
        "pk1, createdAt, #type, playerName, playerElo, gameCount",
    });
  });

  it("should return an empty array and log a warning when no players are found", async () => {
    ddbMock.on(QueryCommand).resolvesOnce({
      Items: [],
    });

    // Act
    const act = await getPlayers("test-season-id", "TEST_TABLE_NAME");

    expect(mockConsoleWarn).toHaveBeenCalledWith(
      "Tried to get all players in season test-season-id but no player in that season exists."
    );
    expect(act).toEqual([]);
  });

  it("should return a list of players", async () => {
    ddbMock.on(QueryCommand).resolvesOnce({
      Items: [
        {
          pk1: "player#01",
          playerName: "Player One",
          playerElo: 1337,
          gameCount: 42,
          type: "player",
        },
      ],
    });

    // Act
    const act = await getPlayers("test-season-id", "TEST_TABLE_NAME");

    expect(ddbMock).toHaveReceivedCommandTimes(QueryCommand, 1);
    expect(act).toStrictEqual([
      {
        pk1: "player#01",
        playerName: "Player One",
        playerElo: 1337,
        gameCount: 42,
        type: "player",
      },
    ]);
  });
});
