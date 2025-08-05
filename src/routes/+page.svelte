<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { GameClient } from '$lib/game-client.js';
	import type { GameConfig } from '$lib/game-client.js';
	import { 
		WelcomeScreen, 
		Lobby, 
		GamePlay, 
		GameResults, 
		ConnectionStatus 
	} from '$lib/components';

	let gameClient = new GameClient();
	let gameState = $state(gameClient.state);
	let connected = $state(gameClient.connected);
	let connecting = $state(gameClient.connecting);
	let error = $state(gameClient.errorMessage);
	let spotifyConnected = $state(false);
	let playerName = $state('');
	let unsubscribe: (() => void) | null = null;

	// Update reactive state when game client changes
	function updateState() {
		gameState = { ...gameClient.state };
		connected = gameClient.connected;
		connecting = gameClient.connecting;
		error = gameClient.errorMessage;
	}

	function setupGameClient() {
		// Clean up previous subscription
		if (unsubscribe) {
			unsubscribe();
		}
		
		// Subscribe to new game client
		unsubscribe = gameClient.subscribe(updateState);
		updateState();
	}

	// Determine current screen
	let currentScreen = $derived(() => {
		if (!connected && !connecting) {
			// If Spotify is connected, show host mode directly
			return spotifyConnected ? 'host' : 'welcome';
		}
		if (!gameState.id) {
			return spotifyConnected ? 'host' : 'welcome';
		}
		if (gameState.gameFinished) return 'results';
		if (gameState.gameStarted) return 'game';
		return 'lobby';
	});

	onMount(() => {
		// Setup initial game client
		setupGameClient();
		
		// Initialize Spotify if user just authenticated (onMount ensures browser environment)
		if (typeof window !== 'undefined') {
			const urlParams = new URLSearchParams(window.location.search);
			if (urlParams.get('spotify_auth') === 'success') {
				spotifyConnected = true;
				gameClient.initializeSpotify();
			}
		}
		
		return () => {
			if (unsubscribe) {
				unsubscribe();
			}
		};
	});

	async function handleConnect() {
		try {
			await gameClient.connect();
		} catch (err) {
			console.error('Failed to connect:', err);
		}
	}

	async function handleCreateGame(playerName: string) {
		// Auto-connect if not already connected
		if (!connected && !connecting) {
			try {
				await handleConnect();
			} catch (err) {
				console.error('Failed to auto-connect:', err);
				return;
			}
		}
		
		// Wait for connection to be established
		if (connecting) {
			// Wait for connection to complete
			await new Promise<void>((resolve, reject) => {
				const checkConnection = () => {
					if (connected) {
						resolve();
					} else if (!connecting && !connected) {
						reject(new Error('Connection failed'));
					} else {
						setTimeout(checkConnection, 100);
					}
				};
				checkConnection();
			});
		}
		
		gameClient.createGame(playerName);
	}

	function handleJoinGame(gameId: string, playerName: string) {
		gameClient.joinGame(gameId, playerName);
	}

	function handleStartGame() {
		gameClient.startGame();
	}

	function handleUpdateGameConfig(config: GameConfig) {
		gameClient.updateGameConfig(config);
	}

	function handleSubmitAnswer(answer: string) {
		gameClient.submitAnswer(answer);
	}

	function handlePlayAgain() {
		// Only the host can play again, and it will reset the game to lobby for all players
		gameClient.playAgain();
	}

	async function handleAuthenticateSpotify() {
		await gameClient.authenticateSpotify();
	}

	function handleSpotifyLogout() {
		spotifyConnected = false;
		// Reset game state and disconnect
		gameClient.disconnect();
		gameClient = new GameClient();
		setupGameClient();
		
		// Clear Spotify cookies by making a request to logout endpoint
		if (typeof window !== 'undefined') {
			fetch('/api/spotify/logout', { method: 'POST' }).catch(console.error);
		}
	}
</script>

<svelte:head>
	<title>Music Guesser</title>
	<meta name="description" content="A multiplayer music guessing game" />
</svelte:head>

<div class="app">
	<header>
		<h1>🎵 Music Guesser</h1>
		<ConnectionStatus {connected} {connecting} {error} />
	</header>

	<main>
		{#if currentScreen() === 'welcome'}
			<WelcomeScreen 
				{connected} 
				{connecting}
				{error}
				{spotifyConnected}
				onconnect={handleConnect}
				oncreategame={handleCreateGame}
				onjoingame={handleJoinGame}
				onauthenticatespotify={handleAuthenticateSpotify}
			/>
		{:else if currentScreen() === 'host'}
			<!-- Host mode when Spotify is connected -->
			<div class="card host-card">
				<div class="host-welcome">
					<h2>🎵 Host Mode - Spotify Connected</h2>
					<p>You're connected to Spotify and can host games with full music playback!</p>
					
					<div class="spotify-status">
						<div class="spotify-connected">
							✅ Spotify Premium Connected
						</div>
						<small>You can play full tracks during the game</small>
						{#if connecting}
							<div class="connecting-status">
								🔗 Connecting to game server...
							</div>
						{:else if connected}
							<div class="connected-status">
								✅ Connected to game server
							</div>
						{/if}
					</div>

					<div class="host-actions">
						<div class="create-game-section">
							<h3>Create a New Game</h3>
							<div class="form-group">
								<input 
									type="text" 
									bind:value={playerName}
									placeholder="Enter your name" 
									class="input"
									maxlength="20"
								/>
							</div>
							<button 
								class="btn btn-primary btn-large"
								onclick={() => handleCreateGame(playerName)}
								disabled={!playerName.trim() || connecting}
							>
								{connecting ? 'Connecting...' : '🎮 Create Game as Host'}
							</button>
						</div>

						<div class="logout-section">
							<button 
								class="btn btn-logout"
								onclick={handleSpotifyLogout}
							>
								🚪 Logout from Spotify
							</button>
							<small>Return to normal player mode</small>
						</div>
					</div>
				</div>
			</div>
		{:else if currentScreen() === 'lobby'}
			<Lobby 
				{gameState}
				onstartgame={handleStartGame}
				onupdateconfig={handleUpdateGameConfig}
			/>
		{:else if currentScreen() === 'game'}
			{@const gamePlayProps = { gameState, onsubmitanswer: handleSubmitAnswer }}
			<GamePlay {...gamePlayProps} />
		{:else if currentScreen() === 'results'}
			<GameResults 
				{gameState}
				onplayagain={handlePlayAgain}
			/>
		{/if}
	</main>
</div>

<style>
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	header {
		background: rgba(0, 0, 0, 0.2);
		padding: 1rem 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		backdrop-filter: blur(10px);
	}

	h1 {
		margin: 0;
		font-size: 2rem;
		font-weight: bold;
	}

	main {
		flex: 1;
		padding: 2rem;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.host-card {
		max-width: 600px;
		width: 100%;
	}

	.host-welcome {
		text-align: center;
		padding: 2rem;
	}

	.host-welcome h2 {
		margin: 0 0 1rem 0;
		font-size: 2rem;
		color: var(--spotify-color);
	}

	.host-welcome p {
		margin: 0 0 2rem 0;
		font-size: 1.1rem;
		opacity: 0.9;
	}

	.spotify-status {
		background: rgba(30, 215, 96, 0.2);
		border: 1px solid rgba(30, 215, 96, 0.5);
		border-radius: var(--border-radius);
		padding: 1rem;
		margin-bottom: 2rem;
	}

	.spotify-connected {
		color: var(--spotify-color);
		font-weight: bold;
		font-size: 1.1rem;
		margin-bottom: 0.5rem;
	}

	.spotify-status small {
		opacity: 0.8;
		display: block;
	}

	.host-actions {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.create-game-section {
		background: rgba(255, 255, 255, 0.05);
		border-radius: var(--border-radius);
		padding: 1.5rem;
	}

	.create-game-section h3 {
		margin: 0 0 1rem 0;
		font-size: 1.3rem;
	}

	.logout-section {
		text-align: center;
	}

	.btn-logout {
		background: rgba(244, 67, 54, 0.8);
		border-color: var(--error-color);
		margin-bottom: 0.5rem;
	}

	.btn-logout:hover:not(:disabled) {
		background: rgba(244, 67, 54, 0.9);
	}

	.logout-section small {
		display: block;
		opacity: 0.7;
		margin-top: 0.5rem;
	}

	.connecting-status {
		color: var(--warning-color);
		font-weight: bold;
		padding: 0.5rem;
		background: rgba(255, 215, 0, 0.2);
		border-radius: var(--border-radius);
		border: 1px solid rgba(255, 215, 0, 0.5);
		margin-top: 0.5rem;
		font-size: 0.9rem;
	}

	.connected-status {
		color: var(--success-color);
		font-weight: bold;
		padding: 0.5rem;
		background: rgba(var(--primary-color-rgb), 0.2);
		border-radius: var(--border-radius);
		border: 1px solid rgba(var(--primary-color-rgb), 0.5);
		margin-top: 0.5rem;
		font-size: 0.9rem;
	}
</style>
