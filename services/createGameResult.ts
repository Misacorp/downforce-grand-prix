import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { getNewRatings } from "multi-elo";
import {
  Game,
  GameDTO,
  GameImplementation,
  GameResultItem,
  SeasonPlayer,
  SeasonPlayerImplementation,
} from "./types";
import { createGamePrimaryKey, getDocumentClient } from "../data/utils";
import { getPlayer } from "../data/getPlayer";
import { getSeason } from "../data/getSeason";

const dbClient = getDocumentClient();

// npx cdk synth --no-staging DownforceGrandPrixStack > template.yaml
// aws-vault exec sandbox -- sam local invoke --event ./test/events/gamesCreate_NewPlayersRequest.json --env-vars environment.json CreateGameResult
// aws-vault exec sandbox -- sam local invoke --event ./test/events/gamesCreate_ExistingPlayersRequest.json --env-vars environment.json CreateGameResult

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

    // Create stubs for the unknown players. These will be inserted into the database later.
    const newPlayerStubs: SeasonPlayer[] = unknownPlayers.map(
      (unknownPlayer) =>
        new SeasonPlayerImplementation(season, unknownPlayer.playerName, 1)
    );

    // Fetch the remaining (known) players
    const existingPlayersPromises: Promise<SeasonPlayer | null>[] = [];
    gameDTO.results
      .filter((player) => player.playerId)
      .forEach((player) => {
        existingPlayersPromises.push(
          getPlayer(player.playerId!, season.pk1, process.env.TABLE_NAME!)
        );
      });

    const existingPlayers = await Promise.all(existingPlayersPromises);

    // Combine game results and player objects
    const gameResultsWithoutRatings: GameResultItem[] = gameDTO.results.map(
      (p) => {
        let player: SeasonPlayer | undefined | null;

        if (p.playerId === null) {
          // Search by player name
          player = newPlayerStubs.find(
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
          placement: p.placement,
          eloBeforeGame: player.elo,
          eloAfterGame: 0, // Calculate this later in the code
        };
      }
    );

    // Calculate new ELO for each player
    const gameResults = updateELORatings(gameResultsWithoutRatings);

    // Create a game object with all the new players
    const game: Game = new GameImplementation(season, gameResults);

    // Add new ELO ratings to created player stubs
    const newPlayers: SeasonPlayer[] = newPlayerStubs.map((playerStub) => ({
      ...playerStub,
      elo: game.results.find(
        (gameResultItem) => gameResultItem.player.id === playerStub.pk1
      )!.eloAfterGame,
    }));

    // Write game and new players to database. Update ELO ratings and game counts.
    const writtenId = await writeToDatabase(game, newPlayers);

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
 * Writes a game and its players to the database. New players will be created. ELO ratings and game count for existing players will be updated.
 * @param game       Game result
 * @param newPlayers Players that need to be created in order for this game to be complete. Supply these players with their final game count and ELO rating.
 * @returns Primary key written to this item
 */
export const writeToDatabase = async (
  game: Game,
  newPlayers: SeasonPlayer[]
): Promise<string> => {
  const newPlayerIds = newPlayers.map((p) => p.pk1);

  await dbClient.transactWrite({
    TransactItems: [
      // Create new players
      ...newPlayers.map((newPlayer) => ({
        Put: {
          TableName: process.env.TABLE_NAME!,
          Item: newPlayer,
        },
      })),
      // Update ELO ratings of existing players
      ...game.results
        // Filter out players that will be created and operate only on existing players
        .filter(
          (gameResultItem) => !newPlayerIds.includes(gameResultItem.player.id)
        )
        .map((gameResultItem) => ({
          Update: {
            TableName: process.env.TABLE_NAME!,
            Key: {
              pk1: gameResultItem.player.id,
              sk1: game.season.pk1,
            },
            UpdateExpression: "ADD gamesPlayed :inc SET elo = :elo",
            ExpressionAttributeValues: {
              ":inc": 1,
              ":elo": gameResultItem.eloAfterGame,
            },
          },
        })),
      // Create game item
      {
        Put: {
          TableName: process.env.TABLE_NAME!,
          Item: game,
        },
      },
    ],
  });

  return game.pk1;
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
export const updateELORatings = (
  results: GameResultItem[]
): GameResultItem[] => {
  // Sort by ascending placement order
  const sortedAsc = results.sort((a, b) => a.placement - b.placement);

  const playerRatings = sortedAsc.map((player) => player.eloBeforeGame);

  // Create an array to describe the order in which players placed.
  // This is used when calling the ELO calculating function and accounts for ties.
  // The first player (most points) should have the smallest "order index".
  // The last player (least points) should have the highest "order index".
  // Tied players should have the same "order index"
  const order = sortedAsc.map((gameResultItem) => gameResultItem.placement);

  // Calculate new ELO ratings
  const newRatings = getNewRatings(playerRatings, order);

  // Assign new ELO ratings to sorted results and return them
  sortedAsc.forEach(
    (player, index) => (player.eloAfterGame = newRatings[index])
  );

  return sortedAsc;
};
