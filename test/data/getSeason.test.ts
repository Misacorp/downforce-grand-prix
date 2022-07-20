import { getSeason } from "../../data/getSeason";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

// Mock DynamoDB
const ddbMock = mockClient(DynamoDBDocumentClient);

// Mock the console warn function
const mockConsoleWarn = jest.spyOn(console, "warn");

describe("getSeason", () => {
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
    const season = await getSeason("season#01", "TEST_TABLE_NAME");

    expect(ddbMock).toHaveReceivedCommandTimes(GetCommand, 1);
    expect(ddbMock).toHaveReceivedCommandWith(GetCommand, {
      TableName: "TEST_TABLE_NAME",
      Key: {
        pk1: "season#01",
        sk1: "season",
      },
    });
  });

  it("should log a warning when attempting to get a season with an id that does not exist", async () => {
    ddbMock.on(GetCommand).resolvesOnce({
      Item: undefined,
    });

    mockConsoleWarn.mockImplementationOnce(() => undefined); // Don't log in jest output

    // Act
    await getSeason("season#99", "TEST_TABLE_NAME");

    expect(mockConsoleWarn).toHaveBeenCalledWith(
      "Tried to get a season with seasonId season#99 but no season with that id exists."
    );
  });

  it("should return null when attempting to get a season with an id that does not exist", async () => {
    ddbMock.on(GetCommand).resolvesOnce({
      Item: undefined,
    });

    mockConsoleWarn.mockImplementationOnce(() => undefined); // Don't log in jest output

    const act = await getSeason("season#99", "TEST_TABLE_NAME");

    expect(act).toBe(null);
  });

  it("should return season data", async () => {
    ddbMock.on(GetCommand).resolvesOnce({
      Item: {
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
    });

    const act = await getSeason("season#01", "TEST_TABLE_NAME");

    expect(act).toStrictEqual({
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
    });
  });
});
