<script lang="ts">
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import { listen } from '@tauri-apps/api/event';
  import ClipItemRow from './ClipItemRow.svelte';
  import SearchBar from './SearchBar.svelte';
  import Settings from './Settings.svelte';

  interface ClipItem {
    id: string;
    content: string;
    content_type: string;
    created_at: number;
  }

  let clipItems: ClipItem[] = [];
  let filteredItems: ClipItem[] = [];
  let searchText = '';
  let showSettings = false;
  let historyLimit = 50;

  onMount(async () => {
    // Load initial items
    clipItems = await invoke<ClipItem[]>('get_clipboard_items');
    filteredItems = clipItems;

    // Listen for window show events
    await listen('tauri://focus', () => {
      refreshItems();
    });

    // Start clipboard monitoring
    startClipboardMonitoring();
  });

  async function refreshItems() {
    clipItems = await invoke<ClipItem[]>('get_clipboard_items');
    applyFilter();
  }

  async function startClipboardMonitoring() {
    let lastClipboard = '';

    setInterval(async () => {
      try {
        const current = await invoke<string>('get_from_clipboard');
        if (current && current !== lastClipboard && current.trim().length > 0) {
          lastClipboard = current;
          await invoke('add_clipboard_item', { content: current });
          await refreshItems();
        }
      } catch (e) {
        // Clipboard might be empty or contain non-text
      }
    }, 500);
  }

  function applyFilter() {
    if (searchText.trim() === '') {
      filteredItems = clipItems;
    } else {
      const search = searchText.toLowerCase();
      filteredItems = clipItems.filter(item =>
        item.content.toLowerCase().includes(search)
      );
    }
  }

  function handleSearchInput(event: Event) {
    searchText = (event.target as HTMLInputElement).value;
    applyFilter();
  }

  async function handleCopy(item: ClipItem) {
    await invoke('copy_to_clipboard', { content: item.content });
  }

  async function handleDelete(item: ClipItem) {
    await invoke('delete_clipboard_item', { id: item.id });
    await refreshItems();
  }

  async function handleClearAll() {
    await invoke('clear_clipboard_items');
    await refreshItems();
  }

  function toggleSettings() {
    showSettings = !showSettings;
  }

  function closeApp() {
    const appWindow = getCurrentWindow();
    appWindow.close();
  }

  function handleCloseSettings() {
    showSettings = false;
  }

  $: if (searchText === '') {
    applyFilter();
  }
</script>

<main>
  {#if showSettings}
    <Settings
      {historyLimit}
      on:setLimit={(e) => {
        historyLimit = e.detail;
        invoke('set_history_limit', { limit: historyLimit });
      }}
      on:close={handleCloseSettings}
    />
  {:else}
    <div class="container">
      <SearchBar
        {searchText}
        onInput={handleSearchInput}
        onQuit={closeApp}
      />

      <div class="divider"></div>

      <div class="scroll-area">
        {#if filteredItems.length === 0}
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <h3>No clipboard items yet</h3>
            <p>Copy something to get started</p>
          </div>
        {:else}
          {#each filteredItems as item (item.id)}
            <ClipItemRow
              {item}
              onCopy={() => handleCopy(item)}
              onDelete={() => handleDelete(item)}
            />
          {/each}
        {/if}
      </div>

      <div class="divider"></div>

      <footer>
        <button
          class="footer-btn"
          on:click={handleClearAll}
          disabled={clipItems.length === 0}
        >
          🗑 Clear All
        </button>
        <button class="footer-btn settings-btn" on:click={toggleSettings}>
          ⚙ Settings
        </button>
      </footer>
    </div>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: transparent;
    overflow: hidden;
  }

  main {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 12px;
    overflow: hidden;
  }

  :global(.dark) main {
    background: rgba(30, 30, 30, 0.85);
  }

  .container {
    width: 380px;
    display: flex;
    flex-direction: column;
    max-height: 520px;
  }

  .divider {
    height: 1px;
    background: rgba(0, 0, 0, 0.1);
  }

  :global(.dark) .divider {
    background: rgba(255, 255, 255, 0.1);
  }

  .scroll-area {
    flex: 1;
    overflow-y: auto;
    max-height: 420px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .empty-state h3 {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: #1a1a1a;
  }

  :global(.dark) .empty-state h3 {
    color: #e5e5e5;
  }

  .empty-state p {
    margin: 0;
    font-size: 14px;
    color: #666;
  }

  :global(.dark) .empty-state p {
    color: #999;
  }

  footer {
    display: flex;
    justify-content: space-between;
    padding: 10px 12px;
    background: rgba(0, 0, 0, 0.02);
  }

  :global(.dark) footer {
    background: rgba(255, 255, 255, 0.02);
  }

  .footer-btn {
    background: none;
    border: none;
    padding: 6px 12px;
    font-size: 13px;
    cursor: pointer;
    border-radius: 6px;
    color: #666;
    transition: background-color 0.15s;
  }

  .footer-btn:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.05);
  }

  :global(.dark) .footer-btn {
    color: #999;
  }

  :global(.dark) .footer-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.05);
  }

  .footer-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .settings-btn {
    color: #007aff;
  }

  :global(.dark) .settings-btn {
    color: #0a84ff;
  }
</style>
