import { Ulid } from "id128";

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
