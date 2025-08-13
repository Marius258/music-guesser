<script lang="ts">
  interface Props {
    timeLeft?: number;
    isActive: boolean;
    warning?: boolean;
  }

  let { timeLeft, isActive, warning = false }: Props = $props();
</script>

<div class="flex items-center justify-center">
  {#if timeLeft !== undefined}
    <span class="text-lg font-bold">{timeLeft}s</span>
  {:else}
    <span class="text-lg font-bold">--</span>
  {/if}
</div>

<style></style>
