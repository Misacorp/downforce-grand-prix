import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { Ulid } from "id128";

interface Message {
  message: string;
  senderName?: string;
}

const dbClient = new DynamoDB.DocumentClient();

/**
 * Creates a message and saves it to DynamoDB
 * @param event
 */
export const handler = async function (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  try {
    const message: Message = JSON.parse(event.body as string);

    const writtenId = await writeToDatabase(message);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: writtenId }),
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

/**
 * Creates a primary key
 * @param time The current time
 */
export const createPrimaryKey = (time: Date): string =>
  Ulid.generate({ time }).toRaw();

/**
 * Writes a single message to the database
 * @param message Message to write
 */
const writeToDatabase = async (message: Message): Promise<string> => {
  const id = createPrimaryKey(new Date());

  await dbClient
    .put({
      Item: {
        ...message,
        id,
      },
      TableName: process.env.MESSAGE_TABLE_NAME!,
    })
    .promise();

  return id;
};
