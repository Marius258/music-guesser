<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { page } from '$app/stores';

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
		oncreategame: (playerName: string) => void;
		onjoingame: (gameId: string, playerName: string) => void;
		onauthenticatespotify?: () => void;
		spotifyConnected?: boolean;
	}

	let { oncreategame, onjoingame, onauthenticatespotify, spotifyConnected = false }: Props = $props();

	let playerName = $state('');
	let gameId = $state('');

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

	function handleHostGame() {
		// Authenticate with Spotify first if not already connected
		if (!spotifyConnected && onauthenticatespotify) {
			onauthenticatespotify();
		} else {
			oncreategame(playerName.trim());
		}
	}

	function handleJoinGame() {
		if (!playerName.trim() || !gameId.trim()) return;
		
		// Validate game ID format
		if (!isValidGameId(gameId.trim())) {
			alert('Please enter a valid Game ID (3 letters + 3 numbers, e.g., ABC123)');
			return;
		}
		
		onjoingame(gameId.trim(), playerName.trim());
	}

</script>

<div class="card">
	<div class="welcome">
		<h2>Music Guesser</h2>

			<div class="game-modes">
				<h3>Choose your game mode:</h3>
				<div class="buttons main-buttons">
					<button class="btn btn-spotify" onclick={handleHostGame}>
						Host with Spotify
					</button>
				</div>
			</div>

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
					</div>
				</div>
	</div>
</div>
