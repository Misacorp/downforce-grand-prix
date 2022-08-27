# Downforce Grand Prix

> Looking for the initial Messages API that this repository used to have? It's a legacy feature now in the [`feature/message-api` branch](https://github.com/Misacorp/downforce-grand-prix/tree/feature/message-api).

[Downforce](https://boardgamegeek.com/boardgame/215311/downforce) is a board game of speed and wit on a racetrack.

Players often find themselves making daring "all-in moves" to achieve the highest possible score at the risk of coming in last. This play style is understandable when the objective is to **win** a single race and placing second is no different from placing last. This approach is not sustainable in the long run if the player's placement is tracked across multiple games.

## Introducing Downforce Grand Prix 🎉

This application is designed to assign and track ELO ratings for Downforce players across multiple games. The goal is to allow all players, regardless of whom they have played with, to compare their success with that of other players.

The results of each game of Downforce would be entered into the application and players would be assigned an ELO rating based on the outcome of that game. This takes into account the existing ratings of players' opponents in that game. As more games are played, a player's rating updates to reflect their success or failure on the racing track.

## API

The following API endpoints are planned. See their implementation status in the table below.

| Function                             | Method and Path                | Implemented |
| :----------------------------------- | :----------------------------- |:-----------:|
| Get list of all seasons              | `GET /season`                  |      ✅      |
| Create season                        | `POST /season`                 |      ✅      |
| Get list of all players in a season  | `GET /player?season=:seasonId` |      ✅       |
| Get player info and all played games | `GET /player/:playerId`        |      ❌      |
| Create game                          | `POST /game`                   |      ✅      |
| Get single game                      | `GET /game/:gameId`            |      ✅      |
| Get list of all games in a season    | `GET /game?season=:seasonId`   |      ✅      |

Note that any given `Player` is always tied to a single season. The same person playing in two different seasons will be represented by two different `Player` entities, one for each season.

## Database Design

### Access Patterns

Defining an application's database access patterns is important when using DynamoDB. This application's access patterns are listed here. Table keys like `pk1` and `sk2` may refer to global secondary indexes detailed in the respective section.

#### Write

| Access Pattern              |
| --------------------------- |
| Create a new season         |
| Create a new player         |
| Create a new game (results) |

#### Read

| Access Pattern                                       | Implementation                                                       |
| ---------------------------------------------------- | -------------------------------------------------------------------- |
| Read ELO rating of all players in a given season     | Query `pk2 = seasonId` and `sk2 = begins_with("player")`             |
| Read ELO rating of a given player in a given season. | Query `pk1 = playerId` and `sk1 = seasonId`                          |
| Read the results of a single game.                   | Query `pk1 = gameId` (if `sk1` is needed, use `begins_with(season)`) |
| Read the game history of a single player.            | Scan with filter `type = game` and `playerList contains(playerId)`   |
| Read the entire game history of a given season.      | Query `pk2 = seasonId` and `sk2 = begins_with("game")`               |
| Read details of a season.                            | Query `pk1 = seasonId` and `sk1 = begins_with("season")`             |
| Read a list of all seasons.                          | Query `pk3 = 'season'`                                               |

### Data types

See the `services/types.ts` file for type documentation.

### Key Naming and Global Secondary Indexes

Global secondary indexes enable fetching data in an efficient manner. In addition to the primary index, the table has multiple global secondary indexes (GSI) with their own key schema.

The main index's partition key and sort key are named `pk1` and `sk1` respectively.

The first global secondary index is named `gsi2` and its keys are named `pk2` and `sk2`. The subsequent GSIs and their keys use the same naming convention: `gsi3` with `pk3` and so on.

Note that there is no `gsi1`. This allows the numbering of a given GSI to correspond with its key names (e.g. `gsi2` and `pk2`). You can think of the primary index as the _first_ index, hence the key names `pk1` and `sk1`.

## Notes:

When a game and its results are added, use a `TableStreamHandler` to read all the participants and update their ELO rating and game count.

If the changes to a player's ELO are something that we want to track, consider using the [version control pattern](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-sort-keys.html) for each update to a player's ELO.

## Local Testing

It is possible to invoke service lambdas like `services/getSeason.ts` locally instead of deploying the changes to AWS each time. Some service lambdas include the commands to do this. You can find them in comments above the `handler` function.

For example, to run the `getSeason` lambda locally, you would first create a template that includes recent changes. This must be done every time changes have been made.

```bash
npx cdk synth --no-staging DownforceGrandPrixStack > template.yaml
```

Then the lambda can be invoked with the following command. This assumes you are using [aws-vault](https://github.com/99designs/aws-vault) to select the AWS profile you are using.

```bash
aws-vault exec sandbox -- sam local invoke --event ./test/events/seasonsGet_Request.json --env-vars environment.json GetSeasons
```

The above command refers to two files:

1. `seasonsGet_Request.json` - Describes the API Gateway event passed to the service lambda. Each lambda should have its own event file.
2. `environment.json` - The `GetSeasons` block in this file defines environment variables used by the service lambda. Each lambda should have its own block of variables in this file if it references environment variables.
