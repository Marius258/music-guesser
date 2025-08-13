<script lang="ts">
  import { replaceState } from "$app/navigation";
  import { page } from "$app/state";

  // Auto-uppercase game ID as user types and validate format
  function handleGameIdInput(event: Event) {
    const target = event.target as HTMLInputElement;
    let value = target.value.toUpperCase();

    // Remove any non-alphanumeric characters
    value = value.replace(/[^A-Z0-9]/g, "");

    // Limit to 6 characters
    if (value.length > 6) {
      value = value.substring(0, 6);
    }

    gameId = value;
  }

  // Validate game ID format (3 letters + 3 numbers)
  function isValidGameId(id: string): boolean {
    return /^[A-Z]{3}[0-9]{3}$/.test(id);
  }

  interface Props {
    oncreategame: (playerName: string) => void;
    onjoingame: (gameId: string, playerName: string) => void;
    onauthenticatespotify?: () => void;
    spotifyConnected?: boolean;
  }

  let { oncreategame, onjoingame, onauthenticatespotify, spotifyConnected = false }: Props = $props();

  let playerName = $state("");
  let gameId = $state("");

  // Check if user came back from Spotify auth
  let spotifyAuthSuccess = $state(false);
  $effect(() => {
    // Only run in browser environment and wait for page store to be ready
    if (typeof window === "undefined" || !page.url) return;

    const urlParams = page.url.searchParams;
    if (urlParams.get("spotify_auth") === "success") {
      spotifyAuthSuccess = true;
      // Clean up URL using SvelteKit's navigation after a short delay to ensure router is ready
      setTimeout(() => {
        try {
          replaceState("", {});
        } catch (error) {
          console.warn("Could not clean up URL:", error);
          // Fallback to manual URL cleanup if SvelteKit navigation fails
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.delete("spotify_auth");
            window.history.replaceState({}, "", url.toString());
          }
        }
      }, 100);
    }
  });

  function handleHostGame() {
    // Authenticate with Spotify first if not already connected
    if (!spotifyConnected && onauthenticatespotify) {
      onauthenticatespotify();
    } else {
      oncreategame(playerName.trim());
    }
  }

  function handleJoinGame() {
    if (!playerName.trim() || !gameId.trim()) return;

    // Validate game ID format
    if (!isValidGameId(gameId.trim())) {
      alert("Please enter a valid Game ID (3 letters + 3 numbers, e.g., ABC123)");
      return;
    }

    onjoingame(gameId.trim(), playerName.trim());
  }
</script>

<div class="card w-full max-w-md preset-filled-surface-100-900 p-4 text-center space-y-4">
  <div>
    <button type="button" class="btn preset-gradient" onclick={handleHostGame}> Host with Spotify </button>
  </div>
  <div class="space-y-4">
    <h3>Or join a Game</h3>
    <div>
      <div class="input-group grid-cols-[auto_1fr_auto]">
        <div class="ig-cell preset-tonal">Game ID</div>
        <input
          class="ig-input {gameId && !isValidGameId(gameId) ? 'invalid' : ''}"
          type="text"
          placeholder="e.g. ABC123"
          oninput={handleGameIdInput}
          maxlength="6"
          style="text-transform: uppercase;"
          bind:value={gameId}
        />
      </div>

      <div class="min-h-6">
        {#if gameId && !isValidGameId(gameId)}
          <small>Format: 3 letters + 3 numbers (e.g., ABC123)</small>
        {/if}
      </div>
    </div>
    <div>
      <div class="input-group grid-cols-[auto_1fr_auto]">
        <div class="ig-cell preset-tonal">Name</div>
        <input class="ig-input" type="text" placeholder="Enter your name" bind:value={playerName} maxlength="20" />
      </div>
    </div>
    <div>
      <button
        type="button"
        class="btn preset-glass-primary"
        onclick={handleJoinGame}
        disabled={!playerName.trim() || !gameId.trim() || !isValidGameId(gameId.trim())}
      >
        Join Game
      </button>
    </div>
  </div>
</div>
