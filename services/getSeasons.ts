import { APIGatewayProxyResult } from "aws-lambda";
import { getSeasons } from "../data/getSeasons";

// npx cdk synth --no-staging DownforceGrandPrixStack > template.yaml
// aws-vault exec sandbox -- sam local invoke --event ./test/events/seasonsGet_Request.json --env-vars environment.json GetSeasons

/**
 * Gets all seasons
 */
export const handler = async () => {
  try {
    const seasons = await getSeasons(process.env.TABLE_NAME!);

    if (!seasons) {
      return reject(404, `No seasons found`);
    }

    // Game found
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(seasons),
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
      title: "An error occurred when fetching a list of seasons",
      description: message,
    }),
  };
};
