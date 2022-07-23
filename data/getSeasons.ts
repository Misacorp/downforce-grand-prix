import { Season } from "../services/types";
import { getDocumentClient } from "./utils";

/**
 * Gets all seasons
 * @param TableName Table name
 * @throws Will throw an error when a database interaction fails
 */
export const getSeasons = async (
  TableName: string
): Promise<Season[] | null> => {
  const dbClient = getDocumentClient();

  const dbResult = await dbClient.query({
    TableName,
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

  const seasons = dbResult.Items;

  // No game found
  if (!seasons?.length) {
    console.warn(`Tried to get a list of seasons but no seasons were found.`);

    return null;
  }

  return <Season[]>seasons;
};
