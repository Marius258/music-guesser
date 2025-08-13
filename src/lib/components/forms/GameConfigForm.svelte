<script lang="ts">
  import type { GameConfig } from "$lib/game-client.js";
  import { onMount } from "svelte";
  import { Loading } from "../common/index.js";

  interface SpotifyGenre {
    id: string;
    name: string;
    description: string;
    icons?: { url: string; height: number; width: number }[];
  }

  interface Props {
    config: GameConfig;
    onupdateconfig: (config: GameConfig) => void;
  }

  let { config, onupdateconfig }: Props = $props();

  // Local state for the form
  let localConfig = $state<GameConfig>({
    totalRounds: config.totalRounds,
    roundDurationSeconds: config.roundDurationSeconds,
    randomStartTime: config.randomStartTime,
    musicCategory: config.musicCategory,
    hostOnlyMode: config.hostOnlyMode,
  });

  let availableGenres = $state<SpotifyGenre[]>([]);
  let genresLoading = $state(true);

  // Auto-save when any config value changes
  $effect(() => {
    // Only update if the local config is different from the prop config
    if (
      localConfig.totalRounds !== config.totalRounds ||
      localConfig.roundDurationSeconds !== config.roundDurationSeconds ||
      localConfig.randomStartTime !== config.randomStartTime ||
      localConfig.musicCategory !== config.musicCategory ||
      localConfig.hostOnlyMode !== config.hostOnlyMode
    ) {
      onupdateconfig(localConfig);
    }
  });

  onMount(async () => {
    try {
      const response = await fetch("/api/spotify/categories");
      const data = await response.json();

      if (data.success) {
        availableGenres = data.categories;
        console.log("AvailableGenres: ", availableGenres);
      } else {
        console.error("Failed to fetch genres:", data.error);
        throw new Error(data.error || "Failed to fetch genres");
      }
    } catch (error) {
      console.error("Error fetching genres:", error);
    } finally {
      genresLoading = false;
    }
  });

  function handleReset() {
    localConfig = {
      totalRounds: 10,
      roundDurationSeconds: 30,
      randomStartTime: true,
      musicCategory: "mixed",
      hostOnlyMode: false,
    };
  }

  function selectGenre(genreName: string) {
    // If "Mixed" is selected, use "mixed" as the category
    if (genreName.toLowerCase() === "mixed") {
      localConfig.musicCategory = "mixed";
      return;
    }

    // Set the genre as the category
    localConfig.musicCategory = genreName;
  }

  function getGenreImage(genre: SpotifyGenre): string | null {
    if (genre.icons && genre.icons.length > 0) {
      // Find a medium-sized icon (prefer 300x300 or similar)
      const mediumIcon = genre.icons.find((icon) => icon.height >= 200 && icon.height <= 400);
      return mediumIcon ? mediumIcon.url : genre.icons[0].url;
    }
    return null;
  }
</script>

<div class="card variant-ghost-surface p-4 space-y-4">
  <div class="text-center">
    <h3 class="h4">Game Configuration <small class="text-xs opacity-75">(Auto-saves)</small></h3>
  </div>

  <div class="space-y-4">
    <label class="label">
      <span class="text-sm">Total Rounds</span>
      <input id="totalRounds" type="number" bind:value={localConfig.totalRounds} min="3" max="50" class="input variant-form-material" />
      <small class="text-xs opacity-75">Number of questions in the game (3-50)</small>
    </label>

    <label class="label">
      <span class="text-sm">Round Duration</span>
      <select id="roundDuration" bind:value={localConfig.roundDurationSeconds} class="select variant-form-material">
        <option value={15}>15 seconds</option>
        <option value={20}>20 seconds</option>
        <option value={25}>25 seconds</option>
        <option value={30}>30 seconds</option>
        <option value={45}>45 seconds</option>
        <option value={60}>60 seconds</option>
      </select>
      <small class="text-xs opacity-75">How long players have to answer each question</small>
    </label>

    <div class="space-y-3">
      <span class="text-sm font-medium">Music Genre</span>
      {#if genresLoading}
        <div class="flex justify-center py-4">
          <Loading text="Loading music genres..." size="small" />
        </div>
      {:else}
        <div class="space-y-4">
          <!-- Mixed option -->
          <div>
            <button
              type="button"
              class="btn w-full {localConfig.musicCategory === 'mixed' ? 'variant-filled-primary' : 'variant-ghost-surface'}"
              onclick={() => selectGenre("Mixed")}
            >
              <span>Mixed (All Genres)</span>
              {#if localConfig.musicCategory === "mixed"}
                <span class="ml-2">✓</span>
              {/if}
            </button>
          </div>

          <!-- Specific genres -->
          <div class="space-y-2">
            <span class="text-xs font-medium opacity-75">Specific Genres:</span>
            <div class="grid grid-cols-2 gap-2">
              {#each availableGenres as genre (genre.name)}
                <button
                  type="button"
                  class="btn btn-sm {localConfig.musicCategory === genre.name ? 'variant-filled-primary' : 'variant-ghost-surface'}"
                  onclick={() => selectGenre(genre.name)}
                >
                  <span class="text-xs truncate">{genre.name}</span>
                  {#if localConfig.musicCategory === genre.name}
                    <span class="ml-1">✓</span>
                  {/if}
                </button>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </div>

    <label class="flex items-center space-x-3">
      <input type="checkbox" bind:checked={localConfig.randomStartTime} class="checkbox" />
      <div class="label">
        <span class="text-sm">Random Start Time</span>
      </div>
    </label>

    <label class="flex items-center space-x-3">
      <input type="checkbox" bind:checked={localConfig.hostOnlyMode} class="checkbox" />
      <div class="label">
        <span class="text-sm">Host Only Mode</span>
      </div>
    </label>

    <div class="pt-2">
      <button type="button" onclick={handleReset} class="btn preset-glass-primary">
        <span>Reset to Defaults</span>
      </button>
    </div>
  </div>
</div>

<style>
</style>
