import { Server, Socket } from "socket.io";
import { rooms } from "../rooms/roomManager";
import { GameEngine } from "../game/gameEngine";
import { TurnManager } from "../game/turnManager";
import { ScoreManager } from "../game/scoreManager";

export const gameHandler = (
  socket: Socket,
  io: Server
) => {
  /**
   * Move game to next drawer
   */
  const moveToNextDrawer = (
    roomId: string
  ) => {
    const room = rooms.get(roomId);

    if (!room) return;

    const nextDrawer =
      GameEngine.nextDrawer(room);

    if (!nextDrawer) {
      io.to(roomId).emit(
        "game_over",
        {
          players: ScoreManager.leaderboard(
            room.players
          ),
        }
      );

      return;
    }

    room.currentWord = null;
    room.guessedPlayers = [];

    const options =
      GameEngine.getWordOptions();

    io.to(roomId).emit(
      "turn_changed",
      {
        round: room.currentRound,
        drawerId: nextDrawer,
      }
    );

    io.to(nextDrawer).emit(
      "choose_word",
      options
    );

    console.log(
      `NEXT DRAWER: ${nextDrawer}`
    );
  };

  /**
   * START GAME
   */
  socket.on(
    "start_game",
    ({ roomId }) => {
      console.log(
        "START GAME:",
        roomId
      );

      const room =
        rooms.get(roomId);

      if (!room) {
        console.log(
          "ROOM NOT FOUND"
        );
        return;
      }

      if (
        room.hostId !== socket.id
      ) {
        console.log(
          "NON HOST TRIED TO START"
        );
        return;
      }

      if (room.gameStarted) {
        console.log(
          "GAME ALREADY STARTED"
        );
        return;
      }

      if (
        room.players.length < 2
      ) {
        socket.emit(
          "error_message",
          {
            message:
              "Need at least 2 players to start",
          }
        );

        return;
      }

      GameEngine.startGame(room);

      const drawerId =
        room.currentDrawerId;

      if (!drawerId) {
        console.log(
          "NO DRAWER FOUND"
        );
        return;
      }

      const options =
        GameEngine.getWordOptions();

      io.to(roomId).emit(
        "game_started",
        {
          round:
            room.currentRound,
          drawerId,
        }
      );

      io.to(drawerId).emit(
        "choose_word",
        options
      );

      console.log(
        "GAME STARTED"
      );
    }
  );

  /**
   * WORD SELECTED
   */
  socket.on(
    "word_selected",
    ({ roomId, word }) => {
      const room =
        rooms.get(roomId);

      if (!room) return;

      if (
        socket.id !==
        room.currentDrawerId
      ) {
        return;
      }

      if (
        !word ||
        typeof word !==
          "string"
      ) {
        return;
      }

      const selectedWord =
        word.trim();

      if (!selectedWord) {
        return;
      }

      /**
       * Prevent multiple selections
       */
      if (room.currentWord) {
        console.log(
          "WORD ALREADY SELECTED"
        );
        return;
      }

      room.currentWord =
        selectedWord;

      room.guessedPlayers = [];

      console.log(
        "WORD SELECTED:",
        selectedWord
      );

      io.to(roomId).emit(
        "round_started",
        {
          round:
            room.currentRound,
          drawerId:
            room.currentDrawerId,
          duration: 30,
        }
      );

      io.to(
        room.currentDrawerId
      ).emit(
        "your_word",
        selectedWord
      );

      TurnManager.startTimer(
        roomId,
        io
      );
    }
  );

  /**
   * GUESS
   */
socket.on(
  "guess",
  ({ roomId, guess }) => {
    const room =
      rooms.get(roomId);

    if (!room) return;

    if (!room.currentWord)
      return;

    if (
      !guess ||
      typeof guess !==
        "string"
    ) {
      return;
    }

    // Drawer cannot guess
    if (
      socket.id ===
      room.currentDrawerId
    ) {
      return;
    }

    const normalizedGuess =
      guess
        .trim()
        .toLowerCase();

    const correctWord =
      room.currentWord
        .trim()
        .toLowerCase();

    console.log({
      guess,
      normalizedGuess,
      correctWord,
      isCorrect:
        normalizedGuess ===
        correctWord,
    });

    /**
     * WRONG GUESS
     */
    if (
      normalizedGuess !==
      correctWord
    ) {
      console.log(
        "WRONG GUESS"
      );

      ScoreManager.deductPoints(
        room.players,
        socket.id
      );

      io.to(roomId).emit(
        "score_updated",
        ScoreManager.leaderboard(
          room.players
        )
      );

      io.to(roomId).emit(
        "chat_message",
        {
          playerId:
            socket.id,
          message: guess,
        }
      );

      return;
    }

    /**
     * CORRECT GUESS
     */
    console.log(
      "CORRECT GUESS"
    );

    if (
      room.guessedPlayers.includes(
        socket.id
      )
    ) {
      return;
    }

    const guessOrder =
      room.guessedPlayers
        .length;

    const pointsEarned =
      ScoreManager.awardPoints(
        room.players,
        socket.id,
        guessOrder
      );

    room.guessedPlayers.push(
      socket.id
    );

    const player =
      room.players.find(
        (p) =>
          p.id ===
          socket.id
      );

    io.to(roomId).emit(
      "correct_guess",
      {
        playerId:
          socket.id,
        playerName:
          player?.name ??
          "Unknown",
        pointsEarned,
        score:
          player?.score ??
          0,
      }
    );

    io.to(roomId).emit(
      "score_updated",
      ScoreManager.leaderboard(
        room.players
      )
    );

    /**
     * Everyone guessed
     */
    const totalGuessers =
      room.players.length -
      1;

    if (
      room.guessedPlayers
        .length >=
      totalGuessers
    ) {
      TurnManager.endTurn(
        roomId,
        io
      );
    }
  }
);

  /**
   * NEXT TURN
   */
  socket.on(
    "next_turn",
    ({ roomId }) => {
      moveToNextDrawer(
        roomId
      );
    }
  );

  /**
   * TURN TIMEOUT
   */
  socket.on(
    "turn_timeout",
    ({ roomId }) => {
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

      moveToNextDrawer(
        roomId
      );
    }
  );
};