import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { getGame } from "../data/getGame";
import { ENTITY_PREFIXES } from "../data/utils";
import { headers } from "./apiUtils";

// npx cdk synth --no-staging DownforceGrandPrixStack > template.yaml
// aws-vault exec sandbox -- sam local invoke --event ./test/events/gamesGet_PathParameterRequest.json --env-vars environment.json GetGameResult

/**
 * Gets a single game's results
 * @param event.pathParameters.gameId The unique portion of a single game's id, excluding the 'game#' prefix
 */
export const handler = async (event: APIGatewayEvent) => {
  try {
    const gameIdParam = event?.pathParameters?.gameId;

    // A game id parameter is required
    if (!gameIdParam) {
      return reject(400, "A game id must be provided as a path parameter");
    }

    // Add the game prefix and fetch the game
    const gameId = `${ENTITY_PREFIXES.GAME}${gameIdParam}`;
    const game = await getGame(gameId, process.env.TABLE_NAME!);

    if (!game) {
      // Game not found
      return reject(404, `No game with id ${gameId} found`);
    }

    // Game found
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(game),
    };
  } catch (err) {
    return reject(500, err.message);
  }
};

/**
 * Logs an error and rejects
 * @param statusCode Status code to reject with
 * @param message    Message describing the reason for rejection
 * @param error      Error that will be logged to the console
 */
const reject = (
  statusCode: number,
  message: string,
  error?: Error
): APIGatewayProxyResult => {
  if (error) {
    console.error(error);
  }

  return {
    statusCode,
    headers,
    body: JSON.stringify({
      title: "An error occurred when fetching a single game",
      description: message,
    }),
  };
};
