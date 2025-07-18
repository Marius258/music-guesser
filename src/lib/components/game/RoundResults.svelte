<script lang="ts">
	import type { RoundResult } from '$lib/game-client.js';
	import SongInfo from './SongInfo.svelte';
	import type { TrackInfo } from '$lib/game-client.js';

	interface Props {
		roundResults: RoundResult[];
		roundNumber: number;
		playerId: string;
		track?: TrackInfo;
	}

	let { roundResults, roundNumber, playerId, track }: Props = $props();

	// Function to format answer time
	function formatAnswerTime(time: number): string {
		if (time < 1) {
			return `${Math.round(time * 10) / 10}s`;
		}
		return `${Math.round(time * 10) / 10}s`;
	}

	// Get fastest correct answers for leaderboard
	let fastestCorrectAnswers = $derived(() => {
		return roundResults
			.filter(result => result.correct && result.answerTime)
			.sort((a, b) => (a.answerTime || 0) - (b.answerTime || 0))
			.slice(0, 3); // Show top 3 fastest
	});
</script>

<div class="round-results">
	{#if track}
		<SongInfo {track} />
	{/if}
	
	<h3>🏆 Round {roundNumber} Results</h3>
	
	<div class="results-grid">
		{#each roundResults as result (result.playerId)}
			<div class="result-card {result.correct ? 'correct' : 'incorrect'}">
				<div class="player-info">
					<span class="player-name">
						{result.playerName}
						{#if result.playerId === playerId}
							<small>(You)</small>
						{/if}
					</span>
					<span class="player-answer">{result.answer}</span>
					{#if result.answerTime}
						<span class="answer-time">⏱️ {formatAnswerTime(result.answerTime)}</span>
					{/if}
				</div>
				<div class="points-info">
					{#if result.correct}
						<span class="points-gained">+{result.pointsGained}</span>
						<span class="total-score">{result.newScore} total</span>
					{:else}
						<span class="points-gained">+0</span>
						<span class="total-score">{result.newScore} total</span>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	{#if fastestCorrectAnswers.length > 0}
		<div class="fastest-answers">
			<h4>⚡ Fastest Correct Answers</h4>
			<div class="speed-leaderboard">
				{#each fastestCorrectAnswers as result, index (result.playerId)}
					<div class="speed-rank">
						<span class="rank-position">
							{#if index === 0}🥇
							{:else if index === 1}🥈
							{:else if index === 2}🥉
							{:else}#{index + 1}
							{/if}
						</span>
						<span class="speed-name">{result.playerName}</span>
						<span class="speed-time">{formatAnswerTime(result.answerTime || 0)}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
	
	<div class="next-round-info">
		<p>🎵 Next round starting soon...</p>
	</div>
</div>

<style>
	.round-results {
		padding: 2rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		margin-bottom: 2rem;
	}

	.round-results h3 {
		text-align: center;
		margin-bottom: 1.5rem;
		color: #ffd700;
	}

	.results-grid {
		display: grid;
		gap: 1rem;
		max-height: 400px;
		overflow-y: auto;
	}

	.result-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 0.5rem;
		border-left: 4px solid transparent;
	}

	.result-card.correct {
		border-left-color: #4caf50;
	}

	.result-card.incorrect {
		border-left-color: #f44336;
	}

	.player-info {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		flex: 1;
	}

	.player-name {
		font-weight: bold;
		margin-bottom: 0.25rem;
	}

	.player-name small {
		font-weight: normal;
		color: var(--text-secondary, #bbb);
		margin-left: 0.5rem;
	}

	.player-answer {
		font-size: 0.9rem;
		color: var(--text-secondary, #bbb);
	}

	.answer-time {
		font-size: 0.8rem;
		color: var(--text-accent, #ffd700);
		margin-top: 0.25rem;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.points-info {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		text-align: right;
	}

	.points-gained {
		font-weight: bold;
		font-size: 1rem;
	}

	.result-card.correct .points-gained {
		color: #4caf50;
	}

	.result-card.incorrect .points-gained {
		color: #f44336;
	}

	.total-score {
		color: var(--text-secondary, #bbb);
		font-size: 0.8rem;
	}

	.fastest-answers {
		background: rgba(255, 215, 0, 0.1);
		border: 1px solid rgba(255, 215, 0, 0.3);
		border-radius: 0.5rem;
		padding: 1rem;
		margin: 1.5rem 0;
	}

	.fastest-answers h4 {
		margin: 0 0 0.75rem 0;
		color: #ffd700;
		font-size: 1rem;
		text-align: center;
	}

	.speed-leaderboard {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.speed-rank {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 0.25rem;
	}

	.rank-position {
		font-size: 1.2rem;
		min-width: 2rem;
	}

	.speed-name {
		flex: 1;
		margin-left: 0.5rem;
		font-weight: 500;
	}

	.speed-time {
		font-weight: bold;
		color: #ffd700;
	}

	.next-round-info {
		color: var(--text-secondary, #bbb);
		font-style: italic;
		margin: 1.5rem 0 0 0;
		text-align: center;
	}

	.next-round-info p {
		margin: 0;
	}

	@media (max-width: 768px) {
		.results-grid {
			max-height: 300px;
		}
		
		.result-card {
			flex-direction: column;
			text-align: center;
			gap: 0.5rem;
		}
		
		.player-info,
		.points-info {
			align-items: center;
		}
	}
</style>
