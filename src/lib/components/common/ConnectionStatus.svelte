<script lang="ts">
	interface Props {
		connected: boolean;
		connecting: boolean;
		error: string | null;
	}

	let { connected, connecting, error }: Props = $props();
</script>

<div class="connection-status">
	{#if connecting}
		<span class="status connecting">🔄 Connecting...</span>
	{:else if connected}
		<span class="status connected">🟢 Connected</span>
	{:else if error}
		<span class="status error">🔴 {error}</span>
	{:else}
		<span class="status disconnected">⚫ Disconnected</span>
	{/if}
</div>

<style>
	.connection-status {
		font-size: 0.9rem;
	}

	.status {
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		background: rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(5px);
	}

	.connecting {
		animation: pulse 1s infinite;
	}

	.connected {
		color: var(--success-color);
	}

	.error {
		color: var(--error-color);
	}

	.disconnected {
		color: #9e9e9e;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}
</style>
