<script lang="ts">
  import type { GameState } from "$lib/game-client.js";
  import { spotifyWebPlayback } from "$lib/spotify-playback.js";
  import { untrack } from "svelte";
  import RoundResults from "./RoundResults.svelte";
  import GameQuestion from "./GameQuestion.svelte";
  import ScoresSidebar from "./ScoresSidebar.svelte";
  import GameTimer from "../common/GameTimer.svelte";
  import { formatTime } from "$lib/utils.js";
  import { Loading } from "../common/index.js";

  interface Props {
    gameState: GameState;
    onsubmitanswer: (answer: string) => void;
    onmusicready?: () => void;
  }

  let { gameState, onsubmitanswer, onmusicready }: Props = $props();

  let selectedAnswer = $state<string | null>(null);
  let hasAnswered = $state(false);
  let spotifyPlaying = $state(false);
  let lastPlayedQuestionId = $state<string | null>(null);
  let playbackError = $state<string | null>(null);

  // Create a derived sorted players array to avoid mutating the original
  let sortedPlayers = $derived([...gameState.players].sort((a, b) => b.score - a.score));

  // Track question changes manually to avoid timer-related reactivity
  let previousQuestionData = $state<{ question: any; round: number; host: boolean } | null>(null);

  // Reset state when round changes and handle Spotify playback
  $effect(() => {
    const currentQuestion = gameState.currentQuestion;
    const currentRound = gameState.currentRound;
    const isHost = gameState.isHost;

    if (currentQuestion) {
      // Check if this is actually a new question by comparing all relevant data
      const currentQuestionData = {
        question: currentQuestion,
        round: currentRound,
        host: isHost,
      };

      // Only proceed if this is genuinely a new question
      if (
        previousQuestionData &&
        previousQuestionData.question?.spotifyUri === currentQuestion.spotifyUri &&
        previousQuestionData.round === currentRound &&
        previousQuestionData.host === isHost
      ) {
        // Same question, skip processing
        return;
      }

      // Update tracking data
      previousQuestionData = currentQuestionData;

      // Create a unique ID for the current question to prevent duplicate plays
      const questionId = `${currentRound}-${currentQuestion.spotifyUri}`;

      // Only proceed if this is a new question
      if (questionId === lastPlayedQuestionId) {
        console.log("Skipping duplicate question play");
        return;
      }

      lastPlayedQuestionId = questionId;
      selectedAnswer = null;
      hasAnswered = false;
      spotifyPlaying = false;
      playbackError = null;

      // Only hosts can play music using Spotify Web Playback SDK
      if (isHost && currentQuestion.spotifyUri && spotifyWebPlayback.isPlayerReady()) {
        playSpotifyTrack();
      } else if (isHost && currentQuestion.spotifyUri) {
        // Host but Spotify not ready
        playbackError = "Spotify Web Playback not ready. Please check your connection.";
      } else if (!isHost) {
        // Non-host - no audio controls needed
        console.log("Non-host: Waiting for host to play music");
      } else {
        // No Spotify URI available
        playbackError = "No Spotify track available for this round.";
      }
    }
  });

  async function playSpotifyTrack() {
    if (!gameState.currentQuestion?.spotifyUri || !gameState.isHost) return;

    try {
      let startPosition = 0;

      // Use random start position only if configured
      if (gameState.config?.randomStartTime !== false) {
        // Calculate random start position (avoid first/last 30 seconds)
        startPosition = Math.floor(Math.random() * (180000 - 60000)) + 30000; // 30s to 3min mark
      }

      // Check if this is the final round
      const isFinalRound = gameState.currentRound >= gameState.totalRounds;

      if (isFinalRound) {
        // For final round, play continuously without auto-stop
        await spotifyWebPlayback.playTrackContinuous(gameState.currentQuestion.spotifyUri, startPosition);
        console.log(`Playing final round track continuously from ${startPosition}ms`);
      } else {
        // For regular rounds, use the 30-second segment
        await spotifyWebPlayback.playTrackSegment(
          gameState.currentQuestion.spotifyUri,
          startPosition,
          30000 // 30 seconds
        );
        console.log(`Playing 30-second Spotify segment from ${startPosition}ms`);
      }

      spotifyPlaying = true;

      // Notify server that music is ready and timer can start
      if (onmusicready) {
        console.log("Music ready, notifying server to start timer");
        onmusicready();
      }
    } catch (error) {
      console.error("Failed to play Spotify track:", error);
      playbackError = `Failed to play track: ${error instanceof Error ? error.message : "Unknown error"}`;
      spotifyPlaying = false;
    }
  }

  function selectAnswer(answer: string) {
    if (hasAnswered) return;

    selectedAnswer = answer;
    hasAnswered = true;
    onsubmitanswer(answer);
  }
</script>

<div class="card w-full max-w-md preset-filled-surface-100-900 p-4 text-center space-y-4">
  <div class="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8">
    <div class="lg:col-span-2 text-center mb-4">
      <div class="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h2 class="text-2xl font-semibold m-0">
          {#if gameState.currentRound >= gameState.totalRounds}
            Final Round {gameState.currentRound} / {gameState.totalRounds}
          {:else}
            Round {gameState.currentRound} / {gameState.totalRounds}
          {/if}
        </h2>
        <GameTimer
          timeLeft={gameState.roundTimeLeft}
          isActive={!!gameState.currentQuestion}
          warning={gameState.roundTimeLeft !== undefined && gameState.roundTimeLeft <= 10}
        />
      </div>

      <div class="w-full h-2 bg-opacity-20 bg-white overflow-hidden">
        <div
          class="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300 ease-out"
          style="width: {((gameState.currentRound - 1) / gameState.totalRounds) * 100}%"
        ></div>
      </div>
    </div>

    {#if gameState.showingRoundResults && gameState.lastRoundResults && gameState.currentRound < gameState.totalRounds}
      <RoundResults
        roundResults={gameState.lastRoundResults}
        roundNumber={gameState.currentRound - 1}
        playerId={gameState.playerId}
        track={gameState.currentTrack}
      />
    {:else if gameState.currentQuestion}
      <GameQuestion
        question={gameState.currentQuestion}
        isHost={gameState.isHost}
        {selectedAnswer}
        {hasAnswered}
        hostOnlyMode={gameState.config?.hostOnlyMode ?? false}
        onSelectAnswer={selectAnswer}
      />
    {:else}
      <Loading text="Preparing next round..." />
    {/if}

    <ScoresSidebar players={sortedPlayers} currentPlayerId={gameState.playerId} />
  </div>
</div>

<style></style>
