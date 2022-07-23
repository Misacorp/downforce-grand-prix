import { Game } from "../services/types";
import { ENTITY_PREFIXES, getDocumentClient } from "./utils";

/**
 * Gets a single game by id
 * @param gameId    Game id
 * @param TableName Table name
 * @throws Will throw an error when a database interaction fails
 */
export const getGame = async (
  gameId: string,
  TableName: string
): Promise<Game | null> => {
  const dbClient = getDocumentClient();

  const GameResult = await dbClient.query({
    TableName,
    KeyConditionExpression: "#pk1 = :gameId AND begins_with(#sk1, :seasonId)",
    ExpressionAttributeValues: {
      ":gameId": gameId,
      ":seasonId": "season",
    },
    ExpressionAttributeNames: {
      "#pk1": "pk1",
      "#sk1": "sk1",
      "#type": "type",
      "#name": "name",
    },
    ProjectionExpression:
      "pk1, createdAt, #type, results, season.pk1, season.startDate, season.endDate, season.#name",
  });

  const games = GameResult.Items;

  // No game found
  if (!games?.length) {
    console.warn(
      `Tried to get a game with gameId ${gameId} but no game with that id exists.`
    );

    return null;
  }

  return <Game>games[0];
};
