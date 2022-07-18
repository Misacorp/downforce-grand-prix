import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { getNewRatings } from "multi-elo";
import { Game, GameDTO, GameResultItem, SeasonPlayer } from "./types";
import { createGamePrimaryKey, createPrimaryKey } from "../data/utils";
import { createPlayer } from "../data/createPlayer";
import { getPlayer } from "../data/getPlayer";
import { getSeason } from "../data/getSeason";
import { dynamoDbConfig } from "../config";

const dbClient = new DynamoDB.DocumentClient(dynamoDbConfig);

/**
 * Creates a game result and saves it to DynamoDB
 * @param event
 */
export const handler = async function (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  try {
    const gameDTO: GameDTO = JSON.parse(event.body as string);

    // Get the season
    const season = await getSeason(gameDTO.seasonId, process.env.TABLE_NAME!);

    if (!season) {
      return reject(500, `A season with id ${gameDTO.seasonId} does not exist`);
    }

    // Determine if there are new players
    const unknownPlayers = gameDTO.results.filter(
      (player) => player.playerId === null
    );

    // Write unknown players to database
    const createPlayersPromises: Promise<SeasonPlayer>[] = [];
    unknownPlayers.forEach((player) => {
      createPlayersPromises.push(createPlayer(player.playerName, season.pk1));
    });

    const createdPlayers = await Promise.all(createPlayersPromises);

    // Fetch the remaining (known) players
    const knownPlayers = gameDTO.results.filter(
      (player) => player.playerId !== null
    );

    const existingPlayersPromises: Promise<SeasonPlayer | null>[] = [];
    knownPlayers.forEach((player) => {
      existingPlayersPromises.push(
        getPlayer(player.playerName, season.pk1, process.env.TABLE_NAME!)
      );
    });

    const existingPlayers = await Promise.all(existingPlayersPromises);

    // Combine the newly created players with their results for this game
    const gameResultsWithoutRatings: GameResultItem[] = gameDTO.results.map(
      (p) => {
        let player: SeasonPlayer | undefined | null;

        if (p.playerId === null) {
          // Search by player name
          player = createdPlayers.find(
            (player) => player.name === p.playerName
          );
        } else {
          // Search by id
          player = existingPlayers.find((player) => player?.pk1 === p.playerId);
        }

        // If a player is not found (despite everything) we can't save the results
        if (!player) {
          throw new Error(
            `Player with the name ${p.playerName} could not be found among existing or newly created players.`
          );
        }

        return {
          player: {
            id: player.pk1,
            name: player.name,
          },
          points: p.points,
          eloBeforeGame: player.elo,
          eloAfterGame: 0, // Calculate this later
        };
      }
    );

    // Calculate new ELO for each player
    const gameResults = updateELORatings(gameResultsWithoutRatings);

    // Create a game object with all the new players
    const createdAt = new Date();
    const gamePk = createGamePrimaryKey(createdAt);

    const game: Game = {
      pk1: gamePk,
      sk1: season.pk1,
      pk2: season.pk1,
      sk2: gamePk,

      createdAt: createdAt.toISOString(),
      playerIds: gameResults.map((playerResults) => playerResults.player.id),
      results: gameResults,
      season: season,
      type: "game",
    };

    const writtenId = await writeToDatabase(game);

    // TODO: Update each player object with a "games played" and new ELO via a table stream handler

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: writtenId }),
    };
  } catch (err) {
    return reject(500, err.message, err);
  }
};

/**
 * Writes a single game result item to the database
 * @param gameResult Game result
 */
export const writeToDatabase = async (gameResult: Game): Promise<string> => {
  const id = createGamePrimaryKey();

  await dbClient
    .put({
      Item: gameResult,
      TableName: process.env.TABLE_NAME!,
    })
    .promise();

  return id;
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
      title: "An error occurred",
      description: message,
    }),
  };
};

/**
 * Updates ELO ratings for all players in a game
 * @param results Game results
 */
const updateELORatings = (results: GameResultItem[]): GameResultItem[] => {
  // Sort by descending order of points. The first player is first and last player is last.
  const sortedDesc = results.sort((a, b) => b.points - a.points);

  const playerRatings = results.map((player) => player.eloBeforeGame);

  // Create an array to describe the order in which players placed.
  // This is used when calling the ELO calculating function and accounts for ties.
  // The first player (most points) should have the smallest "order index".
  // The last player (least points) should have the highest "order index".
  const order = sortedDesc.map((player) => player.points * -1);

  // Calculate new ELO ratings
  const newRatings = getNewRatings(playerRatings, order);

  // Assign new ELO ratings to sorted results and return them
  sortedDesc.forEach(
    (player, index) => (player.eloAfterGame = newRatings[index])
  );

  return sortedDesc;
};
