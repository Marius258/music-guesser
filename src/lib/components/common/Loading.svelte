<script lang="ts">
	interface Props {
		type?: 'spinner' | 'dots';
		text?: string;
		size?: 'small' | 'medium' | 'large';
	}

	let { type = 'spinner', text, size = 'medium' }: Props = $props();
</script>

<div class="loading {size}">
	{#if type === 'spinner'}
		<div class="loading-spinner"></div>
	{:else}
		<div class="loading-dots">
			<span></span>
			<span></span>
			<span></span>
		</div>
	{/if}
	{#if text}
		<p>{text}</p>
	{/if}
</div>

<style>
	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	.loading.small { gap: 0.5rem; }
	.loading.large { gap: 1.5rem; }

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid rgba(255, 255, 255, 0.2);
		border-top: 4px solid var(--text-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.loading.small .loading-spinner {
		width: 24px;
		height: 24px;
		border-width: 2px;
	}

	.loading.large .loading-spinner {
		width: 60px;
		height: 60px;
		border-width: 6px;
	}

	.loading-dots {
		display: flex;
		justify-content: center;
		gap: 0.25rem;
	}

	.loading-dots span {
		width: 8px;
		height: 8px;
		background: rgba(255, 255, 255, 0.6);
		border-radius: 50%;
		animation: loading 1.4s infinite ease-in-out;
	}

	.loading.small .loading-dots span {
		width: 6px;
		height: 6px;
	}

	.loading.large .loading-dots span {
		width: 12px;
		height: 12px;
	}

	.loading-dots span:nth-child(1) { animation-delay: -0.32s; }
	.loading-dots span:nth-child(2) { animation-delay: -0.16s; }

	.loading p {
		margin: 0;
		color: var(--text-secondary);
		text-align: center;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	@keyframes loading {
		0%, 80%, 100% {
			transform: scale(0);
			opacity: 0.5;
		}
		40% {
			transform: scale(1);
			opacity: 1;
		}
	}
</style>
