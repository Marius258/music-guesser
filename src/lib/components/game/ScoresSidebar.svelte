<script lang="ts">
	import type { Player } from '$lib/game-client.js';

	interface Props {
		players: Player[];
		currentPlayerId: string;
		title?: string;
	}

	let { players, currentPlayerId, title = "🏆 Scores" }: Props = $props();

	// Sort players by score in descending order
	let sortedPlayers = $derived([...players].sort((a, b) => b.score - a.score));
</script>

<div class="scores-sidebar">
	<h3>{title}</h3>
	<div class="scores-list">
		{#each sortedPlayers as player, index (player.id)}
			<div class="score-item" class:current={player.id === currentPlayerId}>
				<div class="rank">
					{#if index === 0}
						🥇
					{:else if index === 1}
						🥈
					{:else if index === 2}
						🥉
					{:else}
						#{index + 1}
					{/if}
				</div>
				<div class="player-info">
					<span class="player-name">
						{player.name}
						{#if player.id === currentPlayerId}
							<small>(You)</small>
						{/if}
					</span>
					<span class="player-score">{player.score} pts</span>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.scores-sidebar {
		background: rgba(255, 255, 255, 0.05);
		border-radius: var(--border-radius);
		border: 1px solid rgba(255, 255, 255, 0.1);
		padding: 1.5rem;
		height: fit-content;
		max-height: 500px;
		overflow-y: auto;
	}

	.scores-sidebar h3 {
		margin: 0 0 1rem 0;
		text-align: center;
		color: var(--accent-color);
	}

	.scores-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.score-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: rgba(255, 255, 255, 0.03);
		border-radius: var(--border-radius);
		border: 1px solid transparent;
		transition: var(--transition);
	}

	.score-item.current {
		background: rgba(255, 193, 7, 0.15);
		border-color: rgba(255, 193, 7, 0.3);
	}

	.rank {
		font-size: 1.2rem;
		font-weight: bold;
		min-width: 30px;
		text-align: center;
	}

	.player-info {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}

	.player-name {
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.player-name small {
		font-weight: normal;
		color: var(--text-secondary);
		margin-left: 0.25rem;
	}

	.player-score {
		font-size: 0.9rem;
		color: var(--text-secondary);
		font-weight: bold;
	}

	@media (max-width: 768px) {
		.scores-sidebar {
			max-height: 200px;
		}
		
		.score-item {
			padding: 0.5rem;
		}
		
		.rank {
			font-size: 1rem;
			min-width: 25px;
		}
		
		.player-name {
			font-size: 0.9rem;
		}
		
		.player-score {
			font-size: 0.8rem;
		}
	}
</style>
