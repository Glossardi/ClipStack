<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let historyLimit = 50;

  const dispatch = createEventDispatcher<{
    setLimit: number;
    close: void;
  }>();

  const limits = [10, 25, 50, 100];
  const version = '1.1.0';

  function handleLimitChange(e: Event) {
    const newLimit = parseInt((e.target as HTMLSelectElement).value);
    historyLimit = newLimit;
    dispatch('setLimit', newLimit);
  }

  function handleClose() {
    dispatch('close');
  }
</script>

<div class="settings-container">
  <div class="settings-header">
    <h2>Settings</h2>
    <button class="close-btn" on:click={handleClose} aria-label="Close settings">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M1.5 1.5L10.5 10.5M10.5 1.5L1.5 10.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
    </button>
  </div>

  <div class="settings-content">
    <section class="settings-section">
      <h3>History</h3>

      <div class="setting-row">
        <label for="history-limit">Keep last</label>
        <select id="history-limit" value={historyLimit} on:change={handleLimitChange}>
          {#each limits as limit}
            <option value={limit}>{limit} items</option>
          {/each}
        </select>
      </div>
    </section>

    <section class="settings-section">
      <h3>About</h3>
      <div class="setting-row">
        <span>ClipStack</span>
        <span class="value">v{version}</span>
      </div>
    </section>
  </div>
</div>

<style>
  .settings-container {
    width: 380px;
    max-height: 520px;
    display: flex;
    flex-direction: column;
  }

  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  :global(html.dark) .settings-header {
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }

  .settings-header h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.85);
    letter-spacing: -0.2px;
    -webkit-font-smoothing: antialiased;
  }

  :global(html.dark) .settings-header h2 {
    color: rgba(255, 255, 255, 0.85);
  }

  .close-btn {
    background: rgba(0, 0, 0, 0.06);
    border: none;
    cursor: pointer;
    color: rgba(0, 0, 0, 0.45);
    padding: 0;
    border-radius: 50%;
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.12s;
  }

  .close-btn:hover {
    background: rgba(0, 0, 0, 0.12);
    color: rgba(0, 0, 0, 0.65);
  }

  :global(html.dark) .close-btn {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.45);
  }

  :global(html.dark) .close-btn:hover {
    background: rgba(255, 255, 255, 0.16);
    color: rgba(255, 255, 255, 0.7);
  }

  .settings-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  .settings-section {
    margin-bottom: 24px;
  }

  .settings-section h3 {
    margin: 0 0 8px 0;
    font-size: 11px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.38);
    text-transform: uppercase;
    letter-spacing: 0.6px;
    -webkit-font-smoothing: antialiased;
  }

  :global(html.dark) .settings-section h3 {
    color: rgba(255, 255, 255, 0.32);
  }

  .setting-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    font-size: 14px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }

  :global(html.dark) .setting-row {
    border-top-color: rgba(255, 255, 255, 0.06);
  }

  .setting-row label {
    color: rgba(0, 0, 0, 0.82);
    -webkit-font-smoothing: antialiased;
  }

  :global(html.dark) .setting-row label {
    color: rgba(255, 255, 255, 0.82);
  }

  select {
    padding: 5px 8px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 7px;
    font-size: 13px;
    background: white;
    cursor: pointer;
    color: rgba(0, 0, 0, 0.8);
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  :global(html.dark) select {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
  }

  .value {
    color: rgba(0, 0, 0, 0.38);
    font-size: 13px;
  }

  :global(html.dark) .value {
    color: rgba(255, 255, 255, 0.32);
  }
</style>
