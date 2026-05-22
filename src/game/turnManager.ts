import { Server } from "socket.io";
import { rooms } from "../rooms/roomManager";
import { GameEngine } from "./gameEngine";

const TURN_DURATION = 80;

export class TurnManager {
  static startTimer(
    roomId: string,
    io: Server
  ) {
    const room =
      rooms.get(roomId);

    if (!room) return;

    room.timeLeft =
      TURN_DURATION;

    const timer =
      setInterval(() => {
        room.timeLeft--;

        io.to(roomId).emit(
          "timer_update",
          room.timeLeft
        );

        if (
          room.timeLeft <= 0
        ) {
          clearInterval(timer);

          this.endTurn(
            roomId,
            io
          );
        }
      }, 1000);

    room.timer = timer;
  }

  static endTurn(
    roomId: string,
    io: Server
  ) {
    const room =
      rooms.get(roomId);

    if (!room) return;

    io.to(roomId).emit(
      "word_revealed",
      {
        word:
          room.currentWord,
      }
    );

    const nextDrawer =
      GameEngine.nextDrawer(
        room
      );

    if (!nextDrawer) {
      io.to(roomId).emit(
        "game_over",
        {
          players:
            room.players,
        }
      );

      return;
    }

    room.currentWord =
      null;

    const options =
      GameEngine.getWordOptions();

    io.to(roomId).emit(
      "turn_changed",
      {
        drawerId:
          nextDrawer,
        round:
          room.currentRound,
      }
    );

    io.to(nextDrawer).emit(
      "choose_word",
      options
    );
  }
}