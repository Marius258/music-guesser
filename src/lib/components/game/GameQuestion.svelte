<script lang="ts">
  interface Props {
    question: any;
    isHost: boolean;
    selectedAnswer: string | null;
    hasAnswered: boolean;
    hostOnlyMode: boolean;
    onSelectAnswer: (answer: string) => void;
  }

  let { question, isHost, selectedAnswer, hasAnswered, hostOnlyMode, onSelectAnswer }: Props = $props();
</script>

<div class="min-h-96">
  <div class="mb-6">
    <h3 class="text-xl text-center m-0">
      {#if question.type === "artist"}
        Who is the artist?
      {:else}
        What is the song name?
      {/if}
    </h3>
  </div>

  <div class="mb-6">
    <div></div>
  </div>

  {#if hostOnlyMode && isHost}
    <!-- Host-only mode: Host cannot participate in answering -->
    <div class="p-8 text-center">
      <div class="border-2 p-8 max-w-2xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {#each question.options as option, index (option)}
            <div class="flex items-center gap-3 p-4 border">
              <span class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                >{String.fromCharCode(65 + index)}</span
              >
              <span class="text-sm text-left">{option}</span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {:else}
    <div>
      <h4 class="text-lg text-center mb-4 m-0">Choose your answer:</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each question.options as option, index (option)}
          <button
            class="border-2 p-4 cursor-pointer transition-all flex items-center gap-3 text-left min-h-15 {selectedAnswer === option
              ? 'selected'
              : ''} disabled:opacity-60 disabled:cursor-not-allowed"
            onclick={() => onSelectAnswer(option)}
            disabled={hasAnswered}
          >
            <span class="w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">{String.fromCharCode(65 + index)}</span>
            <span class="flex-1 text-sm">{option}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}

  {#if hasAnswered}
    <div class="text-center mt-6 p-4 border font-medium">Answer submitted! Waiting for round to end...</div>
  {/if}
</div>

<style>
</style>
