<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { page } from '$app/stores';
	
	function handleJoinSubmit() {
		if (!playerName.trim() || !gameId.trim()) return;
		
		// Validate game ID format
		if (!isValidGameId(gameId.trim())) {
			alert('Please enter a valid Game ID (3 letters + 3 numbers, e.g., ABC123)');
			return;
		}
		
		onjoingame(gameId.trim(), playerName.trim());
	}

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
		
		gameId = value;
	}

	// Validate game ID format (3 letters + 3 numbers)
	function isValidGameId(id: string): boolean {
		return /^[A-Z]{3}[0-9]{3}$/.test(id);
	}

	interface Props {
		connected: boolean;
		connecting: boolean;
		error: string | null;
		onconnect: () => void;
		oncreategame: (playerName: string) => void;
		onjoingame: (gameId: string, playerName: string) => void;
		onauthenticatespotify?: () => void;
		spotifyConnected?: boolean;
	}

	let { connected, connecting, error, onconnect, oncreategame, onjoingame, onauthenticatespotify, spotifyConnected = false }: Props = $props();

	let playerName = $state('');
	let gameId = $state('');
	let mode = $state<'menu' | 'create' | 'join'>('menu');

	// Check if user came back from Spotify auth
	let spotifyAuthSuccess = $state(false);
	$effect(() => {
		// Only run in browser environment and wait for page store to be ready
		if (typeof window === 'undefined' || !$page.url) return;
		
		const urlParams = $page.url.searchParams;
		if (urlParams.get('spotify_auth') === 'success') {
			spotifyAuthSuccess = true;
			// Clean up URL using SvelteKit's navigation after a short delay to ensure router is ready
			setTimeout(() => {
				try {
					replaceState('', {});
				} catch (error) {
					console.warn('Could not clean up URL:', error);
					// Fallback to manual URL cleanup if SvelteKit navigation fails
					if (typeof window !== 'undefined') {
						const url = new URL(window.location.href);
						url.searchParams.delete('spotify_auth');
						window.history.replaceState({}, '', url.toString());
					}
				}
			}, 100);
		}
	});

	function handleCreateGame() {
		if (!playerName.trim()) return;
		oncreategame(playerName.trim());
	}

	function handleJoinGame() {
		if (!playerName.trim() || !gameId.trim()) return;
		onjoingame(gameId.trim(), playerName.trim());
	}

	function resetForm() {
		playerName = '';
		gameId = '';
		mode = 'menu';
	}
</script>

<div class="card">
	<div class="welcome">
		<h2>Welcome to Music Guesser! 🎵</h2>
		<p>Test your music knowledge in this fun multiplayer game. Guess the artist or song name from audio clips!</p>

		{#if !connected && !connecting}
			<div class="connect-section">
				<p>Connect to start playing:</p>
				<button class="btn btn-primary" onclick={onconnect}>
					Connect to Server
				</button>
				{#if error}
					<p class="error">{error}</p>
				{/if}
			</div>
		{:else if mode === 'menu'}
			<div class="menu">
				{#if spotifyAuthSuccess}
					<div class="spotify-success">
						✅ Spotify connected! You can now host games with full music playback.
					</div>
				{/if}
				
				<h3>Choose your game mode:</h3>
				<div class="buttons">
					<button class="btn btn-primary" onclick={() => mode = 'create'}>
						🎮 Create Game (Host)
					</button>
					<button class="btn" onclick={() => mode = 'join'}>
						🔗 Join Game
					</button>
				</div>
				
				{#if onauthenticatespotify}
					<div class="spotify-section">
						<h4>🎵 Enhanced Experience</h4>
						<p>Hosts can connect Spotify for full track playback!</p>
						<button class="btn spotify-btn" onclick={onauthenticatespotify}>
							🎧 Connect Spotify (Optional)
						</button>
						<small>Note: Only hosts with Spotify Premium can hear full tracks</small>
					</div>
				{/if}
			</div>
		{:else if mode === 'create'}
			<div class="form">
				<h3>Create a New Game</h3>
				<div class="form-group">
					<label for="playerName">Your Name:</label>
					<input 
						id="playerName"
						class="input" 
						type="text" 
						bind:value={playerName}
						placeholder="Enter your name"
						maxlength="20"
					/>
				</div>
				<div class="buttons">
					<button 
						class="btn btn-primary" 
						onclick={handleCreateGame}
						disabled={!playerName.trim()}
					>
						Create Game
					</button>
					<button class="btn" onclick={resetForm}>
						Back
					</button>
				</div>
			</div>
		{:else if mode === 'join'}
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
						placeholder="Enter your name"
						maxlength="20"
					/>
				</div>
				<div class="buttons">
					<button 
						class="btn btn-primary" 
						onclick={handleJoinGame}
						disabled={!playerName.trim() || !gameId.trim() || !isValidGameId(gameId.trim())}
					>
						Join Game
					</button>
					<button class="btn" onclick={resetForm}>
						Back
					</button>
				</div>
			</div>
		{/if}

		{#if !connected && !connecting}
			<div class="spotify-auth">
				<p>or</p>
				<button class="btn btn-spotify" onclick={onauthenticatespotify}>
					Connect with Spotify
				</button>
				{#if spotifyAuthSuccess}
					<p class="success">Spotify connected successfully!</p>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.welcome {
		text-align: center;
	}

	h2 {
		margin-bottom: 1rem;
		font-size: 1.8rem;
	}

	h3 {
		margin: 1.5rem 0 1rem 0;
		font-size: 1.3rem;
	}

	p {
		margin-bottom: 1.5rem;
		opacity: 0.9;
		line-height: 1.5;
	}

	.connect-section {
		margin-top: 2rem;
	}

	.menu {
		margin-top: 2rem;
	}

	.form {
		margin-top: 1rem;
		text-align: left;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
	}

	.buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-top: 1.5rem;
		flex-wrap: wrap;
	}

	.error {
		color: #f44336;
		margin-top: 1rem;
		font-size: 0.9rem;
	}

	.spotify-auth {
		margin-top: 2rem;
	}

	.btn-spotify {
		background-color: #1db954;
		color: white;
	}

	.btn-spotify:hover {
		background-color: #1ed760;
	}

	.success {
		color: #4caf50;
		margin-top: 1rem;
		font-size: 0.9rem;
	}

	.spotify-section {
		margin-top: 2rem;
		padding: 1.5rem;
		background: rgba(30, 215, 96, 0.1);
		border: 1px solid rgba(30, 215, 96, 0.3);
		border-radius: 0.5rem;
		text-align: center;
	}

	.spotify-section h4 {
		margin: 0 0 0.5rem 0;
		color: #1ed760;
		font-size: 1.1rem;
	}

	.spotify-section p {
		margin: 0.5rem 0 1rem 0;
		font-size: 0.9rem;
	}

	.spotify-btn {
		background: rgba(30, 215, 96, 0.8) !important;
		border-color: rgba(30, 215, 96, 1) !important;
		color: white !important;
	}

	.spotify-btn:hover {
		background: rgba(30, 215, 96, 0.9) !important;
	}

	.spotify-section small {
		display: block;
		margin-top: 0.5rem;
		opacity: 0.7;
		font-size: 0.8rem;
	}

	.spotify-success {
		background: rgba(76, 175, 80, 0.2);
		border: 1px solid rgba(76, 175, 80, 0.5);
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 1rem;
		color: #4caf50;
		font-weight: 500;
	}

	@media (max-width: 600px) {
		.buttons {
			flex-direction: column;
		}
		
		.btn {
			width: 100%;
		}
	}
</style>
