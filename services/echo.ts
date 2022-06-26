import { APIGatewayEvent } from "aws-lambda";

/**
 * Sends a text response
 * @param statusCode Status code
 * @param body       Response text
 */
const sendRes = (statusCode: number, body: string | null) => {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body,
  };
};

// npx cdk synth --no-staging DownforceGrandPrixStack > template.yaml
// aws-vault exec sandbox -- sam local invoke --event ./test/events/hello.json --env-vars environment.json HelloLambda

export const handler = async function (event: APIGatewayEvent) {
  return sendRes(200, event.body);
};
