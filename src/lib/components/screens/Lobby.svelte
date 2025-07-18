<script lang="ts">
	import type { GameState, GameConfig } from '$lib/game-client.js';
	import GameConfigForm from '../forms/GameConfigForm.svelte';
	import { onMount } from 'svelte';

	interface SpotifyGenre {
		id: string;
		name: string;
		description: string;
		icons?: { url: string; height: number; width: number }[];
	}

	interface Props {
		gameState: GameState;
		onstartgame: () => void;
		onupdateconfig?: (config: GameConfig) => void;
	}

	let { gameState, onstartgame, onupdateconfig }: Props = $props();
	let availableGenres = $state<SpotifyGenre[]>([]);

	onMount(async () => {
		try {
			const response = await fetch('/api/spotify/categories');
			const data = await response.json();
			
			if (data.success) {
				availableGenres = data.categories;
			}
		} catch (error) {
			console.error('Error fetching genres:', error);
		}
	});

	function copyGameId() {
		navigator.clipboard.writeText(gameState.id).then(() => {
			// You could add a toast notification here
		});
	}

	function getGenreDisplayName(genreId: string): string {
		// Only try to find the genre from Spotify API data
		const spotifyGenre = availableGenres.find(genre => genre.id === genreId);
		if (spotifyGenre) {
			return spotifyGenre.name;
		}

		// If not found, just return the ID (no fallback mappings)
		return genreId;
	}
</script>

<div class="card">
	<div class="lobby">
		<h2>Game Lobby</h2>
		
		<div class="game-info">
			<div class="game-id">
				<h3>Game ID:</h3>
				<div class="id-container">
					<code class="game-id-code">{gameState.id}</code>
					<button class="btn copy-btn" onclick={copyGameId} title="Copy to clipboard">
						📋
					</button>
				</div>
				<p class="share-text">Share this ID with other players so they can join!</p>
			</div>
		</div>

		<div class="players-section">
			<h3>Players ({gameState.players.length})</h3>
			<div class="players-list">
				{#each gameState.players as player (player.id)}
					<div class="player">
						<span class="player-name">
							{player.name}
							{#if player.id === gameState.playerId}
								<span class="you-label">(You)</span>
							{/if}
							{#if gameState.isHost && player.id === gameState.playerId}
								<span class="host-label">👑 Host</span>
							{/if}
						</span>
					</div>
				{/each}
				
				{#if gameState.players.length === 0}
					<div class="no-players">
						Waiting for players to join...
					</div>
				{/if}
			</div>
		</div>

		{#if gameState.isHost}
			<div class="host-controls">
				{#if gameState.config && onupdateconfig}
					<GameConfigForm 
						config={gameState.config}
						onupdateconfig={onupdateconfig}
					/>
				{/if}

				{#if gameState.config}
					<div class="current-settings">
						<h3>🎛️ Current Game Settings</h3>
						<div class="config-items">
							<div class="config-item">
								<span class="config-label">Rounds:</span>
								<span class="config-value">{gameState.config.totalRounds}</span>
							</div>
							<div class="config-item">
								<span class="config-label">Round Duration:</span>
								<span class="config-value">{gameState.config.roundDurationSeconds}s</span>
							</div>						<div class="config-item">
							<span class="config-label">Random Start:</span>
							<span class="config-value">{gameState.config.randomStartTime ? '✅ Yes' : '❌ No'}</span>
						</div>
						<div class="config-item">
							<span class="config-label">Music Genre:</span>
							<span class="config-value">{getGenreDisplayName(gameState.config.musicCategory)}</span>
						</div>
						</div>
					</div>
				{/if}

				<button 
					class="btn btn-primary start-btn"
					onclick={onstartgame}
					disabled={gameState.players.length < 1}
				>
					{gameState.players.length < 1 ? 'Waiting for players...' : 'Start Game!'}
				</button>
				<p class="min-players">Minimum 1 player required to start</p>
			</div>
		{:else}
			<div class="waiting">
				<p>Waiting for host to start the game...</p>
				<div class="loading-dots">
					<span></span>
					<span></span>
					<span></span>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.lobby {
		text-align: center;
		max-width: 600px;
	}

	h2 {
		margin-bottom: 2rem;
		font-size: 1.8rem;
	}

	h3 {
		margin: 1.5rem 0 1rem 0;
		font-size: 1.2rem;
		color: rgba(255, 255, 255, 0.9);
	}

	.game-info {
		margin-bottom: 2rem;
	}

	.game-id {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.id-container {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		justify-content: center;
		margin: 0.5rem 0;
	}

	.game-id-code {
		background: rgba(0, 0, 0, 0.3);
		padding: 0.5rem 1rem;
		border-radius: 0.25rem;
		font-family: monospace;
		font-size: 1.1rem;
		letter-spacing: 1px;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.copy-btn {
		padding: 0.25rem 0.5rem;
		font-size: 0.8rem;
		min-width: auto;
	}

	.share-text {
		font-size: 0.9rem;
		opacity: 0.7;
		margin: 0.5rem 0 0 0;
	}

	.players-section {
		margin-bottom: 2rem;
	}

	.players-list {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 0.5rem;
		padding: 1rem;
		min-height: 100px;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.player {
		background: rgba(255, 255, 255, 0.1);
		padding: 0.75rem;
		border-radius: 0.25rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.player-name {
		font-weight: 500;
	}

	.you-label {
		color: #4caf50;
		font-size: 0.8rem;
		margin-left: 0.5rem;
	}

	.host-label {
		color: #ffd700;
		font-size: 0.8rem;
		margin-left: 0.5rem;
	}

	.no-players {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(255, 255, 255, 0.6);
		font-style: italic;
	}

	.host-controls {
		margin-top: 2rem;
	}

	.current-settings {
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.current-settings h3 {
		margin: 0 0 0.75rem 0;
		font-size: 1rem;
		color: var(--text-primary);
	}

	.config-items {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.config-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.9rem;
	}

	.config-label {
		color: var(--text-secondary);
		font-weight: 500;
	}

	.config-value {
		color: var(--text-primary);
		font-weight: 600;
	}

	.start-btn {
		font-size: 1.1rem;
		padding: 1rem 2rem;
		margin-bottom: 0.5rem;
		width: 100%;
		max-width: 300px;
	}

	.min-players {
		font-size: 0.8rem;
		opacity: 0.7;
		margin: 0;
	}

	.waiting {
		margin-top: 2rem;
		color: rgba(255, 255, 255, 0.8);
	}

	.loading-dots {
		display: flex;
		justify-content: center;
		gap: 0.25rem;
		margin-top: 1rem;
	}

	.loading-dots span {
		width: 8px;
		height: 8px;
		background: rgba(255, 255, 255, 0.6);
		border-radius: 50%;
		animation: loading 1.4s infinite ease-in-out;
	}

	.loading-dots span:nth-child(1) { animation-delay: -0.32s; }
	.loading-dots span:nth-child(2) { animation-delay: -0.16s; }

	@keyframes loading {
		0%, 80%, 100% {
			transform: scale(0);
			opacity: 0.5;
		}
		40% {
			transform: scale(1);
			opacity: 1;
		}
	}
</style>
