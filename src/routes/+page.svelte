<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
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
  let searchInputRef: HTMLInputElement | null = null;

  const appWindow = getCurrentWindow();

  onMount(async () => {
    // Apply dark mode based on system preference
    applyColorScheme();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyColorScheme);

    // Load initial items
    clipItems = await invoke<ClipItem[]>('get_clipboard_items');
    filteredItems = clipItems;

    // Auto-focus search and refresh when window gains focus
    await listen('tauri://focus', () => {
      refreshItems();
      setTimeout(() => searchInputRef?.focus(), 50);
    });

    // Hide window when it loses focus (click outside)
    await listen('tauri://blur', () => {
      // Small delay so internal button clicks don't trigger hide
      setTimeout(async () => {
        const focused = await appWindow.isFocused();
        if (!focused) {
          await appWindow.hide();
        }
      }, 100);
    });

    // Keyboard: Escape hides window
    window.addEventListener('keydown', handleKeydown);

    // Start clipboard monitoring
    startClipboardMonitoring();
  });

  function applyColorScheme() {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', dark);
  }

  async function refreshItems() {
    clipItems = await invoke<ClipItem[]>('get_clipboard_items');
    applyFilter();
  }

  let monitorInterval: ReturnType<typeof setInterval> | null = null;

  function startClipboardMonitoring() {
    let lastClipboard = '';

    monitorInterval = setInterval(async () => {
      try {
        const current = await invoke<string>('get_from_clipboard');
        if (current && current !== lastClipboard && current.trim().length > 0) {
          lastClipboard = current;
          await invoke('add_clipboard_item', { content: current });
          await refreshItems();
        }
      } catch {
        // Clipboard might be empty or contain non-text data
      }
    }, 500);
  }

  onDestroy(() => {
    if (monitorInterval !== null) clearInterval(monitorInterval);
    window.removeEventListener('keydown', handleKeydown);
    window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', applyColorScheme);
  });

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

  function handleSearchInput(event: CustomEvent<string>) {
    searchText = event.detail;
    applyFilter();
  }

  async function handleCopy(item: ClipItem) {
    await invoke('copy_to_clipboard', { content: item.content });
    // Hide window so user can immediately paste
    await appWindow.hide();
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

  function handleCloseSettings() {
    showSettings = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (showSettings) {
        showSettings = false;
      } else {
        appWindow.hide();
      }
    }
  }

  $: if (searchText === '') applyFilter();
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
        bind:inputRef={searchInputRef}
        on:input={handleSearchInput}
        on:clear={() => { searchText = ''; applyFilter(); }}
      />

      <div class="divider"></div>

      <div class="scroll-area">
        {#if filteredItems.length === 0}
          <div class="empty-state">
            <div class="empty-icon">􀉞</div>
            <p class="empty-title">No clipboard history</p>
            <p class="empty-sub">Copy something to get started</p>
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
          class="footer-btn danger"
          on:click={handleClearAll}
          disabled={clipItems.length === 0}
          title="Clear all history"
        >
          Clear All
        </button>
        <button class="footer-btn accent" on:click={toggleSettings} title="Settings">
          Settings
        </button>
      </footer>
    </div>
  {/if}
</main>

<style>
  :global(html) {
    height: 100%;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
    background: transparent;
    overflow: hidden;
    height: 100%;
    -webkit-font-smoothing: antialiased;
  }

  main {
    background: rgba(246, 246, 246, 0.82);
    backdrop-filter: blur(40px) saturate(180%);
    -webkit-backdrop-filter: blur(40px) saturate(180%);
    border-radius: 14px;
    border: 0.5px solid rgba(0, 0, 0, 0.14);
    box-shadow:
      0 0 0 0.5px rgba(0, 0, 0, 0.08),
      0 4px 24px rgba(0, 0, 0, 0.16),
      0 1px 3px rgba(0, 0, 0, 0.12);
    overflow: hidden;
    animation: popIn 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  :global(html.dark) main {
    background: rgba(28, 28, 28, 0.82);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow:
      0 0 0 0.5px rgba(255, 255, 255, 0.06),
      0 4px 24px rgba(0, 0, 0, 0.5),
      0 1px 3px rgba(0, 0, 0, 0.3);
  }

  @keyframes popIn {
    from {
      opacity: 0;
      transform: scale(0.96) translateY(-4px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .container {
    width: 380px;
    display: flex;
    flex-direction: column;
    max-height: 520px;
  }

  .divider {
    height: 1px;
    background: rgba(0, 0, 0, 0.08);
    flex-shrink: 0;
  }

  :global(html.dark) .divider {
    background: rgba(255, 255, 255, 0.08);
  }

  .scroll-area {
    flex: 1;
    overflow-y: auto;
    max-height: 408px;
    overscroll-behavior: contain;
  }

  .scroll-area::-webkit-scrollbar {
    width: 4px;
  }

  .scroll-area::-webkit-scrollbar-track {
    background: transparent;
  }

  .scroll-area::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 4px;
  }

  :global(html.dark) .scroll-area::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 20px;
    text-align: center;
    gap: 4px;
  }

  .empty-icon {
    font-size: 36px;
    opacity: 0.25;
    margin-bottom: 8px;
    line-height: 1;
  }

  .empty-title {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.55);
    letter-spacing: -0.1px;
  }

  :global(html.dark) .empty-title {
    color: rgba(255, 255, 255, 0.45);
  }

  .empty-sub {
    margin: 0;
    font-size: 12px;
    color: rgba(0, 0, 0, 0.35);
  }

  :global(html.dark) .empty-sub {
    color: rgba(255, 255, 255, 0.28);
  }

  footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.02);
    flex-shrink: 0;
  }

  :global(html.dark) footer {
    background: rgba(255, 255, 255, 0.02);
  }

  .footer-btn {
    background: none;
    border: none;
    padding: 5px 10px;
    font-size: 12px;
    font-weight: 450;
    cursor: pointer;
    border-radius: 6px;
    color: rgba(0, 0, 0, 0.45);
    transition: background-color 0.12s, color 0.12s;
    letter-spacing: -0.1px;
    font-family: inherit;
    -webkit-font-smoothing: antialiased;
  }

  .footer-btn:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.06);
    color: rgba(0, 0, 0, 0.7);
  }

  :global(html.dark) .footer-btn {
    color: rgba(255, 255, 255, 0.35);
  }

  :global(html.dark) .footer-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.65);
  }

  .footer-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .footer-btn.accent {
    color: #007aff;
  }

  .footer-btn.accent:hover {
    background: rgba(0, 122, 255, 0.08);
    color: #0062cc;
  }

  :global(html.dark) .footer-btn.accent {
    color: #0a84ff;
  }

  :global(html.dark) .footer-btn.accent:hover {
    background: rgba(10, 132, 255, 0.12);
    color: #409cff;
  }

  .footer-btn.danger:hover:not(:disabled) {
    color: #ff3b30;
    background: rgba(255, 59, 48, 0.07);
  }

  :global(html.dark) .footer-btn.danger:hover:not(:disabled) {
    color: #ff453a;
    background: rgba(255, 69, 58, 0.1);
  }
</style>
