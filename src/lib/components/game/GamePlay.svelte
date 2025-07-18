<script lang="ts">
	import type { GameState } from '$lib/game-client.js';
	import { spotifyWebPlayback } from '$lib/spotify-playback.js';
	import RoundResults from './RoundResults.svelte';
	import GameQuestion from './GameQuestion.svelte';
	import ScoresSidebar from './ScoresSidebar.svelte';
	import GameTimer from '../common/GameTimer.svelte';

	interface Props {
		gameState: GameState;
		onsubmitanswer: (answer: string) => void;
	}

	let { gameState, onsubmitanswer }: Props = $props();

	let selectedAnswer = $state<string | null>(null);
	let hasAnswered = $state(false);
	let spotifyPlaying = $state(false);
	let lastPlayedQuestionId = $state<string | null>(null);
	let playbackError = $state<string | null>(null);

	// Create a derived sorted players array to avoid mutating the original
	let sortedPlayers = $derived([...gameState.players].sort((a, b) => b.score - a.score));

	// Reset state when round changes and handle Spotify playback
	$effect(() => {
		if (gameState.currentQuestion) {
			// Create a unique ID for the current question to prevent duplicate plays
			const questionId = `${gameState.currentRound}-${gameState.currentQuestion.spotifyUri}`;
			
			// Only proceed if this is a new question
			if (questionId === lastPlayedQuestionId) {
				console.log('Skipping duplicate question play');
				return;
			}
			
			lastPlayedQuestionId = questionId;
			selectedAnswer = null;
			hasAnswered = false;
			spotifyPlaying = false;
			playbackError = null;
			
			// Only hosts can play music using Spotify Web Playback SDK
			if (gameState.isHost && gameState.currentQuestion.spotifyUri && spotifyWebPlayback.isPlayerReady()) {
				playSpotifyTrack();
			} else if (gameState.isHost && gameState.currentQuestion.spotifyUri) {
				// Host but Spotify not ready
				playbackError = "Spotify Web Playback not ready. Please check your connection.";
			} else if (!gameState.isHost) {
				// Non-host - no audio controls needed
				console.log('Non-host: Waiting for host to play music');
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
				await spotifyWebPlayback.playTrackContinuous(
					gameState.currentQuestion.spotifyUri,
					startPosition
				);
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
		} catch (error) {
			console.error('Failed to play Spotify track:', error);
			playbackError = `Failed to play track: ${error instanceof Error ? error.message : 'Unknown error'}`;
			spotifyPlaying = false;
		}
	}

	function selectAnswer(answer: string) {
		if (hasAnswered) return;
		
		selectedAnswer = answer;
		hasAnswered = true;
		onsubmitanswer(answer);
	}

	function formatTime(seconds: number | undefined): string {
		if (seconds === undefined) return '--';
		return seconds.toString().padStart(2, '0');
	}

	function toggleSpotifyPlayback() {
		if (!gameState.isHost || !spotifyWebPlayback.isPlayerReady()) return;
		
		if (spotifyPlaying) {
			spotifyWebPlayback.pause();
			spotifyPlaying = false;
		} else {
			playSpotifyTrack();
		}
	}

	async function manualPlaySpotify() {
		if (!gameState.isHost || !gameState.currentQuestion?.spotifyUri) return;
		
		try {
			await playSpotifyTrack();
			playbackError = null;
		} catch (error) {
			console.error('Manual Spotify play failed:', error);
			playbackError = `Failed to play: ${error instanceof Error ? error.message : 'Unknown error'}`;
		}
	}
</script>

<div class="card game-card">
	<div class="game-play">
		<div class="game-header">
			<div class="round-info">
				<h2>
					{#if gameState.currentRound >= gameState.totalRounds}
						🏁 Final Round {gameState.currentRound} / {gameState.totalRounds}
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
			
			<div class="progress-bar">
				<div 
					class="progress-fill" 
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
				currentRound={gameState.currentRound}
				totalRounds={gameState.totalRounds}
				selectedAnswer={selectedAnswer}
				hasAnswered={hasAnswered}
				spotifyPlaying={spotifyPlaying}
				playbackError={playbackError}
				onSelectAnswer={selectAnswer}
				onManualPlaySpotify={manualPlaySpotify}
				onToggleSpotifyPlayback={toggleSpotifyPlayback}
				{spotifyWebPlayback}
			/>
		{:else}
			<div class="waiting-round">
				<div class="loading-spinner"></div>
				<p>Preparing next round...</p>
			</div>
		{/if}

		<ScoresSidebar 
			players={sortedPlayers}
			currentPlayerId={gameState.playerId}
		/>
	</div>
</div>

<style>
	.game-card {
		max-width: 800px;
		width: 100%;
	}

	.game-play {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 2rem;
	}

	.game-header {
		grid-column: 1 / -1;
		text-align: center;
		margin-bottom: 1rem;
	}

	.round-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.round-info h2 {
		margin: 0;
		font-size: 1.5rem;
	}

	.progress-bar {
		width: 100%;
		height: 8px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #4caf50, #8bc34a);
		transition: width 0.3s ease;
	}

	.waiting-round {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 200px;
		gap: 1rem;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid rgba(255, 255, 255, 0.2);
		border-top: 4px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	@media (max-width: 768px) {
		.game-play {
			grid-template-columns: 1fr;
		}
		
		.round-info {
			flex-direction: column;
			gap: 1rem;
		}
	}
</style>
