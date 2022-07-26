import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { ENTITY_PREFIXES } from "../data/utils";
import { getGames } from "../data/getGames";

// npx cdk synth --no-staging DownforceGrandPrixStack > template.yaml
// aws-vault exec sandbox -- sam local invoke --event ./test/events/gamesGet_QueryParameterRequest.json --env-vars environment.json GetGameResults

/**
 * Gets all games and their results in a given season
 * @param event.queryStringParameters.seasonId The unique portion of a single season's id, excluding the 'season#' prefix
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

    // Construct season id and fetch games with it
    const seasonId = `${ENTITY_PREFIXES.SEASON}${seasonIdParam}`;
    const games = await getGames(seasonId, process.env.TABLE_NAME!);

    // Game found
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(games),
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
      title: "An error occurred when fetching a list of games",
      description: message,
    }),
  };
};
