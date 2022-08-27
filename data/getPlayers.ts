import { SeasonPlayer } from "../services/types";
import { ENTITY_PREFIXES, getDocumentClient } from "./utils";

const dbClient = getDocumentClient();

/**
 * Gets all players in a given season
 * @param seasonId  Season id
 * @param TableName Table name
 * @throws Will throw an error when a database interaction fails
 */
export const getPlayers = async (
  seasonId: string,
  TableName: string
): Promise<SeasonPlayer[]> => {
  const dbResult = await dbClient.query({
    TableName,
    IndexName: "gsi2",
    KeyConditionExpression: `#pk2 = :season and begins_with(#sk2, ${ENTITY_PREFIXES.PLAYER})`,
    ExpressionAttributeValues: {
      ":season": seasonId,
    },
    ExpressionAttributeNames: {
      "#pk2": "pk2",
      "#sk2": "sk2",
      "#type": "type",
    },
    ProjectionExpression:
      "pk1, createdAt, #type, playerName, playerElo, gameCount",
  });

  const players = dbResult.Items;

  // No players found
  if (!players?.length) {
    console.warn(
      `Tried to get all players in season ${seasonId} but no player in that season exists.`
    );

    return [];
  }

  return <SeasonPlayer[]>players;
};
