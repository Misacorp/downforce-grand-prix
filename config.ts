import { DynamoDB } from "aws-sdk";

/**
 * DynamoDB client configuration
 */
export const dynamoDbConfig: DynamoDB.DocumentClient.DocumentClientOptions &
  DynamoDB.Types.ClientConfiguration = {};
