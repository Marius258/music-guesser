<script lang="ts">
	import type { GameConfig } from '$lib/game-client.js';
	import { onMount } from 'svelte';
	import { Loading } from '../common/index.js';

	interface SpotifyGenre {
		id: string;
		name: string;
		description: string;
		icons?: { url: string; height: number; width: number }[];
	}

	interface Props {
		config: GameConfig;
		onupdateconfig: (config: GameConfig) => void;
	}

	let { config, onupdateconfig }: Props = $props();

	// Local state for the form
	let localConfig = $state<GameConfig>({
		totalRounds: config.totalRounds,
		roundDurationSeconds: config.roundDurationSeconds,
		randomStartTime: config.randomStartTime,
		musicCategory: config.musicCategory,
		hostOnlyMode: config.hostOnlyMode,
	});

	let availableGenres = $state<SpotifyGenre[]>([]);
	let genresLoading = $state(true);

	// Auto-save when any config value changes
	$effect(() => {
		// Only update if the local config is different from the prop config
		if (
			localConfig.totalRounds !== config.totalRounds ||
			localConfig.roundDurationSeconds !== config.roundDurationSeconds ||
			localConfig.randomStartTime !== config.randomStartTime ||
			localConfig.musicCategory !== config.musicCategory ||
			localConfig.hostOnlyMode !== config.hostOnlyMode
		) {
			onupdateconfig(localConfig);
		}
	});

	onMount(async () => {
		try {
			const response = await fetch('/api/spotify/categories');
			const data = await response.json();
			
			if (data.success) {
				availableGenres = data.categories;
				console.log("AvailableGenres: ", availableGenres)
			} else {
				console.error('Failed to fetch genres:', data.error);
				throw new Error(data.error || 'Failed to fetch genres');
			}
		} catch (error) {
			console.error('Error fetching genres:', error);
			// No fallback - show error to user
			genresLoading = false;
			// You could set an error state here to show to the user
		} finally {
			genresLoading = false;
		}
	});

	function handleReset() {
		localConfig = {
			totalRounds: 10,
			roundDurationSeconds: 30,
			randomStartTime: true,
			musicCategory: "mixed",
			hostOnlyMode: false,
		};
		// Config will auto-save due to $effect
	}

	function selectGenre(genreId: string) {
		localConfig.musicCategory = genreId;
		// Config will auto-save due to $effect
	}

	function getGenreImage(genre: SpotifyGenre): string | null {
		if (genre.icons && genre.icons.length > 0) {
			// Find a medium-sized icon (prefer 300x300 or similar)
			const mediumIcon = genre.icons.find(icon => icon.height >= 200 && icon.height <= 400);
			return mediumIcon ? mediumIcon.url : genre.icons[0].url;
		}
		return null;
	}
</script>

<div class="game-config">
	<h3>🎛️ Game Configuration <small>(Auto-saves)</small></h3>
	
	<div class="config-form">
		<div class="form-group">
			<label for="totalRounds">Total Rounds</label>
			<input 
				id="totalRounds"
				type="number" 
				bind:value={localConfig.totalRounds}
				min="3"
				max="50"
				class="input"
			/>
			<small>Number of questions in the game (3-50)</small>
		</div>

		<div class="form-group">
			<label for="roundDuration">Round Duration</label>
			<select 
				id="roundDuration"
				bind:value={localConfig.roundDurationSeconds}
				class="input"
			>
				<option value={15}>15 seconds</option>
				<option value={20}>20 seconds</option>
				<option value={25}>25 seconds</option>
				<option value={30}>30 seconds</option>
				<option value={45}>45 seconds</option>
				<option value={60}>60 seconds</option>
			</select>
			<small>How long players have to answer each question</small>
		</div>

		<div class="form-group">
			<span>Music Genre</span>
			{#if genresLoading}
				<Loading text="Loading music genres..." size="small" />
			{:else}
				<div class="genres-grid">
					{#each availableGenres as genre (genre.name)}
						<button 
							class="genre-card {localConfig.musicCategory === genre.name ? 'selected' : ''}"
							onclick={() => selectGenre(genre.name)}
						>
							<div class="genre-image">
								{#if getGenreImage(genre)}
									<img src={getGenreImage(genre)} alt={genre.name} />
								{:else}
									<div class="genre-icon">🎵</div>
								{/if}
							</div>
							<div class="genre-info">
								<h4>{genre.name}</h4>
								<p>{genre.description}</p>
							</div>
							{#if localConfig.musicCategory === genre.name}
								<div class="selected-badge">✓</div>
							{/if}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<div class="form-group">
			<label class="checkbox-label">
				<input 
					type="checkbox" 
					bind:checked={localConfig.randomStartTime}
					class="checkbox"
				/>
				<span class="checkmark"></span>
				Random Start Time
			</label>
			<small>Start songs at random positions (more challenging) or from the beginning</small>
		</div>

		<div class="form-group">
			<label class="checkbox-label">
				<input 
					type="checkbox" 
					bind:checked={localConfig.hostOnlyMode}
					class="checkbox"
				/>
				<span class="checkmark"></span>
				Host Only Mode
			</label>
			<small>Host plays music but doesn't participate in answering questions</small>
		</div>

		<div class="form-actions">
			<button 
				class="btn btn-secondary"
				onclick={handleReset}
			>
				🔄 Reset to Defaults
			</button>
		</div>
	</div>
</div>

<style>
	.game-config {
		background: var(--card-bg);
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		border: 1px solid var(--border-color);
	}

	.game-config h3 {
		margin: 0 0 1rem 0;
		color: var(--text-primary);
		font-size: 1.25rem;
	}

	.game-config h3 small {
		font-size: 0.7rem;
		color: var(--text-secondary);
		font-weight: normal;
		opacity: 0.8;
	}

	.config-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label,
	.form-group span {
		font-weight: 600;
		color: var(--text-primary);
		font-size: 0.9rem;
	}

	.form-group small {
		color: var(--text-secondary);
		font-size: 0.8rem;
		margin-top: -0.25rem;
	}

	.input {
		padding: 0.75rem;
		border: 2px solid var(--border-color);
		border-radius: 8px;
		background: var(--input-bg);
		color: var(--text-primary);
		font-size: 1rem;
		transition: border-color 0.2s ease;
	}

	.input:focus {
		outline: none;
		border-color: var(--primary-color);
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-weight: 600;
		color: var(--text-primary);
		font-size: 0.9rem;
	}

	.checkbox {
		width: 1.25rem;
		height: 1.25rem;
		cursor: pointer;
	}



	.genres-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1rem;
		margin-top: 0.5rem;
	}

	.genre-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		border: 2px solid var(--border-color);
		border-radius: 12px;
		background: var(--input-bg);
		color: var(--text-primary);
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		position: relative;
		min-height: 80px;
	}

	.genre-card:hover {
		border-color: var(--primary-color);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.genre-card.selected {
		border-color: var(--primary-color);
		background: rgba(var(--primary-color-rgb), 0.1);
		box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.2);
	}

	.genre-image {
		width: 50px;
		height: 50px;
		border-radius: 8px;
		overflow: hidden;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.1);
	}

	.genre-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.genre-icon {
		font-size: 1.5rem;
		opacity: 0.7;
	}

	.genre-info {
		flex: 1;
		min-width: 0;
	}

	.genre-info h4 {
		margin: 0 0 0.25rem 0;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.3;
	}

	.genre-info p {
		margin: 0;
		font-size: 0.8rem;
		color: var(--text-secondary);
		line-height: 1.3;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.selected-badge {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 24px;
		height: 24px;
		background: var(--primary-color);
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8rem;
		font-weight: bold;
	}

	.form-actions {
		display: flex;
		justify-content: center;
		margin-top: 0.5rem;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		min-width: 150px;
	}

	.btn-secondary {
		background: var(--secondary-color);
		color: var(--text-primary);
		border: 1px solid var(--border-color);
	}

	.btn-secondary:hover {
		background: var(--secondary-hover);
		transform: translateY(-1px);
	}

	@media (max-width: 768px) {
		.genres-grid {
			grid-template-columns: 1fr;
		}
		
		.genre-card {
			min-height: 70px;
		}
		
		.genre-image {
			width: 40px;
			height: 40px;
		}
		
		.form-actions {
			margin-top: 1rem;
		}
	}
</style>
