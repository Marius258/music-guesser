<script lang="ts">
	let { 
		connected, 
		connecting, 
		oncreategame, 
		onspotifylogout 
	}: {
		connected: boolean;
		connecting: boolean;
		oncreategame: (playerName: string) => void;
		onspotifylogout: () => void;
	} = $props();
	
	let playerName = $state('');
</script>

<!-- Host mode when Spotify is connected -->
<div class="card host-card">
	<div class="host-welcome">
		<h2>Host Mode</h2>
		
		<div class="spotify-status">
			<div class="spotify-connected">
				Spotify Premium Connected
			</div>
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
					onclick={() => oncreategame(playerName)}
					disabled={!playerName.trim() || connecting}
				>
					{connecting ? 'Connecting...' : 'Create Game as Host'}
				</button>
			</div>

			<div class="logout-section">
				<button 
					class="btn btn-logout"
					onclick={onspotifylogout}
				>
					Logout from Spotify
				</button>
			</div>
		</div>
	</div>
</div>

<style>
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

	
</style>
