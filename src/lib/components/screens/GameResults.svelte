<script lang="ts">
	import type { GameState } from '$lib/game-client.js';

	interface Props {
		gameState: GameState;
		onplayagain: () => void;
	}

	let { gameState, onplayagain }: Props = $props();

	let podiumAnimation = $state(false);

	// Trigger podium animation on mount
	$effect(() => {
		if (gameState.gameFinished) {
			setTimeout(() => {
				podiumAnimation = true;
			}, 500);
		}
	});

	function getPlayerPosition(playerId: string): number {
		if (!gameState.scores) return -1;
		return gameState.scores.findIndex(score => score.id === playerId) + 1;
	}

	function getMedalEmoji(position: number): string {
		switch (position) {
			case 1: return '🥇';
			case 2: return '🥈';
			case 3: return '🥉';
			default: return '🏅';
		}
	}

	function getPositionClass(index: number): string {
		switch (index) {
			case 0: return 'first';
			case 1: return 'second';
			case 2: return 'third';
			default: return '';
		}
	}
</script>

<div class="card results-card">
	<div class="game-results">
		<div class="results-header">
			<h2>🎉 Game Complete! 🎉</h2>
			<p>Here are the final results:</p>
			{#if gameState.isHost}
				<div class="music-note">
					<small>🎵 Final song continues playing - use controls below to navigate</small>
				</div>
			{/if}
		</div>

		{#if gameState.currentTrack}
			<div class="correct-song">
				<h3>🎵 Final Song</h3>
				<div class="song-info">
					{#if gameState.currentTrack.imageUrl}
						<img src={gameState.currentTrack.imageUrl} alt="Album cover" class="album-cover" />
					{/if}
					<div class="song-details">
						<div class="song-name">{gameState.currentTrack.name}</div>
						<div class="artist-name">by {gameState.currentTrack.artist}</div>
					</div>
				</div>
			</div>
		{/if}

		<div class="podium {podiumAnimation ? 'animate' : ''}">
			{#if gameState.scores && gameState.scores.length > 0}
				<!-- Top 3 Podium -->
				<div class="podium-container">
					{#each gameState.scores.slice(0, 3) as player, index (player.id)}
						<div class="podium-place {getPositionClass(index)}">
							<div class="podium-player">
								<div class="medal">{getMedalEmoji(index + 1)}</div>
								<div class="player-name">
									{player.name}
									{#if player.id === gameState.playerId}
										<span class="you-label">(You)</span>
									{/if}
								</div>
								<div class="player-score">{player.score} pts</div>
							</div>
							<div class="podium-bar">
								<div class="position-label">#{index + 1}</div>
							</div>
						</div>
					{/each}
				</div>

				<!-- Full Results List -->
				<div class="full-results">
					<h3>Complete Results</h3>
					<div class="results-list">
						{#each gameState.scores as player, index (player.id)}
							<div class="result-item {player.id === gameState.playerId ? 'you' : ''}">
								<div class="position">
									<span class="medal">{getMedalEmoji(index + 1)}</span>
									<span class="rank">#{index + 1}</span>
								</div>
								<div class="player-info">
									<div class="name">
										{player.name}
										{#if player.id === gameState.playerId}
											<span class="you-label">(You)</span>
										{/if}
									</div>
									<div class="score">{player.score} points</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div class="no-results">
					No results available
				</div>
			{/if}
		</div>

		{#if gameState.scores && gameState.scores.length > 0}
			<div class="player-summary">
				<div class="summary-card">
					<h4>Your Performance</h4>
					<div class="stats">
						<div class="stat">
							<span class="stat-label">Final Position:</span>
							<span class="stat-value">#{getPlayerPosition(gameState.playerId)}</span>
						</div>
						<div class="stat">
							<span class="stat-label">Total Score:</span>
							<span class="stat-value">
								{gameState.scores.find(s => s.id === gameState.playerId)?.score || 0} pts
							</span>
						</div>
						<div class="stat">
							<span class="stat-label">Rounds Played:</span>
							<span class="stat-value">{gameState.totalRounds}</span>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<div class="actions">
			{#if gameState.isHost}
				<button class="btn btn-primary" onclick={onplayagain}>
					🔄 Play Again
				</button>
			{:else}
				<div class="waiting-host">
					<p>🕐 Waiting for host to start a new game...</p>
				</div>
			{/if}
			<button class="btn" onclick={() => window.location.reload()}>
				🏠 Home
			</button>
		</div>
	</div>
</div>

<style>
	.results-card {
		max-width: 700px;
		width: 100%;
	}

	.game-results {
		text-align: center;
	}

	.results-header h2 {
		margin: 0 0 1rem 0;
		font-size: 2rem;
		background: linear-gradient(45deg, #ffd700, #ffed4a);
		background-clip: text;
		-webkit-background-clip: text;
		color: transparent;
		-webkit-text-fill-color: transparent;
	}

	.results-header p {
		margin: 0 0 2rem 0;
		opacity: 0.8;
	}

	.podium {
		margin-bottom: 2rem;
	}

	.podium-container {
		display: flex;
		justify-content: center;
		align-items: end;
		gap: 1rem;
		margin-bottom: 2rem;
		height: 200px;
	}

	.podium-place {
		display: flex;
		flex-direction: column;
		align-items: center;
		opacity: 0;
		transform: translateY(50px);
		transition: all 0.6s ease;
	}

	.podium.animate .podium-place {
		opacity: 1;
		transform: translateY(0);
	}

	.podium.animate .podium-place.first {
		transition-delay: 0.2s;
	}

	.podium.animate .podium-place.second {
		transition-delay: 0.4s;
	}

	.podium.animate .podium-place.third {
		transition-delay: 0.6s;
	}

	.podium-player {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		min-width: 120px;
	}

	.medal {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	.player-name {
		font-weight: bold;
		margin-bottom: 0.25rem;
		font-size: 0.9rem;
	}

	.player-score {
		color: #4caf50;
		font-weight: bold;
	}

	.podium-bar {
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.25rem 0.25rem 0 0;
		color: white;
		font-weight: bold;
		position: relative;
	}

	.first .podium-bar {
		background: linear-gradient(45deg, #ffd700, #ffed4a);
		height: 80px;
		width: 120px;
	}

	.second .podium-bar {
		background: linear-gradient(45deg, #c0c0c0, #e8e8e8);
		height: 60px;
		width: 120px;
	}

	.third .podium-bar {
		background: linear-gradient(45deg, #cd7f32, #daa520);
		height: 40px;
		width: 120px;
	}

	.position-label {
		color: rgba(0, 0, 0, 0.8);
		font-size: 1.2rem;
		font-weight: bold;
	}

	.full-results {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.full-results h3 {
		margin: 0 0 1rem 0;
		font-size: 1.2rem;
	}

	.results-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.result-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 0.25rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.result-item.you {
		background: rgba(76, 175, 80, 0.2);
		border-color: rgba(76, 175, 80, 0.3);
	}

	.position {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 80px;
	}

	.rank {
		font-weight: bold;
		color: #ffd700;
	}

	.player-info {
		flex: 1;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.name {
		font-weight: 500;
	}

	.score {
		font-weight: bold;
		color: #4caf50;
	}

	.you-label {
		color: #4caf50;
		font-size: 0.8rem;
		margin-left: 0.5rem;
	}

	.player-summary {
		margin-bottom: 2rem;
	}

	.summary-card {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 0.5rem;
		padding: 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.summary-card h4 {
		margin: 0 0 1rem 0;
		font-size: 1.1rem;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.stat-label {
		font-size: 0.9rem;
		opacity: 0.8;
	}

	.stat-value {
		font-size: 1.1rem;
		font-weight: bold;
		color: #4caf50;
	}

	.actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.waiting-host {
		padding: 1rem;
		background: rgba(255, 193, 7, 0.1);
		border: 1px solid rgba(255, 193, 7, 0.3);
		border-radius: 8px;
		color: #ffd700;
		font-style: italic;
		text-align: center;
		min-width: 200px;
	}

	.waiting-host p {
		margin: 0;
	}

	.no-results {
		padding: 2rem;
		opacity: 0.6;
		font-style: italic;
	}

	.music-note {
		background: rgba(255, 215, 0, 0.1);
		border: 1px solid rgba(255, 215, 0, 0.3);
		border-radius: 8px;
		padding: 0.5rem 1rem;
		margin: 0.5rem 0 1rem 0;
		display: inline-block;
	}

	.music-note small {
		color: #ffd700;
		font-style: italic;
	}

	.correct-song {
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.correct-song h3 {
		margin: 0 0 1rem 0;
		text-align: center;
		color: #4caf50;
	}

	.song-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		justify-content: center;
	}

	.album-cover {
		width: 100px;
		height: 100px;
		border-radius: 0.5rem;
		object-fit: cover;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
	}

	.song-details {
		text-align: left;
	}

	.song-name {
		font-size: 1.3rem;
		font-weight: bold;
		margin-bottom: 0.25rem;
		color: #fff;
	}

	.artist-name {
		font-size: 1.1rem;
		color: var(--text-secondary);
	}

	@media (max-width: 600px) {
		.podium-container {
			flex-direction: column;
			height: auto;
			gap: 0.5rem;
		}
		
		.podium-place {
			width: 100%;
		}
		
		.podium-bar {
			width: 100% !important;
			height: 40px !important;
		}
		
		.actions {
			flex-direction: column;
		}
		
		.btn {
			width: 100%;
		}
		
		.waiting-host {
			width: 100%;
			min-width: auto;
		}
	}

	@media (max-width: 600px) {
		.song-info {
			flex-direction: column;
			text-align: center;
		}
		
		.song-details {
			text-align: center;
		}
		
		.album-cover {
			width: 80px;
			height: 80px;
		}
		
		.song-name {
			font-size: 1.1rem;
		}
		
		.artist-name {
			font-size: 1rem;
		}
	}
</style>
