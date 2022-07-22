import { Game } from "../services/types";
import { getDocumentClient } from "./utils";

/**
 * Gets a single game by id
 * @param gameId    Game id EXCLUDING the 'game#' prefix
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
      ":gameId": `game#${gameId}`,
      ":seasonId": "season",
    },
    ExpressionAttributeNames: {
      "#pk1": "pk1",
      "#sk1": "sk1",
    },
  });

  const games = GameResult.Items;

  // No game found
  if (!games || !games.length) {
    console.warn(
      `Tried to get a game with gameId ${gameId} but no game with that id exists.`
    );

    return null;
  }

  return <Game>games[0];
};
