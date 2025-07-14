<script lang="ts">
	interface Props {
		playerName: string;
		gameId: string;
		onPlayerNameChange: (name: string) => void;
		onGameIdChange: (id: string) => void;
		onSubmit: () => void;
		onBack: () => void;
		isValidGameId: (id: string) => boolean;
	}

	let { 
		playerName, 
		gameId, 
		onPlayerNameChange, 
		onGameIdChange,
		onSubmit, 
		onBack, 
		isValidGameId 
	}: Props = $props();

	// Auto-uppercase game ID as user types and validate format
	function handleGameIdInput(event: Event) {
		const target = event.target as HTMLInputElement;
		let value = target.value.toUpperCase();
		
		// Remove any non-alphanumeric characters
		value = value.replace(/[^A-Z0-9]/g, '');
		
		// Limit to 6 characters
		if (value.length > 6) {
			value = value.substring(0, 6);
		}
		
		onGameIdChange(value);
	}
</script>

<div class="form">
	<h3>Join a Game</h3>
	<div class="form-group">
		<label for="gameIdInput">Game ID:</label>
		<input 
			id="gameIdInput"
			class="input {gameId && !isValidGameId(gameId) ? 'invalid' : ''}" 
			type="text" 
			bind:value={gameId}
			oninput={handleGameIdInput}
			placeholder="e.g. ABC123"
			maxlength="6"
			style="text-transform: uppercase;"
		/>
		{#if gameId && !isValidGameId(gameId)}
			<small class="error-text">Format: 3 letters + 3 numbers (e.g., ABC123)</small>
		{/if}
	</div>
	<div class="form-group">
		<label for="playerNameJoin">Your Name:</label>
		<input 
			id="playerNameJoin"
			class="input" 
			type="text" 
			bind:value={playerName}
			oninput={(e) => onPlayerNameChange((e.target as HTMLInputElement).value)}
			placeholder="Enter your name"
			maxlength="20"
		/>
	</div>
	<div class="buttons">
		<button 
			class="btn btn-primary" 
			onclick={onSubmit}
			disabled={!playerName.trim() || !gameId.trim() || !isValidGameId(gameId.trim())}
		>
			Join Game
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

	.input.invalid {
		border-color: #f44336;
	}

	.error-text {
		color: #f44336;
		font-size: 0.8rem;
		margin-top: 0.25rem;
		display: block;
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
