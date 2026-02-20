<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let searchText: string = '';
  export let inputRef: HTMLInputElement | null = null;

  const dispatch = createEventDispatcher<{
    input: string;
    clear: void;
  }>();

  function handleInput(e: Event) {
    dispatch('input', (e.target as HTMLInputElement).value);
  }

  function handleClear() {
    dispatch('clear');
    inputRef?.focus();
  }
</script>

<div class="search-bar">
  <svg class="search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1.5"/>
    <path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>

  <input
    bind:this={inputRef}
    type="text"
    placeholder="Search"
    value={searchText}
    on:input={handleInput}
    autocomplete="off"
    autocorrect="off"
    autocapitalize="off"
    spellcheck="false"
    aria-label="Search clipboard history"
  />

  {#if searchText !== ''}
    <button class="clear-btn" on:click={handleClear} aria-label="Clear search" tabindex="-1">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <circle cx="7" cy="7" r="6.5" fill="currentColor" opacity="0.28"/>
        <path d="M4.5 4.5L9.5 9.5M9.5 4.5L4.5 9.5" stroke="white" stroke-width="1.4" stroke-linecap="round"/>
      </svg>
    </button>
  {/if}
</div>

<style>
  .search-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
  }

  .search-icon {
    color: rgba(0, 0, 0, 0.32);
    flex-shrink: 0;
    pointer-events: none;
  }

  :global(html.dark) .search-icon {
    color: rgba(255, 255, 255, 0.32);
  }

  input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
    color: rgba(0, 0, 0, 0.85);
    outline: none;
    min-width: 0;
    letter-spacing: -0.1px;
    -webkit-font-smoothing: antialiased;
    padding: 0;
  }

  input::placeholder {
    color: rgba(0, 0, 0, 0.28);
  }

  :global(html.dark) input {
    color: rgba(255, 255, 255, 0.85);
  }

  :global(html.dark) input::placeholder {
    color: rgba(255, 255, 255, 0.25);
  }

  .clear-btn {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(0, 0, 0, 0.6);
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    transition: opacity 0.12s;
    border-radius: 50%;
  }

  .clear-btn:hover {
    opacity: 0.65;
  }

  :global(html.dark) .clear-btn {
    color: rgba(255, 255, 255, 0.55);
  }
</style>
