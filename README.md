# Downforce Grand Prix

[Downforce](https://boardgamegeek.com/boardgame/215311/downforce) is a board game of speed and wit on a racetrack.

Players often find themselves making daring "all-in moves" to achieve the highest possible score at the risk of coming in last. This play style is understandable when the objective is to **win** a single race and placing second is no different from placing last. This approach is not sustainable in the long run if the player's placement is tracked across multiple games.

## Introducing Downforce Grand Prix 🎉

This application is designed to assign and track ELO ratings for Downforce players across multiple games. The goal is to allow all players, regardless of whom they have played with, to compare their success with that of other players.

The results of each game of Downforce would be entered into the application and players would be assigned an ELO rating based on the outcome of that game. This takes into account the existing ratings of players' opponents in that game. As more games are played, a player's rating updates to reflect their success or failure on the racing track.

## Useful commands

This list was created by `cdk init`.

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
