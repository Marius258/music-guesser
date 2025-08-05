<script lang="ts">
	import type { TrackInfo } from '$lib/game-client.js';

	interface Props {
		track: TrackInfo;
		title?: string;
		showTitle?: boolean;
	}

	let { track, title = "🎵 Correct Song", showTitle = true }: Props = $props();
</script>

<div class="correct-song">
	{#if showTitle}
		<h3>{title}</h3>
	{/if}
	<div class="song-info">
		{#if track.imageUrl}
			<img src={track.imageUrl} alt="Album cover" class="album-cover" />
		{/if}
		<div class="song-details">
			<div class="song-name">{track.name}</div>
			<div class="artist-name">by {track.artist}</div>
		</div>
	</div>
</div>

<style>
	.correct-song {
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: var(--border-radius);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.correct-song h3 {
		margin: 0 0 1rem 0;
		text-align: center;
		color: var(--success-color);
	}

	.song-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		justify-content: center;
	}

	.album-cover {
		width: 80px;
		height: 80px;
		border-radius: var(--border-radius);
		object-fit: cover;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
	}

	.song-details {
		text-align: left;
	}

	.song-name {
		font-size: 1.2rem;
		font-weight: bold;
		margin-bottom: 0.25rem;
		color: var(--text-primary);
	}

	.artist-name {
		font-size: 1rem;
		color: var(--text-secondary);
	}

	@media (max-width: 768px) {
		.song-info {
			flex-direction: column;
			text-align: center;
		}
		
		.song-details {
			text-align: center;
		}
		
		.album-cover {
			width: 60px;
			height: 60px;
		}
		
		.song-name {
			font-size: 1rem;
		}
		
		.artist-name {
			font-size: 0.9rem;
		}
	}
</style>
