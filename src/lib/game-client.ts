import { spotifyWebPlayback } from "./spotify-playback.js";

export interface GameConfig {
  totalRounds: number;
  roundDurationSeconds: number;
  randomStartTime: boolean;
  musicCategory: string;
  hostOnlyMode: boolean; // Host plays music but doesn't participate in answering
}

export interface RoundResult {
  playerId: string;
  playerName: string;
  answer: string;
  correct: boolean;
  pointsGained: number;
  newScore: number;
  answerTime?: number; // Time in seconds it took to answer
}

export interface TrackInfo {
  name: string;
  artist: string;
  imageUrl: string | null;
}

export interface GameState {
  id: string;
  isHost: boolean;
  playerId: string;
  players: Player[];
  currentRound: number;
  totalRounds: number;
  gameStarted: boolean;
  gameFinished: boolean;
  currentQuestion?: {
    type: "artist" | "song";
    options: string[];
    spotifyUri: string; // Spotify URI for Web Playback SDK (required)
  };
  scores?: PlayerScore[];
  roundTimeLeft?: number;
  config?: GameConfig;
  showingRoundResults?: boolean;
  lastRoundResults?: RoundResult[];
  currentTrack?: TrackInfo; // Track information for displaying song details
}

export interface Player {
  id: string;
  name: string;
  score: number;
}

export interface PlayerScore {
  id: string;
  name: string;
  score: number;
}

export interface WebSocketMessage {
  type:
    | "join"
    | "start_game"
    | "answer"
    | "update_config"
    | "play_again"
    | "joined"
    | "player_joined"
    | "player_left"
    | "game_started"
    | "round_started"
    | "answer_result"
    | "round_ended"
    | "prepare_next_round"
    | "game_finished"
    | "game_reset"
    | "config_updated"
    | "error";
  data?: any;
  gameId?: string;
}

export class GameClient {
  private ws: WebSocket | null = null;
  private gameState: GameState = {
    id: "",
    isHost: false,
    playerId: "",
    players: [],
    currentRound: 0,
    totalRounds: 10,
    gameStarted: false,
    gameFinished: false,
    config: {
      totalRounds: 10,
      roundDurationSeconds: 30,
      randomStartTime: false,
      musicCategory: "mixed",
      hostOnlyMode: false,
    },
  };
  private connectionState: "disconnected" | "connecting" | "connected" = "disconnected";
  private error: string | null = null;
  private roundTimer: number | null = null;
  private roundStartTime: number | null = null; // Track when current round started
  private listeners: (() => void)[] = [];
  private spotifyAccessToken: string | null = null;
  private isSpotifyReady = false;

  constructor() {
    // Initialize Spotify Web Playback when needed
    this.initializeSpotifyIfNeeded();
  }

  // Subscribe to state changes
  subscribe(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notify() {
    this.listeners.forEach((callback) => callback());
  }

  get state() {
    return this.gameState;
  }

  get connected() {
    return this.connectionState === "connected";
  }

  get connecting() {
    return this.connectionState === "connecting";
  }

  get errorMessage() {
    return this.error;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.connectionState = "connecting";
      this.error = null;
      try {
        // Use the current host but connect to WebSocket on port 8080
        const wsHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
        this.ws = new WebSocket(`ws://${wsHost}:8080`);

        this.ws.onopen = () => {
          this.connectionState = "connected";
          this.notify();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        this.ws.onclose = () => {
          this.connectionState = "disconnected";
          this.notify();
          this.clearRoundTimer();
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          this.connectionState = "disconnected";
          this.error = "Connection failed";
          this.notify();
          reject(new Error("WebSocket connection failed"));
        };
      } catch (error) {
        this.connectionState = "disconnected";
        this.error = "Failed to create WebSocket connection";
        this.notify();
        reject(error);
      }
    });
  }

  disconnect() {
    // Stop music if host is disconnecting
    if (this.gameState.isHost && spotifyWebPlayback.isPlayerReady()) {
      this.stopGameMusic();
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionState = "disconnected";
    this.notify();
    this.clearRoundTimer();
  }

  createGame(playerName: string) {
    this.sendMessage({
      type: "join",
      data: { name: playerName, isHost: true },
    });

    // Initialize Spotify for hosts if available
    if (this.spotifyAccessToken) {
      this.initializeSpotify();
    }
  }

  joinGame(gameId: string, playerName: string) {
    this.sendMessage({
      type: "join",
      data: { gameId, name: playerName, isHost: false },
    });
  }

  startGame() {
    if (this.gameState.isHost) {
      this.sendMessage({
        type: "start_game",
        gameId: this.gameState.id,
      });
    }
  }

  updateGameConfig(config: GameConfig) {
    if (this.gameState.isHost) {
      this.sendMessage({
        type: "update_config",
        gameId: this.gameState.id,
        data: { config },
      });
    }
  }

  playAgain() {
    if (this.gameState.isHost) {
      // Stop current music before resetting
      if (spotifyWebPlayback.isPlayerReady()) {
        this.stopGameMusic();
      }

      this.sendMessage({
        type: "play_again",
        gameId: this.gameState.id,
      });
    }
  }

  submitAnswer(answer: string) {
    // Calculate answer time if round start time is tracked
    let answerTime: number | undefined;
    if (this.roundStartTime) {
      answerTime = (Date.now() - this.roundStartTime) / 1000; // Convert to seconds
    }

    this.sendMessage({
      type: "answer",
      gameId: this.gameState.id,
      data: {
        answer,
        answerTime,
      },
    });
  }

  private sendMessage(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.error = "Not connected to server";
      this.notify();
    }
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case "joined":
        this.gameState.id = message.data.gameId;
        this.gameState.isHost = message.data.isHost;
        this.gameState.playerId = message.data.playerId;
        this.notify();
        break;

      case "player_joined":
        this.gameState.players = message.data.players;
        this.notify();
        break;

      case "game_started":
        this.gameState.gameStarted = true;
        this.gameState.totalRounds = message.data.totalRounds;
        this.notify();
        break;

      case "config_updated":
        this.gameState.config = message.data.config;
        this.gameState.totalRounds = message.data.config.totalRounds;
        this.notify();
        break;

      case "round_started":
        this.gameState.currentRound = message.data.round;
        this.gameState.currentQuestion = message.data.question;
        this.gameState.showingRoundResults = false; // Hide round results when starting new round
        this.roundStartTime = Date.now(); // Track when round started
        this.startRoundTimer(message.data.duration);
        this.notify();
        break;

      case "answer_result":
        // Handle individual answer result
        if (message.data.correct) {
          // Update player's score in the local state
          const player = this.gameState.players.find((p) => p.id === this.gameState.playerId);
          if (player) {
            player.score = message.data.points;
          }
        }
        this.notify();
        break;

      case "round_ended":
        this.gameState.scores = message.data.scores;
        this.gameState.lastRoundResults = message.data.roundResults; // Store detailed round results
        this.gameState.currentTrack = message.data.track; // Store track information

        // Only show round results for non-final rounds
        const isFinalRound = this.gameState.currentRound >= this.gameState.totalRounds;
        this.gameState.showingRoundResults = !isFinalRound; // Don't show round results for final round

        this.gameState.currentQuestion = undefined;
        this.clearRoundTimer();
        this.notify();
        break;

      case "prepare_next_round":
        // Signal to start fading out music before next round
        if (this.gameState.isHost) {
          this.fadeOutMusic(message.data.fadeOutDuration);
        }
        this.notify();
        break;

      case "game_finished":
        this.gameState.gameFinished = true;
        this.gameState.scores = message.data.finalScores;
        this.gameState.currentTrack = message.data.track; // Store track information for final results
        this.gameState.currentQuestion = undefined;
        this.gameState.showingRoundResults = false;
        this.clearRoundTimer();

        // For final round, music continues playing on results screen
        // It will only stop when host navigates away or disconnects
        console.log("Game finished - music continues playing until host navigates away");

        this.notify();
        break;

      case "game_reset":
        // Reset game state back to lobby
        this.gameState.gameStarted = false;
        this.gameState.gameFinished = false;
        this.gameState.currentRound = 0;
        this.gameState.currentQuestion = undefined;
        this.gameState.currentTrack = undefined;
        this.gameState.scores = undefined;
        this.gameState.roundTimeLeft = undefined;
        this.gameState.showingRoundResults = false;
        this.gameState.lastRoundResults = undefined;

        // Update players with reset scores
        this.gameState.players = message.data.players;

        // Update config
        this.gameState.config = message.data.config;

        this.clearRoundTimer();
        console.log("Game reset - returning to lobby");
        this.notify();
        break;

      case "error":
        this.error = message.data.message;
        this.notify();
        break;
    }
  }

  private startRoundTimer(duration: number) {
    this.clearRoundTimer();
    this.gameState.roundTimeLeft = Math.floor(duration / 1000);

    this.roundTimer = window.setInterval(() => {
      if (this.gameState.roundTimeLeft && this.gameState.roundTimeLeft > 0) {
        this.gameState.roundTimeLeft--;
        this.notify();
      } else {
        this.clearRoundTimer();
      }
    }, 1000);
  }

  private clearRoundTimer() {
    if (this.roundTimer) {
      clearInterval(this.roundTimer);
      this.roundTimer = null;
    }
    this.gameState.roundTimeLeft = undefined;
    this.notify();
  }

  private async initializeSpotifyIfNeeded() {
    // Only run in browser environment
    if (typeof window === "undefined") return;

    // Check if we have Spotify auth token from URL params or cookies
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("spotify_auth") === "success") {
      await this.initializeSpotify();
    }
  }

  async initializeSpotify(): Promise<void> {
    try {
      // Get access token from cookies or session storage
      const token = await this.getSpotifyAccessToken();
      if (!token) {
        console.log("No Spotify access token available");
        return;
      }

      this.spotifyAccessToken = token;

      // Initialize Spotify Web Playback (only for hosts)
      if (this.gameState.isHost) {
        spotifyWebPlayback.setHostStatus(true);
        await spotifyWebPlayback.initialize(token);
        this.isSpotifyReady = true;
        console.log("Spotify Web Playback initialized for host");
      }
    } catch (error) {
      console.error("Failed to initialize Spotify:", error);
    }
  }

  private async getSpotifyAccessToken(): Promise<string | null> {
    try {
      // Try to get token from a secure endpoint
      const response = await fetch("/api/spotify/token");
      if (response.ok) {
        const data = await response.json();
        return data.access_token;
      } else if (response.status === 401) {
        // No access token available - this is normal if user hasn't authenticated yet
        console.log("No Spotify access token available - user needs to authenticate");
        return null;
      } else {
        console.error("Failed to get Spotify access token:", response.status, response.statusText);
        return null;
      }
    } catch (error) {
      console.error("Failed to get Spotify access token:", error);
      return null;
    }
  }

  async authenticateSpotify(): Promise<void> {
    // Only run in browser environment
    if (typeof window === "undefined") {
      console.warn("Cannot authenticate Spotify on server side");
      return;
    }

    // Redirect to Spotify OAuth
    window.location.href = "/auth/spotify";
  }

  private async fadeOutMusic(duration: number = 1000): Promise<void> {
    try {
      if (this.gameState.isHost && spotifyWebPlayback.isPlayerReady()) {
        console.log(`Starting fade-out for ${duration}ms before next round`);
        await spotifyWebPlayback.fadeOut(duration);
      }
    } catch (error) {
      console.error("Error fading out music:", error);
    }
  }

  private async stopGameMusic(): Promise<void> {
    try {
      if (this.gameState.isHost && spotifyWebPlayback.isPlayerReady()) {
        console.log("Stopping music as game has finished");
        await spotifyWebPlayback.stopTrack();
      }
    } catch (error) {
      console.error("Error stopping music:", error);
    }
  }
}
