<script lang="ts">
	interface Props {
		spotifyAuthSuccess: boolean;
		onauthenticatespotify?: () => void;
		oncreategame: () => void;
		onjoingame: () => void;
	}

	let { spotifyAuthSuccess, onauthenticatespotify, oncreategame, onjoingame }: Props = $props();
</script>

<div class="menu">
	{#if spotifyAuthSuccess}
		<div class="spotify-success">
			✅ Spotify connected! You can now host games with full music playback.
		</div>
	{/if}
	
	<h3>Choose your game mode:</h3>
	<div class="buttons">
		<button class="btn btn-primary" onclick={oncreategame}>
			🎮 Create Game (Host)
		</button>
		<button class="btn" onclick={onjoingame}>
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

<style>
	.menu {
		margin-top: 2rem;
		text-align: center;
	}

	h3 {
		margin: 1.5rem 0 1rem 0;
		font-size: 1.3rem;
	}

	.buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-top: 1.5rem;
		flex-wrap: wrap;
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
	}
</style>
