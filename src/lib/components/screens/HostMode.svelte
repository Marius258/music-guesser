<script lang="ts">
  let {
    connected,
    connecting,
    oncreategame,
    onspotifylogout,
  }: {
    connected: boolean;
    connecting: boolean;
    oncreategame: (playerName: string) => void;
    onspotifylogout: () => void;
  } = $props();

  let playerName = $state("");
</script>

<!-- Host mode when Spotify is connected -->
<div class="card w-full max-w-md preset-filled-surface-100-900 p-4 text-center space-y-4">
  <div class="space-y-4">
    <h2 class="text-2xl font-bold">Host Mode</h2>

    <div>
      <div class="space-y-4">
        <div>
          <input type="text" bind:value={playerName} placeholder="Enter your name" class="input" maxlength="20" />
        </div>
        <button type="button" class="btn preset-gradient" onclick={() => oncreategame(playerName)} disabled={!playerName.trim() || connecting}>
          {connecting ? "Connecting..." : "Create Game as Host"}
        </button>
      </div>

      <div class="mt-4">
        <button type="button" class="btn preset-glass-primary" onclick={onspotifylogout}> Logout from Spotify </button>
      </div>
    </div>
  </div>
</div>

<style>
</style>
