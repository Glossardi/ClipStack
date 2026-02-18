<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let historyLimit = 50;

  const dispatch = createEventDispatcher<{
    setLimit: number;
    close: void;
  }>();

  const limits = [10, 25, 50, 100];
  const version = '1.0.0';

  function handleLimitChange(newLimit: number) {
    historyLimit = newLimit;
    dispatch('setLimit', newLimit);
  }
</script>

<div class="settings-container">
  <div class="settings-header">
    <h2>Settings</h2>
    <button class="close-btn" on:click={() => dispatch('close')}>✕</button>
  </div>

  <div class="settings-content">
    <section class="settings-section">
      <h3>History</h3>

      <div class="setting-row">
        <label for="history-limit">History Limit</label>
        <select
          id="history-limit"
          bind:value={historyLimit}
          on:change={(e) => handleLimitChange(parseInt((e.target as HTMLSelectElement).value))}
        >
          {#each limits as limit}
            <option value={limit}>{limit} items</option>
          {/each}
        </select>
      </div>
    </section>

    <section class="settings-section">
      <h3>About</h3>

      <div class="setting-row">
        <span>Version</span>
        <span class="value">{version}</span>
      </div>

      <div class="setting-row">
        <a
          href="https://github.com/clipstack/clipstack"
          target="_blank"
          class="link"
        >
          GitHub Repository →
        </a>
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
    padding: 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }

  :global(.dark) .settings-header {
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }

  .settings-header h2 {
    margin: 0;
    font-size: 18px;
    color: #1a1a1a;
  }

  :global(.dark) .settings-header h2 {
    color: #e5e5e5;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #666;
    padding: 4px 8px;
    border-radius: 6px;
    transition: background-color 0.15s;
  }

  .close-btn:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  :global(.dark) .close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
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
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  :global(.dark) .settings-section h3 {
    color: #999;
  }

  .setting-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    font-size: 14px;
  }

  .setting-row label {
    color: #1a1a1a;
  }

  :global(.dark) .setting-row label {
    color: #e5e5e5;
  }

  select {
    padding: 6px 12px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 6px;
    font-size: 14px;
    background: white;
    cursor: pointer;
  }

  :global(.dark) select {
    background: #2a2a2a;
    border-color: rgba(255, 255, 255, 0.1);
    color: #e5e5e5;
  }

  .value {
    color: #666;
  }

  :global(.dark) .value {
    color: #999;
  }

  .link {
    color: #007aff;
    text-decoration: none;
  }

  :global(.dark) .link {
    color: #0a84ff;
  }

  .link:hover {
    text-decoration: underline;
  }
</style>
