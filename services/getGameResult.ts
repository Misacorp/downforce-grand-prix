import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { getGame } from "../data/getGame";

/**
 * Gets a single game's results
 * @param event
 */
export const handler = async (event: APIGatewayEvent) => {
  try {
    const gameId = event?.pathParameters?.gameId;

    // A game id is required
    if (!gameId) {
      return reject(400, "A game id must be provided as a path parameter");
    }

    const game = await getGame(gameId, process.env.TABLE_NAME!);

    if (!game) {
      return reject(404, `No game with id ${gameId} found`);
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
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
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: "An error occurred when fetching a single game",
      description: message,
    }),
  };
};
