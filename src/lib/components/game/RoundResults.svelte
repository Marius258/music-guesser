<script lang="ts">
  import type { RoundResult } from "$lib/game-client.js";
  import SongInfo from "./SongInfo.svelte";
  import type { TrackInfo } from "$lib/game-client.js";
  import { formatAnswerTime } from "$lib/utils.js";

  interface Props {
    roundResults: RoundResult[];
    roundNumber: number;
    playerId: string;
    track?: TrackInfo;
  }

  let { roundResults, roundNumber, playerId, track }: Props = $props();

  // Get fastest correct answers for leaderboard
  let fastestCorrectAnswers = $derived(
    roundResults
      .filter((result) => result.correct && result.answerTime)
      .sort((a, b) => (a.answerTime || 0) - (b.answerTime || 0))
      .slice(0, 3) // Show top 3 fastest
  );
</script>

<div class="p-8 mb-8">
  {#if track}
    <SongInfo {track} />
  {/if}

  <h3 class="text-center mb-6">Round {roundNumber} Results</h3>

  <div class="space-y-4 max-h-96 overflow-y-auto">
    {#each roundResults as result (result.playerId)}
      <div
        class="flex flex-col md:flex-row justify-between items-center md:items-start p-4 border-l-4 {result.correct
          ? 'border-green-500'
          : 'border-red-500'} gap-2 md:gap-0"
      >
        <div class="flex flex-col text-center md:text-left flex-1">
          <span class="font-bold mb-1">
            {result.playerName}
            {#if result.playerId === playerId}
              <small class="font-normal ml-2">(You)</small>
            {/if}
          </span>
          <span class="text-sm">{result.answer}</span>
          {#if result.answerTime}
            <span class="text-xs mt-1">{formatAnswerTime(result.answerTime)}</span>
          {/if}
        </div>
        <div class="flex flex-col text-center md:text-right">
          {#if result.correct}
            <span class="font-bold text-green-600">+{result.pointsGained}</span>
            <span class="text-xs">{result.newScore} total</span>
          {:else}
            <span class="font-bold text-red-600">+0</span>
            <span class="text-xs">{result.newScore} total</span>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  {#if fastestCorrectAnswers.length > 0}
    <div class="border p-4 my-6">
      <h4 class="text-center mb-3 text-base">Fastest Correct Answers</h4>
      <div class="flex flex-col space-y-2">
        {#each fastestCorrectAnswers as result, index (result.playerId)}
          <div class="flex items-center justify-between p-2">
            <span class="text-lg min-w-8">
              {#if index === 0}🥇
              {:else if index === 1}🥈
              {:else if index === 2}🥉
              {:else}#{index + 1}
              {/if}
            </span>
            <span class="flex-1 ml-2 font-medium">{result.playerName}</span>
            <span class="font-bold">{formatAnswerTime(result.answerTime || 0)}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <div class="text-center italic mt-6">
    <p class="m-0">Next round starting soon...</p>
  </div>
</div>

<style>
</style>
