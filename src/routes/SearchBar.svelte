<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let searchText = '';

  const dispatch = createEventDispatcher<{
    input: Event;
    clear: void;
    quit: void;
  }>();

  function handleInput(event: Event) {
    searchText = (event.target as HTMLInputElement).value;
    dispatch('input', event);
  }

  function clearSearch() {
    searchText = '';
    dispatch('clear');
  }
</script>

<div class="search-bar">
  <div class="search-input-wrapper">
    <span class="search-icon">🔍</span>
    <input
      type="text"
      class="search-input"
      placeholder="Search..."
      bind:value={searchText}
      on:input={handleInput}
    />
    {#if searchText !== ''}
      <button class="clear-btn" on:click={clearSearch}>
        ⓧ
      </button>
    {/if}
  </div>
  <button class="quit-btn" on:click={() => dispatch('quit')}>
    ⓧ
  </button>
</div>

<style>
  .search-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
  }

  .search-input-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 6px;
  }

  :global(.dark) .search-input-wrapper {
    background: rgba(255, 255, 255, 0.05);
  }

  .search-icon {
    font-size: 14px;
    opacity: 0.5;
  }

  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 14px;
    outline: none;
    padding: 0;
    color: #1a1a1a;
  }

  :global(.dark) .search-input {
    color: #e5e5e5;
  }

  .search-input::placeholder {
    color: #999;
  }

  :global(.dark) .search-input::placeholder {
    color: #666;
  }

  .clear-btn,
  .quit-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.15s;
  }

  .clear-btn {
    font-size: 12px;
    opacity: 0.5;
  }

  .clear-btn:hover {
    background: rgba(0, 0, 0, 0.1);
    opacity: 1;
  }

  :global(.dark) .clear-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .quit-btn {
    font-size: 18px;
    color: #666;
  }

  :global(.dark) .quit-btn {
    color: #999;
  }

  .quit-btn:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  :global(.dark) .quit-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }
</style>
