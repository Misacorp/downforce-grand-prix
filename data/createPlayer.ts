import { DynamoDB } from "aws-sdk";
import { createPlayerPrimaryKey, createPrimaryKey } from "./utils";
import { Season, SeasonPlayer } from "../services/types";
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

  // Create new player
  const createdAt = new Date();
  const createdPlayerPk = createPlayerPrimaryKey(createdAt);

  const seasonPlayer: SeasonPlayer = {
    pk1: createdPlayerPk,
    sk1: season.pk1,
    pk2: season.pk1,
    sk2: createdPlayerPk,
    type: "player",

    name: playerName,
    createdAt: createdAt.toISOString(),
    season: season.pk1,
    elo: season.config.startingElo,
    gamesPlayed: 0,
  };

  // Write player to database
  await dbClient
    .put({
      Item: seasonPlayer,
      TableName: process.env.TABLE_NAME,
    })
    .promise();

  return seasonPlayer;
};
