<script lang="ts">
	interface Props {
		onconnect: () => void;
		error: string | null;
	}

	let { onconnect, error }: Props = $props();
</script>

<div class="connect-section">
	<p>Connect to start playing:</p>
	<button class="btn btn-primary" onclick={onconnect}>
		Connect to Server
	</button>
	{#if error}
		<p class="error">{error}</p>
	{/if}
</div>

<style>
	.connect-section {
		margin-top: 2rem;
		text-align: center;
	}

	.connect-section p {
		margin-bottom: 1.5rem;
		opacity: 0.9;
		line-height: 1.5;
	}

	.error {
		color: #f44336;
		margin-top: 1rem;
		font-size: 0.9rem;
	}
</style>
