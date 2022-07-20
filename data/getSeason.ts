import { Season } from "../services/types";
import { getDocumentClient } from "./utils";

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

  const seasonResult = await dbClient.get({
    TableName,
    Key: {
      pk1: seasonId,
      sk1: "season",
    },
  });

  const season = seasonResult.Item;

  // No season found
  if (!season) {
    console.warn(
      `Tried to get a season with seasonId ${seasonId} but no season with that id exists.`
    );

    return null;
  }

  return <Season>season;
};
