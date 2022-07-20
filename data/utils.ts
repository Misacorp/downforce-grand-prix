import { Ulid } from "id128";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

// DynamoDB client used for creating document clients
let client: DynamoDB;

/**
 * Creates a primary key
 * @param time The current time
 */
export const createPrimaryKey = (time?: Date): string =>
  Ulid.generate({ time: time ?? new Date() }).toRaw();

/**
 * Creates a primary key for a player
 * @param time The current time
 */
export const createPlayerPrimaryKey = (time?: Date): string =>
  `player#${createPrimaryKey(time)}`;

export const createSeasonPrimaryKey = (time?: Date): string =>
  `season#${createPrimaryKey(time)}`;

export const createGamePrimaryKey = (time?: Date): string =>
  `game#${createPrimaryKey(time)}`;

/**
 * Creates a DynamoDB document client
 */
export const getDocumentClient = () => {
  if (!client) {
    client = new DynamoDB({});
  }

  return DynamoDBDocument.from(client);
};
