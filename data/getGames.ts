import { Game } from "../services/types";
import { ENTITY_PREFIXES, getDocumentClient } from "./utils";

/**
 * Gets all games in a given season
 * @param seasonId  Season id
 * @param TableName Table name
 * @throws Will throw an error when a database interaction fails
 */
export const getGames = async (
  seasonId: string,
  TableName: string
): Promise<Game[] | null> => {
  const dbClient = getDocumentClient();

  const GameResult = await dbClient.query({
    TableName,
    IndexName: "gsi2",
    KeyConditionExpression: "#pk = :seasonId AND begins_with(#sk, :game)",
    ExpressionAttributeValues: {
      ":game": "game",
      ":seasonId": seasonId,
    },
    ExpressionAttributeNames: {
      "#pk": "pk2",
      "#sk": "sk2",
      "#type": "type",
      "#name": "name",
    },
    ProjectionExpression:
      "pk1, createdAt, #type, results, season.pk1, season.startDate, season.endDate, season.#name",
  });

  const games = GameResult.Items;

  if (!games) {
    console.warn(
      `Tried to get all games in season with seasonId ${seasonId} but no games with that season exist`
    );

    return null;
  }

  return games as Game[];
};
