<script lang="ts">
	interface Props {
		playerName: string;
		onPlayerNameChange: (name: string) => void;
		onSubmit: () => void;
		onBack: () => void;
	}

	let { playerName, onPlayerNameChange, onSubmit, onBack }: Props = $props();
</script>

<div class="form">
	<h3>Create a Game</h3>
	<div class="form-group">
		<label for="playerNameCreate">Your Name:</label>
		<input 
			id="playerNameCreate"
			class="input" 
			type="text" 
			bind:value={playerName}
			oninput={(e) => onPlayerNameChange((e.target as HTMLInputElement).value)}
			placeholder="Enter your name"
			maxlength="20"
		/>
	</div>
	<p class="description">
		Create a new music guessing game and become the host. You'll control the music playback and your friends can join using the game ID that will be generated.
	</p>
	<div class="buttons">
		<button 
			class="btn btn-primary" 
			onclick={onSubmit}
			disabled={!playerName.trim()}
		>
			Create Game
		</button>
		<button class="btn" onclick={onBack}>
			Back
		</button>
	</div>
</div>

<style>
	.form {
		margin-top: 1rem;
		text-align: left;
	}

	h3 {
		margin: 1.5rem 0 1rem 0;
		font-size: 1.3rem;
		text-align: center;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
	}

	.description {
		margin: 1rem 0;
		color: var(--text-secondary);
		font-size: 0.9rem;
		line-height: 1.4;
		text-align: center;
	}

	.buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-top: 1.5rem;
		flex-wrap: wrap;
	}

	@media (max-width: 600px) {
		.buttons {
			flex-direction: column;
		}
	}
</style>
