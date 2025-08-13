import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "http";
import { spotifyService, type SpotifyTrack } from "./spotify.js";
import { generateGameId, generatePlayerId, calculatePoints } from "./game-utils.js";

export interface Player {
  id: string;
  name: string;
  score: number;
  ws: WebSocket;
}

export interface RoundResult {
  answer: string;
  correct: boolean;
  pointsGained: number;
  newScore: number;
  answerTime?: number; // Time in seconds it took to answer
}

export interface GameConfig {
  totalRounds: number;
  roundDurationSeconds: number;
  randomStartTime: boolean;
  musicCategory: string;
  hostOnlyMode: boolean;
}

export interface GameState {
  id: string;
  hostId: string;
  players: Map<string, Player>;
  currentRound: number;
  totalRounds: number;
  currentSong?: {
    correct: string;
    options: string[];
    type: "artist" | "song";
  };
  currentTrack?: SpotifyTrack; // Full track information for displaying song details
  gameStarted: boolean;
  gameFinished: boolean;
  roundStartTime?: number;
  roundDuration: number; // Duration in milliseconds
  config: GameConfig;
  playersAnswered: Set<string>; // Track which players have answered this round
  roundTimer?: NodeJS.Timeout; // Store the timer so we can clear it
  roundResults?: Map<string, RoundResult>; // Store results for each player for the current round
}

export interface Message {
  type:
    | "join"
    | "start_game"
    | "answer"
    | "next_round"
    | "update_config"
    | "play_again"
    | "config_updated"
    | "player_joined"
    | "player_left"
    | "game_started"
    | "round_started"
    | "round_ended"
    | "prepare_next_round"
    | "answer_result"
    | "game_finished"
    | "game_reset"
    | "error";
  data?: any;
  playerId?: string;
  gameId?: string;
}

class GameManager {
  private games = new Map<string, GameState>();
  private playerToGame = new Map<string, string>();

  // Generate a unique game ID that doesn't conflict with existing games
  private generateUniqueGameId(): string {
    let gameId: string;
    do {
      gameId = generateGameId();
    } while (this.games.has(gameId));
    return gameId;
  }

  createGame(hostId: string): string {
    const gameId = this.generateUniqueGameId();
    const game: GameState = {
      id: gameId,
      hostId,
      players: new Map(),
      currentRound: 0,
      totalRounds: 10,
      gameStarted: false,
      gameFinished: false,
      roundDuration: 30000, // 30 seconds
      config: {
        totalRounds: 10,
        roundDurationSeconds: 30,
        randomStartTime: true,
        musicCategory: "mixed",
        hostOnlyMode: false,
      },
      playersAnswered: new Set(),
      roundTimer: undefined,
    };
    this.games.set(gameId, game);
    this.playerToGame.set(hostId, gameId);
    return gameId;
  }

  joinGame(gameId: string, player: Player): boolean {
    const game = this.games.get(gameId);
    if (!game || game.gameStarted) {
      return false;
    }
    game.players.set(player.id, player);
    this.playerToGame.set(player.id, gameId);

    // Notify all players
    this.broadcastToGame(gameId, {
      type: "player_joined",
      data: {
        players: Array.from(game.players.values()).map((p) => ({
          id: p.id,
          name: p.name,
          score: p.score,
        })),
      },
    });

    return true;
  }

  startGame(gameId: string, hostId: string): boolean {
    const game = this.games.get(gameId);
    if (!game || game.hostId !== hostId || game.gameStarted) {
      return false;
    }

    game.gameStarted = true;
    this.broadcastToGame(gameId, {
      type: "game_started",
      data: { totalRounds: game.totalRounds },
    });

    // Start first round after a short delay
    setTimeout(async () => {
      await this.startNextRound(gameId);
    }, 3000);

    return true;
  }

  async startNextRound(gameId: string): Promise<void> {
    const game = this.games.get(gameId);
    if (!game || !game.gameStarted || game.gameFinished) {
      return;
    }

    game.currentRound++;

    if (game.currentRound > game.totalRounds) {
      this.finishGame(gameId);
      return;
    }

    try {
      console.log(`Starting round ${game.currentRound} for game ${gameId} with genre "${game.config.musicCategory}"`);

      // Get random tracks from Spotify for the selected genre
      const { correct, wrongOptions } = await spotifyService.getRandomTrackForRound(game.config.musicCategory);

      console.log(`Got Spotify track: "${correct.name}" by ${correct.artists[0]?.name}`);
      console.log(`Spotify URI: ${correct.uri}`);

      // Randomly choose to ask about artist or song
      const questionType = Math.random() > 0.5 ? "artist" : "song";

      let correctAnswer: string;
      let wrongAnswers: string[];

      if (questionType === "artist") {
        correctAnswer = spotifyService.getMainArtist(correct);
        wrongAnswers = wrongOptions.map((track) => spotifyService.getMainArtist(track));
      } else {
        correctAnswer = spotifyService.getCleanSongName(correct);
        wrongAnswers = wrongOptions.map((track) => spotifyService.getCleanSongName(track));
      }

      // Shuffle all options
      const options = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);

      game.currentSong = {
        correct: correctAnswer,
        options,
        type: questionType,
      };

      // Store full track information for displaying song details
      game.currentTrack = correct;

      game.roundStartTime = Date.now();

      // Clear answered players for new round
      game.playersAnswered.clear();

      // Clear previous round results
      if (!game.roundResults) {
        game.roundResults = new Map();
      } else {
        game.roundResults.clear();
      }

      this.broadcastToGame(gameId, {
        type: "round_started",
        data: {
          round: game.currentRound,
          totalRounds: game.totalRounds,
          question: {
            type: questionType,
            options,
            spotifyUri: correct.uri, // Spotify URI for Web Playback SDK (required)
          },
          duration: game.roundDuration,
          config: {
            randomStartTime: game.config.randomStartTime,
          },
        },
      });

      // Auto-advance after round duration
      game.roundTimer = setTimeout(() => {
        this.endRound(gameId);
      }, game.roundDuration);
    } catch (error) {
      console.error("Error fetching Spotify data for round:", error);

      // No fallback - if Spotify fails, the game fails
      this.broadcastToGame(gameId, {
        type: "error",
        data: { message: "Failed to fetch music data from Spotify. Please try again later." },
      });

      // End the game since we can't continue without Spotify data
      this.finishGame(gameId);
    }
  }

  submitAnswer(gameId: string, playerId: string, answer: string, answerTime?: number): void {
    const game = this.games.get(gameId);
    if (!game || !game.currentSong || !game.roundStartTime) {
      return;
    }

    const player = game.players.get(playerId);
    if (!player) {
      return;
    }

    // In host-only mode, prevent the host from submitting answers
    if (game.config.hostOnlyMode && playerId === game.hostId) {
      return; // Host cannot participate in answering
    }

    // Check if player already answered this round
    if (game.playersAnswered.has(playerId)) {
      return; // Player already answered, ignore duplicate
    }

    // Mark player as answered
    game.playersAnswered.add(playerId);

    const isCorrect = answer === game.currentSong.correct;
    let pointsGained = 0;

    if (isCorrect) {
      // Award points based on speed (faster = more points)
      const timeElapsed = Date.now() - game.roundStartTime;
      pointsGained = calculatePoints(isCorrect, timeElapsed, game.roundDuration);
      player.score += pointsGained;
    }

    // Store player's round result for later display
    if (!game.roundResults) {
      game.roundResults = new Map();
    }
    game.roundResults.set(playerId, {
      answer,
      correct: isCorrect,
      pointsGained,
      newScore: player.score,
      answerTime, // Include the answer time from client
    });

    // Send result to player
    player.ws.send(
      JSON.stringify({
        type: "answer_result",
        data: {
          correct: isCorrect,
          correctAnswer: game.currentSong.correct,
          points: isCorrect ? player.score : 0,
          pointsGained,
        },
      })
    );

    // Check if all players have answered
    const expectedAnswers = game.config.hostOnlyMode
      ? game.players.size - 1 // Exclude host from count
      : game.players.size;

    if (game.playersAnswered.size >= expectedAnswers) {
      console.log(`All players answered for game ${gameId}, ending round early`);
      // Clear the timeout since we're ending early
      if (game.roundTimer) {
        clearTimeout(game.roundTimer);
        game.roundTimer = undefined;
      }
      // End round immediately
      this.endRound(gameId);
    }
  }

  endRound(gameId: string): void {
    const game = this.games.get(gameId);
    if (!game || !game.currentSong) {
      return;
    }

    // Clear the round timer if it exists
    if (game.roundTimer) {
      clearTimeout(game.roundTimer);
      game.roundTimer = undefined;
    }

    // Prepare detailed round results
    const roundResults = Array.from(game.players.values()).map((player) => {
      const result = game.roundResults?.get(player.id);
      return {
        playerId: player.id,
        playerName: player.name,
        answer: result?.answer || "",
        correct: result?.correct || false,
        pointsGained: result?.pointsGained || 0,
        newScore: player.score,
        answerTime: result?.answerTime, // Include answer time
      };
    });

    // Update all players with current scores and round results
    this.broadcastToGame(gameId, {
      type: "round_ended",
      data: {
        correctAnswer: game.currentSong.correct,
        track: game.currentTrack
          ? {
              name: game.currentTrack.name,
              artist: spotifyService.getMainArtist(game.currentTrack),
              imageUrl: game.currentTrack.album.images?.[0]?.url || null,
            }
          : null,
        roundResults,
        scores: Array.from(game.players.values())
          .map((p) => ({
            id: p.id,
            name: p.name,
            score: p.score,
          }))
          .sort((a, b) => b.score - a.score),
      },
    });

    // Clear round results for next round
    game.roundResults?.clear();

    // Check if this is the final round
    const isFinalRound = game.currentRound >= game.totalRounds;

    if (isFinalRound) {
      // For the final round, skip round results and go straight to game finished
      // The music will continue playing until host navigates away from results
      console.log(`Final round completed - going straight to final results, keeping music playing`);

      // Go directly to game finished after a short delay (no round results display)
      setTimeout(() => {
        this.finishGame(gameId);
      }, 1000); // Just 1 second delay instead of 5
    } else {
      // For non-final rounds, use the existing fade-out logic
      const delayMs = 5000; // 5 second delay between rounds
      const fadeOutTime = 1000; // 1 second before next round

      // Signal to fade out music 1 second before next round
      setTimeout(() => {
        this.broadcastToGame(gameId, {
          type: "prepare_next_round",
          data: {
            fadeOutDuration: fadeOutTime,
          },
        });
      }, delayMs - fadeOutTime);

      // Start next round after full delay
      setTimeout(async () => {
        await this.startNextRound(gameId);
      }, delayMs);
    }
  }

  finishGame(gameId: string): void {
    const game = this.games.get(gameId);
    if (!game) {
      return;
    }

    game.gameFinished = true;
    const finalScores = Array.from(game.players.values())
      .map((p) => ({ id: p.id, name: p.name, score: p.score }))
      .sort((a, b) => b.score - a.score);

    // Don't signal to stop music - let it continue playing until host navigates away
    this.broadcastToGame(gameId, {
      type: "game_finished",
      data: {
        finalScores,
        track: game.currentTrack
          ? {
              name: game.currentTrack.name,
              artist: spotifyService.getMainArtist(game.currentTrack),
              imageUrl: game.currentTrack.album.images?.[0]?.url || null,
            }
          : null,
        keepMusicPlaying: true, // Signal to keep music playing on results screen
      },
    });
  }

  removePlayer(playerId: string): void {
    const gameId = this.playerToGame.get(playerId);
    if (!gameId) return;

    const game = this.games.get(gameId);
    if (!game) return;

    game.players.delete(playerId);
    game.playersAnswered.delete(playerId); // Remove from answered players too
    this.playerToGame.delete(playerId);

    // If host left, end the game
    if (playerId === game.hostId) {
      // Clear any active round timer
      if (game.roundTimer) {
        clearTimeout(game.roundTimer);
        game.roundTimer = undefined;
      }
      this.broadcastToGame(gameId, {
        type: "error",
        data: { message: "Host has left the game" },
      });
      this.games.delete(gameId);
    } else {
      // Check if all remaining players have answered (early round end)
      const expectedAnswers = game.config.hostOnlyMode
        ? game.players.size - 1 // Exclude host from count
        : game.players.size;

      if (game.gameStarted && game.currentSong && game.playersAnswered.size >= expectedAnswers) {
        console.log(`All remaining players answered for game ${gameId}, ending round early`);
        if (game.roundTimer) {
          clearTimeout(game.roundTimer);
          game.roundTimer = undefined;
        }
        this.endRound(gameId);
      } else {
        // Notify remaining players
        this.broadcastToGame(gameId, {
          type: "player_left",
          data: {
            players: Array.from(game.players.values()).map((p) => ({
              id: p.id,
              name: p.name,
              score: p.score,
            })),
          },
        });
      }
    }
  }

  updateGameConfig(gameId: string, hostId: string, config: GameConfig): boolean {
    const game = this.games.get(gameId);
    if (!game || game.hostId !== hostId || game.gameStarted) {
      return false;
    }

    // Update game configuration
    game.config = { ...config };
    game.totalRounds = config.totalRounds;
    game.roundDuration = config.roundDurationSeconds * 1000; // Convert to milliseconds

    // Notify all players about the config update
    this.broadcastToGame(gameId, {
      type: "config_updated",
      data: {
        config: game.config,
      },
    });

    return true;
  }

  resetGame(gameId: string, hostId: string): boolean {
    const game = this.games.get(gameId);
    if (!game || game.hostId !== hostId) {
      return false;
    }

    // Clear any active round timer
    if (game.roundTimer) {
      clearTimeout(game.roundTimer);
      game.roundTimer = undefined;
    }

    // Reset game state to lobby
    game.gameStarted = false;
    game.gameFinished = false;
    game.currentRound = 0;
    game.currentSong = undefined;
    game.currentTrack = undefined;
    game.roundStartTime = undefined;
    game.playersAnswered.clear();
    game.roundResults?.clear();

    // Reset all player scores
    game.players.forEach((player) => {
      player.score = 0;
    });

    // Notify all players that the game has been reset to lobby
    this.broadcastToGame(gameId, {
      type: "game_reset",
      data: {
        players: Array.from(game.players.values()).map((p) => ({
          id: p.id,
          name: p.name,
          score: p.score,
        })),
        config: game.config,
      },
    });

    return true;
  }

  private broadcastToGame(gameId: string, message: Message): void {
    const game = this.games.get(gameId);
    if (!game) return;

    const messageStr = JSON.stringify(message);
    game.players.forEach((player) => {
      if (player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(messageStr);
      }
    });
  }

  getGame(gameId: string): GameState | undefined {
    return this.games.get(gameId);
  }
}

const gameManager = new GameManager();

// Store the WebSocket server instance
let wsServerInstance: WebSocketServer | null = null;

export function createWebSocketServer() {
  // If server already exists, return the existing instance
  if (wsServerInstance) {
    console.log("WebSocket server already running, reusing existing instance");
    return wsServerInstance;
  }

  console.log("Creating new WebSocket server...");
  const wss = new WebSocketServer({
    port: 8080,
    host: "0.0.0.0", // Allow connections from any IP
  });

  // Store the instance
  wsServerInstance = wss;

  // Handle server errors (like port already in use)
  wss.on("error", (error: any) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port 8080 is already in use. This might be due to hot reloading - the connection should still work.`);
      // Don't reset wsServerInstance here, keep the working one
    } else {
      console.error("WebSocket server error:", error);
      wsServerInstance = null; // Reset on other errors
    }
  });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    console.log(`New WebSocket connection from ${req.socket.remoteAddress}:${req.socket.remotePort}`);
    let playerId: string;

    ws.on("message", (data: Buffer) => {
      try {
        const message: Message = JSON.parse(data.toString());
        console.log(`Received message from ${req.socket.remoteAddress}: ${message.type}`, message.data || "");

        switch (message.type) {
          case "join":
            if (message.data.isHost) {
              // Create new game
              playerId = generatePlayerId();
              const gameId = gameManager.createGame(playerId);
              const player: Player = {
                id: playerId,
                name: message.data.name,
                score: 0,
                ws,
              };
              gameManager.joinGame(gameId, player);

              ws.send(
                JSON.stringify({
                  type: "joined",
                  data: { gameId, playerId, isHost: true },
                })
              );
              console.log(`Host ${message.data.name} created game ${gameId}`);
            } else {
              // Join existing game
              playerId = generatePlayerId();
              const player: Player = {
                id: playerId,
                name: message.data.name,
                score: 0,
                ws,
              };

              if (gameManager.joinGame(message.data.gameId, player)) {
                ws.send(
                  JSON.stringify({
                    type: "joined",
                    data: { gameId: message.data.gameId, playerId, isHost: false },
                  })
                );
                console.log(`Player ${message.data.name} joined game ${message.data.gameId}`);
              } else {
                ws.send(
                  JSON.stringify({
                    type: "error",
                    data: { message: "Could not join game" },
                  })
                );
              }
            }
            break;

          case "start_game":
            if (playerId && message.gameId) {
              gameManager.startGame(message.gameId, playerId);
            }
            break;

          case "answer":
            if (playerId && message.gameId && message.data.answer) {
              gameManager.submitAnswer(message.gameId, playerId, message.data.answer, message.data.answerTime);
            }
            break;

          case "update_config":
            if (playerId && message.gameId && message.data.config) {
              gameManager.updateGameConfig(message.gameId, playerId, message.data.config);
            }
            break;

          case "play_again":
            if (playerId && message.gameId) {
              gameManager.resetGame(message.gameId, playerId);
            }
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        ws.send(
          JSON.stringify({
            type: "error",
            data: { message: "Invalid message format" },
          })
        );
      }
    });

    ws.on("close", () => {
      console.log(`WebSocket connection closed for player ${playerId || "unknown"}`);
      if (playerId) {
        gameManager.removePlayer(playerId);
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error for player", playerId || "unknown", ":", error);
    });
  });

  console.log("WebSocket server running on port 8080");
  return wss;
}

export function closeWebSocketServer() {
  if (wsServerInstance) {
    console.log("Closing WebSocket server...");
    wsServerInstance.close();
    wsServerInstance = null;
  }
}

export function getWebSocketServer() {
  return wsServerInstance;
}
