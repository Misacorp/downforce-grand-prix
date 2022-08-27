import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { getPlayers } from "../data/getPlayers";

// npx cdk synth --no-staging DownforceGrandPrixStack > template.yaml
// aws-vault exec sandbox -- sam local invoke --event ./test/events/playersGet_Request.json --env-vars environment.json GetPlayers

/**
 * Gets all players in a given season
 */
export const handler = async (event: APIGatewayEvent) => {
  try {
    const seasonIdParam = event.queryStringParameters?.seasonId;

    if (!seasonIdParam) {
      return reject(
        400,
        "A season id must be provided to the 'seasonId' query parameter"
      );
    }

    const players = await getPlayers(seasonIdParam, process.env.TABLE_NAME!);

    // Players found
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(players),
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
      title:
        "An error occurred when fetching a list of players in a given season",
      description: message,
    }),
  };
};
