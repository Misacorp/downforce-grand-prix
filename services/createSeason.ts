import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { createSeason } from "../data/createSeason";
import { SeasonConfig } from "./types";
import { headers } from "./apiUtils";

/**
 * Creates a season and saves it to DynamoDB
 * @param event
 */
export const handler = async function (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  try {
    const seasonParams: { name: string; config: SeasonConfig } = JSON.parse(
      event.body as string
    );

    const writtenId = await createSeason(
      seasonParams.name,
      seasonParams.config,
      process.env.TABLE_NAME!
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ id: writtenId }),
    };
  } catch (err) {
    return reject(500, err.message);
  }
};

const reject = (
  statusCode: number,
  message: string
): APIGatewayProxyResult => ({
  statusCode,
  headers,
  body: JSON.stringify({
    title: "An error occurred",
    description: message,
  }),
});
