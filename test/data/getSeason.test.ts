import { DynamoDB } from "aws-sdk";
import { getSeason } from "../../data/getSeason";
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

describe("getSeason", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should call DocumentClient.get with the correct parameters", async () => {
    mockGet.mockReturnValueOnce({ Item: {} });

    // Act
    await getSeason("season#01", "TEST_TABLE_NAME");

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith({
      TableName: "TEST_TABLE_NAME",
      Key: {
        pk1: "season#01",
        sk1: "season",
      },
    });
  });

  it("should log a warning when attempting to get a season with an id that does not exist", async () => {
    mockGet.mockReturnValueOnce({ Item: undefined });
    mockConsoleWarn.mockImplementationOnce(() => undefined); // Don't log in jest output

    // Act
    await getSeason("season#99", "TEST_TABLE_NAME");

    expect(mockConsoleWarn).toHaveBeenCalledWith(
      "Tried to get a season with seasonId season#99 but no season with that id exists."
    );
  });

  it("should return null when attempting to get a season with an id that does not exist", async () => {
    mockGet.mockReturnValueOnce({ Item: undefined });
    mockConsoleWarn.mockImplementationOnce(() => undefined); // Don't log in jest output

    const act = await getSeason("season#99", "TEST_TABLE_NAME");

    expect(act).toBe(null);
  });

  it("should return season data", async () => {
    const mockSeason: DynamoDB.DocumentClient.AttributeMap = {
      pk1: { S: "season#01" },
      sk1: { S: "season" },
      type: { S: "season" },
      name: { S: "Test Season Name" },
      startDate: { S: "2022-07-03T19:07:16.211Z" },
      endDate: { S: "2022-12-03T19:07:16.211Z" },
      config: {
        M: {
          startingElo: { N: 1200 },
          k: { N: 32 },
          d: { N: 400 },
        },
      },
    };

    mockGet.mockReturnValueOnce({
      Item: mockSeason,
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
