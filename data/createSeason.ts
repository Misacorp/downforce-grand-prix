import { DynamoDB } from "aws-sdk";
import { createSeasonPrimaryKey } from "./utils";
import { Season, SeasonConfig } from "../services/types";
import { dynamoDbConfig } from "../config";

const dbClient = new DynamoDB.DocumentClient(dynamoDbConfig);

const defaultConfig: SeasonConfig = {
  startingElo: 1200,
  k: 32,
  d: 400,
};

/**
 * Creates a new season
 * @param name      Season display name
 * @param config    Season config
 * @param tableName Table name
 * @throws Will throw an error when a database interaction fails or necessary environment variables are not defined
 */
export const createSeason = async (
  name: string,
  config: SeasonConfig = defaultConfig,
  tableName: string
): Promise<string> => {
  if (!tableName) {
    throw new Error("The TABLE_NAME environment variable is not defined");
  }

  // Create new season
  const createdAt = new Date();
  const createdSeasonPk = createSeasonPrimaryKey(createdAt);

  const season: Season = {
    pk1: createdSeasonPk,
    sk1: "season",
    pk3: "season",
    type: "season",
    createdAt: createdAt.toISOString(),
    startDate: createdAt.toISOString(),
    endDate: null,
    name,
    config,
  };

  // Write season to database
  await dbClient
    .put({
      Item: season,
      TableName: tableName,
    })
    .promise();

  return season.pk1;
};
