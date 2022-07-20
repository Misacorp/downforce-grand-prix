import { SeasonPlayer } from "../services/types";
import { getDocumentClient } from "./utils";

const dbClient = getDocumentClient();

/**
 * Gets a single player in a given season
 * @param playerId  Player id
 * @param seasonId  Season id
 * @param TableName Table name
 * @throws Will throw an error when a database interaction fails
 */
export const getPlayer = async (
  playerId: string,
  seasonId: string,
  TableName: string
): Promise<SeasonPlayer | null> => {
  const playerResult = await dbClient.get({
    TableName,
    Key: {
      pk1: playerId,
      sk1: seasonId,
    },
  });

  const player = playerResult.Item;

  // No player found
  if (!player) {
    console.warn(
      `Tried to get a player with id ${playerId} in season ${seasonId} but no player with that id in that season exists.`
    );

    return null;
  }

  return player as SeasonPlayer;
};
