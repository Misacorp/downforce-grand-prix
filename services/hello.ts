import { APIGatewayEvent } from "aws-lambda";

/**
 * Sends a text response
 * @param statusCode Status code
 * @param body       Response text
 */
const sendRes = (statusCode: number, body: string) => {
  return {
    statusCode,
    headers: {
      "Content-Type": "text/html",
    },
    body,
  };
};

// npx cdk synth --no-staging DownforceGrandPrixStack > template.yaml
// aws-vault exec sandbox -- sam local invoke --event ./test/events/hello.json --env-vars environment.json HelloLambda

export const handler = async function (event: APIGatewayEvent) {
  console.log("request:", JSON.stringify(event));

  return sendRes(
    200,
    `Hello! The table name (from env) is ${process.env.HELLO_TABLE_NAME}`
  );
};
