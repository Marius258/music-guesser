<script lang="ts">
  import type { GameState, GameConfig } from "$lib/game-client.js";
  import { GameConfigForm } from "../forms/index.js";
  import { Loading } from "../common/index.js";

  interface SpotifyGenre {
    id: string;
    name: string;
    icons?: { url: string; height: number; width: number }[];
    isMainGenre?: boolean;
    subgenres?: string[];
  }

  interface Props {
    gameState: GameState;
    onstartgame: () => void;
    onupdateconfig?: (config: GameConfig) => void;
  }

  let { gameState, onstartgame, onupdateconfig }: Props = $props();
  let availableGenres = $state<SpotifyGenre[]>([]);

  function getGenreDisplayName(genreId: string): string {
    const spotifyGenre = availableGenres.find((genre) => genre.name === genreId);
    if (spotifyGenre) {
      return spotifyGenre.name;
    }

    return genreId;
  }
</script>

<div class="card w-full max-w-md preset-filled-surface-100-900 p-4 text-center space-y-4">
  <!-- Header Section -->
  <div class="text-center space-y-4">
    <h2 class="h3">Game Lobby</h2>

    <div class="flex justify-center items-center gap-3">
      <span class="text-sm font-medium">Game ID:</span>
      <div class="chip variant-filled-primary">
        <span class="font-mono text-sm">{gameState.id}</span>
      </div>
    </div>
  </div>

  <!-- Players Section -->
  <div class="card variant-ghost-surface p-4 space-y-3">
    <h3 class="h4 text-center">Players ({gameState.players.length})</h3>

    <div class="space-y-2 max-h-48 overflow-y-auto">
      {#each gameState.players as player (player.id)}
        <div class="card variant-soft-surface flex justify-between items-center p-3">
          <span class="font-medium">{player.name}</span>
          <div class="flex gap-2">
            {#if player.id === gameState.playerId}
              <span class="badge variant-filled-primary text-xs">You</span>
            {/if}
            {#if gameState.isHost && player.id === gameState.playerId}
              <span class="badge variant-filled-secondary text-xs">Host</span>
            {/if}
          </div>
        </div>
      {/each}

      {#if gameState.players.length === 0}
        <div class="text-center py-4 opacity-75 text-sm">Waiting for players to join...</div>
      {/if}
    </div>
  </div>

  <!-- Host Controls Section -->
  {#if gameState.isHost}
    <div class="space-y-4">
      <!-- Game Configuration -->
      {#if gameState.config && onupdateconfig}
        <GameConfigForm config={gameState.config} {onupdateconfig} />
      {/if}

      <!-- Current Settings Display -->
      {#if gameState.config}
        <div class="card variant-ghost-surface p-4">
          <h3 class="h4 mb-3 text-center">Current Settings</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="card variant-soft-surface p-3 flex justify-between items-center">
              <span class="text-sm opacity-75">Rounds:</span>
              <span class="badge variant-filled-primary text-xs">{gameState.config.totalRounds}</span>
            </div>

            <div class="card variant-soft-surface p-3 flex justify-between items-center">
              <span class="text-sm opacity-75">Duration:</span>
              <span class="badge variant-filled-primary text-xs">{gameState.config.roundDurationSeconds}s</span>
            </div>

            <div class="card variant-soft-surface p-3 flex justify-between items-center">
              <span class="text-sm opacity-75">Random Start:</span>
              <span class="badge variant-filled-primary text-xs">{gameState.config.randomStartTime ? "Yes" : "No"}</span>
            </div>

            <div class="card variant-soft-surface p-3 flex justify-between items-center">
              <span class="text-sm opacity-75">Host Mode:</span>
              <span class="badge variant-filled-primary text-xs">{gameState.config.hostOnlyMode ? "Yes" : "No"}</span>
            </div>

            <div class="card variant-soft-surface p-3 flex justify-between items-center md:col-span-2">
              <span class="text-sm opacity-75">Genre:</span>
              <span class="badge variant-filled-primary text-xs">{getGenreDisplayName(gameState.config.musicCategory)}</span>
            </div>
          </div>
        </div>
      {/if}

      <!-- Start Game Button -->
      <div class="text-center space-y-2">
        <button type="button" onclick={onstartgame} disabled={gameState.players.length < 1} class="btn preset-gradient">
          <span>{gameState.players.length < 1 ? "Waiting for players..." : "Start Game"}</span>
        </button>

        <p class="text-xs opacity-75">Minimum 1 player required to start</p>
      </div>
    </div>
  {:else}
    <!-- Non-Host View -->
    <div class="text-center py-8">
      <div class="card variant-ghost-surface p-6">
        <Loading type="dots" text="Waiting for host to start the game..." />
      </div>
    </div>
  {/if}
</div>

<style>
</style>
