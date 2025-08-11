<script lang="ts">
	import type { SpotifyWebPlayback } from '$lib/spotify-playback.js';

	interface Props {
		question: any; // Type from GameState.currentQuestion
		isHost: boolean;
		currentRound: number;
		totalRounds: number;
		selectedAnswer: string | null;
		hasAnswered: boolean;
		spotifyPlaying: boolean;
		playbackError: string | null;
		hostOnlyMode: boolean;
		onSelectAnswer: (answer: string) => void;
		onManualPlaySpotify: () => void;
		onToggleSpotifyPlayback: () => void;
		spotifyWebPlayback: SpotifyWebPlayback;
	}

	let { 
		question,
		isHost,
		currentRound,
		totalRounds,
		selectedAnswer, 
		hasAnswered, 
		spotifyPlaying,
		playbackError,
		hostOnlyMode,
		onSelectAnswer, 
		onManualPlaySpotify,
		onToggleSpotifyPlayback,
		spotifyWebPlayback
	}: Props = $props();
</script>

<div class="question-section">
	<div class="question-type">
		<h3>
			{#if question.type === 'artist'}
				🎤 Who is the artist?
			{:else}
				🎵 What is the song name?
			{/if}
		</h3>
	</div>

	<div class="audio-player">
		<div class="audio-controls">
			{#if isHost && question.spotifyUri && spotifyWebPlayback.isPlayerReady()}
				<!-- Host with Spotify Web Playback -->
				<button 
					class="btn audio-btn spotify-btn {playbackError ? 'pulse' : ''}" 
					onclick={onManualPlaySpotify}
				>
					{#if spotifyPlaying}
						🎵 Playing Full Spotify Track
					{:else if playbackError}
						▶️ Retry Play Song
					{:else}
						▶️ Play Full Song (Spotify)
					{/if}
				</button>
				
				{#if spotifyPlaying}
					<button 
						class="btn audio-btn pause-btn" 
						onclick={onToggleSpotifyPlayback}
					>
						⏸️ Pause
					</button>
				{/if}
				
				<div class="audio-info">
					{#if spotifyPlaying}
						{#if currentRound >= totalRounds}
							<small class="spotify-info">🎵 Playing full track - Final round!</small>
							<small class="final-round-note">🏁 Music will continue until game ends</small>
						{:else}
							<small class="spotify-info">🎵 Playing 30-second segment from full track</small>
						{/if}
					{:else if playbackError}
						<small class="error-info">❌ {playbackError}</small>
					{:else}
						<small class="spotify-info">🎧 Spotify Web Playback ready</small>
					{/if}
					<small class="host-note">🎯 Only you (host) can hear the music</small>
				</div>
			{:else if isHost && question.spotifyUri}
				<!-- Host but Spotify not ready -->
				<button 
					class="btn audio-btn disabled-btn" 
					disabled
				>
					⏳ Spotify Not Ready
				</button>
				<div class="audio-info">
					<small class="error-info">❌ Spotify Web Playback not ready. Please check your connection.</small>
					<small class="host-note">🎯 Full Spotify tracks required for gameplay</small>
				</div>
			{:else if isHost}
				<!-- Host but no Spotify URI -->
				<button 
					class="btn audio-btn disabled-btn" 
					disabled
				>
					🔇 No Track Available
				</button>
				<div class="audio-info">
					<small class="error-info">❌ No Spotify track available for this round</small>
				</div>
			{:else}
				<!-- Non-host -->
				<button 
					class="btn audio-btn disabled-btn" 
					disabled
				>
					🔇 Host Controls Music
				</button>
				<div class="audio-info">
					<small>🎧 Only the host can control music playback</small>
					<small>🎵 Listen for the full Spotify track played by the host</small>
				</div>
			{/if}
		</div>
	</div>

	{#if hostOnlyMode && isHost}
		<!-- Host-only mode: Host cannot participate in answering -->
		<div class="host-only-mode">
			<div class="host-info">
				<h4>🎵 Host Mode Active</h4>
				<p>You're playing music for the game but not participating in answering questions.</p>
				<p>Players are choosing from these options:</p>
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
			✅ Answer submitted! Waiting for round to end...
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

	.audio-player {
		background: var(--card-bg-secondary);
		border-radius: var(--border-radius);
		padding: 1.5rem;
		margin-bottom: 2rem;
		text-align: center;
	}

	.audio-controls {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.audio-btn {
		font-size: 1.1rem;
		padding: 1rem 2rem;
		background: rgba(var(--primary-color-rgb), 0.8);
		border-color: var(--primary-color);
	}

	.audio-btn:disabled {
		background: rgba(128, 128, 128, 0.5);
		border-color: rgba(128, 128, 128, 0.7);
		cursor: not-allowed;
		opacity: 0.6;
	}

	.audio-btn.pulse {
		animation: pulse 2s infinite;
	}

	.spotify-btn {
		background: rgba(30, 215, 96, 0.8) !important;
		border-color: var(--spotify-color) !important;
	}

	.spotify-btn:hover:not(:disabled) {
		background: rgba(30, 215, 96, 0.9) !important;
	}

	.pause-btn {
		background: rgba(255, 193, 7, 0.8) !important;
		border-color: var(--warning-color) !important;
		margin-left: 0.5rem;
	}

	.pause-btn:hover:not(:disabled) {
		background: rgba(255, 193, 7, 0.9) !important;
	}

	.disabled-btn {
		background: rgba(128, 128, 128, 0.5) !important;
		border-color: rgba(128, 128, 128, 0.7) !important;
		cursor: not-allowed !important;
		opacity: 0.6 !important;
	}

	.error-info {
		color: var(--error-color) !important;
		font-weight: 500;
	}

	.spotify-info {
		color: var(--spotify-color) !important;
		font-weight: 500;
	}

	.host-note {
		color: var(--accent-color) !important;
		font-weight: 600;
		display: block;
		margin-top: 0.25rem;
	}

	.audio-info {
		opacity: 0.7;
		font-size: 0.8rem;
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

	.host-info h4 {
		margin: 0 0 1rem 0;
		color: var(--spotify-color);
		font-size: 1.5rem;
	}

	.host-info p {
		margin: 0.5rem 0;
		color: var(--text-secondary);
		font-size: 1rem;
		line-height: 1.5;
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
