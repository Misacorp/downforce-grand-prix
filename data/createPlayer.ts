import { DynamoDB } from "aws-sdk";
import {
  Season,
  SeasonPlayer,
  SeasonPlayerImplementation,
} from "../services/types";
import { getSeason } from "./getSeason";
import { dynamoDbConfig } from "../config";

const dbClient = new DynamoDB.DocumentClient(dynamoDbConfig);

/**
 * Creates a new player in a given season in the database
 * @param playerName Player's display name
 * @param seasonId   Season id the player should be added to
 * @throws Will throw an error when a database interaction fails or necessary environment variables are not defined
 */
export const createPlayer = async (
  playerName: string,
  seasonId: string
): Promise<SeasonPlayer> => {
  if (!process.env.TABLE_NAME) {
    throw new Error("The TABLE_NAME environment variable is not defined");
  }

  const season: Season | null = await getSeason(
    seasonId,
    process.env.TABLE_NAME
  );

  // No season exists
  if (season === null) {
    throw new Error(`No season exists with seasonId ${seasonId}`);
  }

  const seasonPlayer: SeasonPlayer = new SeasonPlayerImplementation(
    season,
    playerName
  );

  // Write player to database
  await dbClient
    .put({
      Item: seasonPlayer,
      TableName: process.env.TABLE_NAME,
    })
    .promise();

  return seasonPlayer;
};
