import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

const dbClient = new DynamoDB.DocumentClient();

/**
 * Creates a message and saves it to DynamoDB
 * @param event
 */
export const handler = async function (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  try {
    const query = await dbClient
      .scan({
        TableName: process.env.MESSAGE_TABLE_NAME!,
      })
      .promise();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(query.Items),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "An error occurred",
        description: err.message,
      }),
    };
  }
};
