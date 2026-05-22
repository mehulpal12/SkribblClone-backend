import { Server, Socket } from "socket.io";
import { rooms } from "../rooms/roomManager";

export const roomHandler = (
  socket: Socket,
  io: Server
) => {
  /**
   * CREATE ROOM
   */
  socket.on(
    "create_room",
    ({ playerName, playerId }) => {
      const roomId = Math.random()
        .toString(36)
        .substring(2, 8);

      const room = {
        id: roomId,

        hostId: socket.id,

        players: [
          {
            id: socket.id,
            playerId,
            name: playerName,
            score: 0,
          },
        ],

        strokes: [],

        gameStarted: false,

        currentRound: 0,

        maxRounds: 5,

        currentDrawerIndex: 0,

        currentDrawerId: null,

        currentWord: null,

        turnOrder: [],

        guessedPlayers: [],

        timeLeft: 0,

        timer: null,
      };

      rooms.set(roomId, room);

      console.log("ROOM CREATED");
      console.log("ROOM ID:", roomId);
      console.log("ALL ROOMS:", [...rooms.keys()]);

      socket.join(roomId);

      socket.emit(
        "room_created",
        room
      );
    }
  );

  /**
   * JOIN ROOM
   */
  socket.on(
    "join_room",
    ({
      roomId,
      playerName,
      playerId,
    }) => {
      console.log(
        "Join request:",
        roomId
      );

      const room =
        rooms.get(roomId);

      if (!room) {
        socket.emit(
          "error_message",
          {
            message:
              "Room not found",
          }
        );

        return;
      }

      const existingPlayer =
        room.players.find(
          (player: any) =>
            player.playerId ===
            playerId
        );

      /**
       * RECONNECT PLAYER
       */
      if (existingPlayer) {
        existingPlayer.id =
          socket.id;

        existingPlayer.name =
          playerName;
      } else {
        room.players.push({
          id: socket.id,
          playerId,
          name: playerName,
          score: 0,
        });
      }

      /**
       * REASSIGN HOST IF NONE
       */
      if (
        !room.hostId &&
        room.players.length > 0
      ) {
        room.hostId =
          room.players[0]!.id ;
      }

      socket.join(roomId);

      socket.emit(
        "joined_room",
        room
      );

      io.to(roomId).emit(
        "player_joined",
        room.players
      );

      console.log(
        "PLAYER JOINED:",
        playerName
      );
    }
  );

  /**
   * DRAW MOVE
   */
  socket.on(
    "draw_move",
    (data) => {
      const room =
        rooms.get(data.roomId);

      if (!room) return;

      room.strokes.push(data);

      socket
        .to(data.roomId)
        .emit(
          "draw_data",
          data
        );
    }
  );

  /**
   * CLEAR CANVAS
   */
  socket.on(
    "clear_canvas",
    ({ roomId }) => {
      const room =
        rooms.get(roomId);

      if (!room) return;

      room.strokes = [];

      io.to(roomId).emit(
        "canvas_cleared"
      );
    }
  );

  /**
   * LEAVE ROOM
   */
  socket.on(
    "leave_room",
    ({ roomId }) => {
      const room =
        rooms.get(roomId);

      if (!room) return;

      room.players =
        room.players.filter(
          (player: any) =>
            player.id !== socket.id
        );

      if (
        room.hostId === socket.id
      ) {
        room.hostId =
          room.players[0]?.id ??
          null;
      }

      socket.leave(roomId);

      io.to(roomId).emit(
        "player_left",
        room.players
      );

      if (
        room.players.length === 0
      ) {
        if (room.timer) {
          clearInterval(
            room.timer
          );
        }

        rooms.delete(roomId);
      }
    }
  );

  /**
   * DISCONNECT
   */
  socket.on(
    "disconnect",
    () => {
      console.log(
        "Disconnected:",
        socket.id
      );

      rooms.forEach(
        (room, roomId) => {
          const player =
            room.players.find(
              (p: any) =>
                p.id === socket.id
            );

          if (!player) return;

          room.players =
            room.players.filter(
              (p: any) =>
                p.id !== socket.id
            );

          room.guessedPlayers =
            room.guessedPlayers.filter(
              (id: string) =>
                id !== socket.id
            );

          if (
            room.currentDrawerId ===
            socket.id
          ) {
            room.currentDrawerId =
              null;
          }

          if (
            room.hostId === socket.id
          ) {
            room.hostId =
              room.players[0]?.id ??
              null;
          }

          io.to(roomId).emit(
            "player_left",
            room.players
          );

          /**
           * DELETE EMPTY ROOM
           */
          if (
            room.players.length === 0
          ) {
            if (room.timer) {
              clearInterval(
                room.timer
              );
            }

            rooms.delete(roomId);

            console.log(
              `Room ${roomId} deleted`
            );
          }
        }
      );
    }
  );
};