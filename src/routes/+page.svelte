<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { GameClient } from "$lib/game-client.js";
  import type { GameConfig } from "$lib/game-client.js";
  import { WelcomeScreen, Lobby, GamePlay, GameResults, ConnectionStatus, HostMode } from "$lib/components";

  let gameClient = new GameClient();
  let gameState = $state(gameClient.state);
  let connected = $state(gameClient.connected);
  let connecting = $state(gameClient.connecting);
  let error = $state(gameClient.errorMessage);
  let spotifyConnected = $state(false);
  let unsubscribe: (() => void) | null = null;

  // Update reactive state when game client changes
  function updateState() {
    gameState = { ...gameClient.state };
    connected = gameClient.connected;
    connecting = gameClient.connecting;
    error = gameClient.errorMessage;
  }

  function setupGameClient() {
    // Clean up previous subscription
    if (unsubscribe) {
      unsubscribe();
    }

    // Subscribe to new game client
    unsubscribe = gameClient.subscribe(updateState);
    updateState();
  }

  // Determine current screen
  let currentScreen = $derived(() => {
    if (!connected && !connecting) {
      // If Spotify is connected, show host mode directly
      return spotifyConnected ? "host" : "welcome";
    }
    if (!gameState.id) {
      return spotifyConnected ? "host" : "welcome";
    }
    if (gameState.gameFinished) return "results";
    if (gameState.gameStarted) return "game";
    return "lobby";
  });

  onMount(() => {
    // Setup initial game client
    setupGameClient();

    // Initialize Spotify if user just authenticated (onMount ensures browser environment)
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("spotify_auth") === "success") {
        spotifyConnected = true;
        gameClient.initializeSpotify();
      }
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  });

  async function handleConnect() {
    try {
      await gameClient.connect();
    } catch (err) {
      console.error("Failed to connect:", err);
    }
  }

  async function handleCreateGame(playerName: string) {
    // Auto-connect if not already connected
    if (!connected && !connecting) {
      try {
        await handleConnect();
      } catch (err) {
        console.error("Failed to auto-connect:", err);
        return;
      }
    }

    // Wait for connection to be established
    if (connecting) {
      // Wait for connection to complete
      await new Promise<void>((resolve, reject) => {
        const checkConnection = () => {
          if (connected) {
            resolve();
          } else if (!connecting && !connected) {
            reject(new Error("Connection failed"));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }

    gameClient.createGame(playerName);
  }

  async function handleJoinGame(gameId: string, playerName: string) {
    // Auto-connect if not already connected
    if (!connected && !connecting) {
      try {
        await handleConnect();
      } catch (err) {
        console.error("Failed to auto-connect:", err);
        return;
      }
    }

    // Wait for connection to be established
    if (connecting) {
      // Wait for connection to complete
      await new Promise<void>((resolve, reject) => {
        const checkConnection = () => {
          if (connected) {
            resolve();
          } else if (!connecting && !connected) {
            reject(new Error("Connection failed"));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }

    gameClient.joinGame(gameId, playerName);
  }

  function handleStartGame() {
    gameClient.startGame();
  }

  function handleUpdateGameConfig(config: GameConfig) {
    gameClient.updateGameConfig(config);
  }

  function handleSubmitAnswer(answer: string) {
    gameClient.submitAnswer(answer);
  }

  function handlePlayAgain() {
    // Only the host can play again, and it will reset the game to lobby for all players
    gameClient.playAgain();
  }

  async function handleAuthenticateSpotify() {
    await gameClient.authenticateSpotify();
  }

  function handleSpotifyLogout() {
    spotifyConnected = false;
    // Reset game state and disconnect
    gameClient.disconnect();
    gameClient = new GameClient();
    setupGameClient();

    // Clear Spotify cookies by making a request to logout endpoint
    if (typeof window !== "undefined") {
      fetch("/api/spotify/logout", { method: "POST" }).catch(console.error);
    }
  }
</script>

<svelte:head>
  <title>Music Guesser</title>
  <meta name="description" content="A multiplayer music guessing game" />
</svelte:head>

<div class="container min-h-screen min-w-screen flex flex-col">
  <header class="flex justify-end p-5">
    <ConnectionStatus {connected} {connecting} {error} />
  </header>

  <main class="flex-1 flex justify-center items-center">
    {#if currentScreen() === "welcome"}
      <WelcomeScreen
        {spotifyConnected}
        oncreategame={handleCreateGame}
        onjoingame={handleJoinGame}
        onauthenticatespotify={handleAuthenticateSpotify}
      />
    {:else if currentScreen() === "host"}
      <HostMode {connected} {connecting} oncreategame={handleCreateGame} onspotifylogout={handleSpotifyLogout} />
    {:else if currentScreen() === "lobby"}
      <Lobby {gameState} onstartgame={handleStartGame} onupdateconfig={handleUpdateGameConfig} />
    {:else if currentScreen() === "game"}
      {@const gamePlayProps = { gameState, onsubmitanswer: handleSubmitAnswer }}
      <GamePlay {...gamePlayProps} />
    {:else if currentScreen() === "results"}
      <GameResults {gameState} onplayagain={handlePlayAgain} />
    {/if}
  </main>
</div>

<style>
</style>
