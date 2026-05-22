import { Room } from "../types/room";
import { words } from "../data/words";

export class GameEngine {

  static startGame(room: Room) {

    room.gameStarted = true;

    room.currentRound = 1;

    room.currentDrawerIndex = 0;

    room.turnOrder =
      room.players.map(
        player => player.id
      );

    this.nextDrawer(room);
  }

  static nextDrawer(room: Room) {

    if (
      room.currentDrawerIndex >=
      room.turnOrder.length
    ) {

      room.currentDrawerIndex = 0;

      room.currentRound++;

      if (
        room.currentRound >
        room.maxRounds
      ) {
        return null;
      }
    }

    room.currentDrawerId = room.turnOrder[room.currentDrawerIndex]!;

    room.currentDrawerIndex++;

    return room.currentDrawerId;
  }

  static getWordOptions() {

    return [...words]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
  }

}