import { getSeasons } from "../../data/getSeasons";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { getSeason } from "../../data/getSeason";

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
    await getSeasons("TEST_TABLE_NAME");

    expect(ddbMock).toHaveReceivedCommandTimes(QueryCommand, 1);
    expect(ddbMock).toHaveReceivedCommandWith(QueryCommand, {
      TableName: "TEST_TABLE_NAME",
      IndexName: "gsi3",
      KeyConditionExpression: "#pk3 = :season",
      ExpressionAttributeValues: {
        ":season": "season",
      },
      ExpressionAttributeNames: {
        "#pk3": "pk3",
        "#type": "type",
        "#name": "name",
      },
      ProjectionExpression:
        "pk1, createdAt, #type, startDate, endDate, config, #name",
    });
  });

  it("should return an empty array and log a warning when no seasons are found", async () => {
    ddbMock.on(QueryCommand).resolvesOnce({
      Items: [],
    });

    // Act
    const act = await getSeasons("TEST_TABLE_NAME");

    expect(mockConsoleWarn).toHaveBeenCalledWith(
      "Tried to get a list of seasons but no seasons were found."
    );
    expect(act).toEqual([]);
  });

  it("should return a list of seasons", async () => {
    ddbMock.on(QueryCommand).resolvesOnce({
      Items: [
        {
          pk1: "season#01",
          sk1: "season",
          name: "Test Season Name",
          startDate: "2022-07-03T19:07:16.211Z",
          endDate: "2022-12-03T19:07:16.211Z",
          config: {
            startingElo: 1200,
            k: 32,
            d: 400,
          },
          type: "season",
        },
      ],
    });

    // Act
    const act = await getSeasons("TEST_TABLE_NAME");

    expect(ddbMock).toHaveReceivedCommandTimes(QueryCommand, 1);
    expect(act).toStrictEqual([
      {
        pk1: "season#01",
        sk1: "season",
        name: "Test Season Name",
        startDate: "2022-07-03T19:07:16.211Z",
        endDate: "2022-12-03T19:07:16.211Z",
        config: {
          startingElo: 1200,
          k: 32,
          d: 400,
        },
        type: "season",
      },
    ]);
  });
});
