<script lang="ts">
	interface Props {
		question: any; // Type from GameState.currentQuestion
		isHost: boolean;
		selectedAnswer: string | null;
		hasAnswered: boolean;
		hostOnlyMode: boolean;
		onSelectAnswer: (answer: string) => void;
	}

	let { 
		question,
		isHost,
		selectedAnswer, 
		hasAnswered, 
		hostOnlyMode,
		onSelectAnswer, 
	}: Props = $props();
</script>

<div class="question-section">
	<div class="question-type">
		<h3>
			{#if question.type === 'artist'}
				Who is the artist?
			{:else}
				What is the song name?
			{/if}
		</h3>
	</div>

	<div class="audio-player">
		<div class="audio-controls">
			
		</div>
	</div>

	{#if hostOnlyMode && isHost}
		<!-- Host-only mode: Host cannot participate in answering -->
		<div class="host-only-mode">
			<div class="host-info">
				<div class="answer-preview">
					{#each question.options as option, index (option)}
						<div class="option-preview">
							<span class="option-letter">{String.fromCharCode(65 + index)}</span>
							<span class="option-text">{option}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{:else}
		<div class="answers">
			<h4>Choose your answer:</h4>
			<div class="answer-grid">
				{#each question.options as option, index (option)}
					<button 
						class="answer-btn {selectedAnswer === option ? 'selected' : ''}"
						onclick={() => onSelectAnswer(option)}
						disabled={hasAnswered}
					>
						<span class="option-letter">{String.fromCharCode(65 + index)}</span>
						<span class="option-text">{option}</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}

	{#if hasAnswered}
		<div class="answer-submitted">
			Answer submitted! Waiting for round to end...
		</div>
	{/if}
</div>

<style>
	.question-section {
		min-height: 400px;
	}

	.question-type h3 {
		margin: 0 0 1.5rem 0;
		font-size: 1.3rem;
		text-align: center;
	}

	.answers h4 {
		margin: 0 0 1rem 0;
		text-align: center;
		font-size: 1.1rem;
	}

	.answer-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.answer-btn {
		background: var(--secondary-color);
		border: 2px solid var(--border-color);
		color: var(--text-primary);
		padding: 1rem;
		border-radius: var(--border-radius);
		cursor: pointer;
		transition: var(--transition);
		display: flex;
		align-items: center;
		gap: 0.75rem;
		text-align: left;
		min-height: 60px;
	}

	.answer-btn:hover:not(:disabled) {
		background: var(--secondary-hover);
		border-color: rgba(255, 255, 255, 0.4);
		transform: translateY(-2px);
	}

	.answer-btn.selected {
		background: rgba(var(--primary-color-rgb), 0.3);
		border-color: rgba(var(--primary-color-rgb), 0.8);
	}

	.answer-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.option-letter {
		background: rgba(255, 255, 255, 0.2);
		width: 30px;
		height: 30px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		flex-shrink: 0;
	}

	.option-text {
		flex: 1;
		font-size: 0.95rem;
	}

	.answer-submitted {
		text-align: center;
		margin-top: 1.5rem;
		padding: 1rem;
		background: rgba(var(--primary-color-rgb), 0.2);
		border-radius: var(--border-radius);
		border: 1px solid rgba(var(--primary-color-rgb), 0.5);
		color: var(--success-color);
		font-weight: 500;
	}

	@media (max-width: 768px) {
		.answer-grid {
			grid-template-columns: 1fr;
		}
	}

	/* Host-only mode styles */
	.host-only-mode {
		padding: 2rem;
		text-align: center;
	}

	.host-info {
		background: rgba(30, 215, 96, 0.1);
		border: 2px solid rgba(30, 215, 96, 0.3);
		border-radius: 12px;
		padding: 2rem;
		max-width: 600px;
		margin: 0 auto;
	}

	.answer-preview {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.option-preview {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		color: var(--text-primary);
	}

	.option-preview .option-letter {
		background: var(--secondary-color);
		color: var(--text-primary);
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		font-size: 0.9rem;
		flex-shrink: 0;
	}

	.option-preview .option-text {
		font-size: 0.9rem;
		text-align: left;
	}
</style>
