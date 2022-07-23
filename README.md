# Downforce Grand Prix

[Downforce](https://boardgamegeek.com/boardgame/215311/downforce) is a board game of speed and wit on a racetrack.

Players often find themselves making daring "all-in moves" to achieve the highest possible score at the risk of coming in last. This play style is understandable when the objective is to **win** a single race and placing second is no different from placing last. This approach is not sustainable in the long run if the player's placement is tracked across multiple games.

## Introducing Downforce Grand Prix 🎉

This application is designed to assign and track ELO ratings for Downforce players across multiple games. The goal is to allow all players, regardless of whom they have played with, to compare their success with that of other players.

The results of each game of Downforce would be entered into the application and players would be assigned an ELO rating based on the outcome of that game. This takes into account the existing ratings of players' opponents in that game. As more games are played, a player's rating updates to reflect their success or failure on the racing track.

## Database Design

### Access Patterns

Defining an application's database access patterns is important when using DynamoDB. This application's access patterns are listed here.

#### Write

1. Write game results to the database.
   1. Game id, each player's name and score

#### Read

| Access Pattern                                 | Implementation                                                  |
|------------------------------------------------|-----------------------------------------------------------------|
|Read ELO rating of all players in a given season| Query `pk2 = seasonId` and `sk2 = begins_with("player")`        |
|Read ELO rating of a given player in a given season.| Query `pk1 = playerId` and `sk1 = seasonId`                     |
|Read the results of a single game.| Query `pk1 = gameId` (if `sk1` is needed, use `begins_with(season)`) |
|Read the game history of a single player.| Scan with filter `type = game` and `playerList contains(playerId)` |
|Read the entire game history of a given season.| Query `pk2 = seasonId` and `sk2 = begins_with("game")`          |
|Read details of a season.| Query `pk1 = seasonId` and `sk1 = begins_with("season")`        |
|Read a list of all seasons.| Query `pk3 = 'season'`                                          |

### Data types

#### Game

- Game id
- Player names
- Player scores
- Player ELO before the game
- Player ELO after the game
- Season the game was played in

#### Player

- Player name
- ELO in each season
- Number of games played in each season

#### Season

- Name
- Start date
- End date

## Notes:

When a game and its results are added, use a `TableStreamHandler` to read all the participants and update their ELO rating and game count.

Create a Global Secondary Index that allows looking up a single player and finding all of their games.

If the changes to a player's ELO are something that we want to track, consider using the [version control pattern](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-sort-keys.html) for each update to a player's ELO.

## Useful commands

This list was created by `cdk init`.

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template
