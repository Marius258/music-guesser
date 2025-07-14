<script lang="ts">
	interface Props {
		timeLeft?: number;
		isActive: boolean;
		warning?: boolean;
	}

	let { timeLeft, isActive, warning = false }: Props = $props();
</script>

<div class="timer {warning ? 'warning' : ''}" class:active={isActive}>
	{#if timeLeft !== undefined}
		<span class="time">{timeLeft}s</span>
		<div class="progress-ring">
			<svg class="progress-ring-svg" width="60" height="60">
				<circle
					class="progress-ring-circle-bg"
					stroke="rgba(255, 255, 255, 0.2)"
					stroke-width="4"
					fill="transparent"
					r="26"
					cx="30"
					cy="30"
				/>
				<circle
					class="progress-ring-circle"
					stroke="#ffd700"
					stroke-width="4"
					fill="transparent"
					r="26"
					cx="30"
					cy="30"
					style="stroke-dasharray: 163; stroke-dashoffset: {163 - (timeLeft / 30) * 163};"
				/>
			</svg>
		</div>
	{:else}
		<span class="time">--</span>
	{/if}
</div>

<style>
	.timer {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 80px;
		height: 80px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.1);
		border: 2px solid rgba(255, 255, 255, 0.2);
		transition: all 0.3s ease;
	}

	.timer.active {
		background: rgba(255, 193, 7, 0.2);
		border-color: #ffd700;
		animation: pulse 2s infinite;
	}

	.timer.warning {
		background: rgba(244, 67, 54, 0.2);
		border-color: #f44336;
		animation: pulse-red 1s infinite;
	}

	.time {
		font-size: 1.2rem;
		font-weight: bold;
		color: #fff;
		z-index: 2;
	}

	.progress-ring {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.progress-ring-svg {
		transform: rotate(-90deg);
	}

	.progress-ring-circle {
		transition: stroke-dashoffset 0.3s ease;
	}

	@keyframes pulse {
		0%, 100% { 
			box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.7); 
		}
		70% { 
			box-shadow: 0 0 0 10px rgba(255, 193, 7, 0); 
		}
	}

	@keyframes pulse-red {
		0%, 100% { 
			box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.7); 
		}
		70% { 
			box-shadow: 0 0 0 10px rgba(244, 67, 54, 0); 
		}
	}

	@media (max-width: 768px) {
		.timer {
			width: 60px;
			height: 60px;
		}
		
		.time {
			font-size: 1rem;
		}
		
		.progress-ring-svg {
			width: 50px;
			height: 50px;
		}
		
		.progress-ring-circle,
		.progress-ring-circle-bg {
			r: 21;
			cx: 25;
			cy: 25;
		}
	}
</style>
