import { DynamoDB } from "aws-sdk";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { Season } from "../services/types";

export const getDocumentClient = () => new DynamoDB.DocumentClient();

/**
 * Gets a single season by id
 * @param seasonId  Season id
 * @param TableName Table name
 * @throws Will throw an error when a database interaction fails
 */
export const getSeason = async (
  seasonId: string,
  TableName: string
): Promise<Season | null> => {
  const dbClient = getDocumentClient();

  const seasonResult = await dbClient
    .get({
      TableName,
      Key: {
        pk1: seasonId,
        sk1: "season",
      },
    })
    .promise();

  const season = seasonResult.Item;

  // No season found
  if (!season) {
    console.warn(
      `Tried to get a season with seasonId ${seasonId} but no season with that id exists.`
    );

    return null;
  }

  return unmarshall(season) as Season;
};
