<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { invoke } from "@tauri-apps/api/core";
    import { listen } from "@tauri-apps/api/event";
    import { getCurrentWindow } from "@tauri-apps/api/window";

    interface ClipItem {
        id: string;
        content: string;
        content_type: string;
        created_at: number;
    }

    const appWindow = getCurrentWindow();

    let allItems: ClipItem[] = [];
    let filteredItems: ClipItem[] = [];
    let searchText = "";
    let searchInput: HTMLInputElement | null = null;

    let refreshInterval: ReturnType<typeof setInterval> | null = null;
    let unlistenFocus: (() => void) | null = null;
    let darkModeListener: ((event: MediaQueryListEvent) => void) | null = null;

    const REFRESH_INTERVAL_MS = 700;

    onMount(async () => {
        applyColorScheme();

        const media = window.matchMedia("(prefers-color-scheme: dark)");
        darkModeListener = () => applyColorScheme();
        media.addEventListener("change", darkModeListener);

        await refreshItems();

        refreshInterval = setInterval(() => {
            refreshItems();
        }, REFRESH_INTERVAL_MS);

        unlistenFocus = await listen("tauri://focus", async () => {
            await refreshItems();
            setTimeout(() => searchInput?.focus(), 35);
        });

        window.addEventListener("keydown", handleKeydown);
        setTimeout(() => searchInput?.focus(), 35);
    });

    onDestroy(() => {
        if (refreshInterval !== null) {
            clearInterval(refreshInterval);
        }

        if (unlistenFocus) {
            unlistenFocus();
        }

        window.removeEventListener("keydown", handleKeydown);

        const media = window.matchMedia("(prefers-color-scheme: dark)");
        if (darkModeListener) {
            media.removeEventListener("change", darkModeListener);
        }
    });

    function applyColorScheme() {
        const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.classList.toggle("dark", dark);
    }

    async function refreshItems() {
        const items = await invoke<ClipItem[]>("get_clipboard_items");
        allItems = items;
        applyFilter();
    }

    function applyFilter() {
        const query = searchText.trim().toLowerCase();
        if (query.length === 0) {
            filteredItems = allItems;
            return;
        }

        filteredItems = allItems.filter((item) =>
            item.content.toLowerCase().includes(query),
        );
    }

    async function handleCopy(item: ClipItem) {
        await invoke("copy_to_clipboard", { content: item.content });
        await closePopover();
    }

    async function handleDelete(item: ClipItem) {
        await invoke("delete_clipboard_item", { id: item.id });
        await refreshItems();
    }

    async function handleClearAll() {
        await invoke("clear_clipboard_items");
        await refreshItems();
    }

    async function closePopover() {
        await appWindow.hide();
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Escape") {
            closePopover();
            return;
        }

        if (
            (event.metaKey || event.ctrlKey) &&
            event.key.toLowerCase() === "f"
        ) {
            event.preventDefault();
            searchInput?.focus();
            searchInput?.select();
        }
    }

    function onSearchInput(event: Event) {
        searchText = (event.target as HTMLInputElement).value;
        applyFilter();
    }

    function getRelativeTime(timestamp: number): string {
        const seconds = Math.max(
            0,
            Math.floor((Date.now() - timestamp) / 1000),
        );
        if (seconds < 60) return "Just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        return `${days}d`;
    }

    function getTypeLabel(type: string): string {
        return type === "url" ? "URL" : "Text";
    }
</script>

<main class="panel" role="application" aria-label="ClipStack Clipboard Menu">
    <header class="toolbar">
        <div class="title-area">
            <h1>ClipStack</h1>
            <p>{allItems.length} items</p>
        </div>
        <button
            class="close-button"
            type="button"
            on:click={closePopover}
            aria-label="Close popup"
        >
            ×
        </button>
    </header>

    <div class="search-row">
        <input
            bind:this={searchInput}
            type="text"
            value={searchText}
            placeholder="Search clipboard"
            aria-label="Search clipboard history"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            on:input={onSearchInput}
        />
        {#if searchText.trim().length > 0}
            <button
                class="clear-search"
                type="button"
                on:click={() => {
                    searchText = "";
                    applyFilter();
                    searchInput?.focus();
                }}
                aria-label="Clear search"
            >
                Clear
            </button>
        {/if}
    </div>

    <section class="list" role="list">
        {#if filteredItems.length === 0}
            <div class="empty-state">
                <p class="empty-title">No clipboard history</p>
                <p class="empty-subtitle">Copy text and it will appear here.</p>
            </div>
        {:else}
            {#each filteredItems as item (item.id)}
                <article class="item" role="listitem">
                    <button
                        class="item-copy"
                        type="button"
                        on:click={() => handleCopy(item)}
                        aria-label={`Copy ${item.content.substring(0, 80)}`}
                    >
                        <p class="item-text">{item.content}</p>
                        <p class="item-meta">
                            {getTypeLabel(item.content_type)} · {getRelativeTime(
                                item.created_at,
                            )}
                        </p>
                    </button>
                    <button
                        class="item-delete"
                        type="button"
                        on:click={() => handleDelete(item)}
                        aria-label="Delete item"
                    >
                        ×
                    </button>
                </article>
            {/each}
        {/if}
    </section>

    <footer class="footer">
        <button
            class="clear-all"
            type="button"
            disabled={allItems.length === 0}
            on:click={handleClearAll}
        >
            Clear All
        </button>
        <span>Esc closes</span>
    </footer>
</main>

<style>
    :global(html),
    :global(body) {
        margin: 0;
        padding: 0;
        height: 100%;
    }

    :global(body) {
        background: transparent;
        font-family:
            "SF Pro Text",
            -apple-system,
            BlinkMacSystemFont,
            "Helvetica Neue",
            sans-serif;
        -webkit-font-smoothing: antialiased;
        overflow: hidden;
    }

    .panel {
        width: 392px;
        max-height: 540px;
        display: flex;
        flex-direction: column;
        background: rgba(246, 246, 246, 0.88);
        backdrop-filter: blur(42px) saturate(170%);
        -webkit-backdrop-filter: blur(42px) saturate(170%);
        border-radius: 14px;
        border: 0.5px solid rgba(0, 0, 0, 0.12);
        box-shadow:
            0 1px 1px rgba(0, 0, 0, 0.14),
            0 14px 40px rgba(0, 0, 0, 0.2);
        overflow: hidden;
        animation: open 0.16s ease-out;
    }

    :global(html.dark) .panel {
        background: rgba(34, 34, 34, 0.86);
        border-color: rgba(255, 255, 255, 0.1);
        box-shadow:
            0 1px 1px rgba(0, 0, 0, 0.32),
            0 14px 42px rgba(0, 0, 0, 0.52);
    }

    @keyframes open {
        from {
            opacity: 0;
            transform: translateY(-6px) scale(0.985);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    .toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 14px 8px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }

    :global(html.dark) .toolbar {
        border-bottom-color: rgba(255, 255, 255, 0.08);
    }

    .title-area h1 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.82);
        line-height: 1.1;
    }

    .title-area p {
        margin: 2px 0 0;
        font-size: 11px;
        color: rgba(0, 0, 0, 0.42);
    }

    :global(html.dark) .title-area h1 {
        color: rgba(255, 255, 255, 0.9);
    }

    :global(html.dark) .title-area p {
        color: rgba(255, 255, 255, 0.42);
    }

    .close-button {
        border: none;
        background: rgba(0, 0, 0, 0.08);
        color: rgba(0, 0, 0, 0.56);
        width: 24px;
        height: 24px;
        border-radius: 999px;
        font-size: 16px;
        line-height: 1;
        cursor: pointer;
        padding: 0;
    }

    .close-button:hover {
        background: rgba(0, 0, 0, 0.14);
    }

    :global(html.dark) .close-button {
        background: rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.7);
    }

    :global(html.dark) .close-button:hover {
        background: rgba(255, 255, 255, 0.18);
    }

    .search-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }

    :global(html.dark) .search-row {
        border-bottom-color: rgba(255, 255, 255, 0.08);
    }

    .search-row input {
        flex: 1;
        min-width: 0;
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 10px;
        padding: 7px 10px;
        font-size: 13px;
        background: rgba(255, 255, 255, 0.84);
        color: rgba(0, 0, 0, 0.86);
        outline: none;
    }

    .search-row input:focus {
        border-color: rgba(0, 122, 255, 0.55);
        box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.16);
    }

    :global(html.dark) .search-row input {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.14);
        color: rgba(255, 255, 255, 0.9);
    }

    :global(html.dark) .search-row input:focus {
        border-color: rgba(10, 132, 255, 0.65);
        box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.22);
    }

    .clear-search {
        border: none;
        background: transparent;
        color: #007aff;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        padding: 0;
    }

    :global(html.dark) .clear-search {
        color: #0a84ff;
    }

    .list {
        flex: 1;
        overflow-y: auto;
        overscroll-behavior: contain;
        max-height: 420px;
    }

    .list::-webkit-scrollbar {
        width: 6px;
    }

    .list::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.18);
        border-radius: 6px;
    }

    :global(html.dark) .list::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
    }

    .empty-state {
        padding: 54px 18px;
        text-align: center;
    }

    .empty-title {
        margin: 0;
        color: rgba(0, 0, 0, 0.62);
        font-size: 14px;
        font-weight: 520;
    }

    .empty-subtitle {
        margin: 6px 0 0;
        color: rgba(0, 0, 0, 0.38);
        font-size: 12px;
    }

    :global(html.dark) .empty-title {
        color: rgba(255, 255, 255, 0.64);
    }

    :global(html.dark) .empty-subtitle {
        color: rgba(255, 255, 255, 0.36);
    }

    .item {
        display: flex;
        align-items: stretch;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }

    :global(html.dark) .item {
        border-bottom-color: rgba(255, 255, 255, 0.06);
    }

    .item-copy {
        flex: 1;
        min-width: 0;
        border: none;
        background: transparent;
        text-align: left;
        cursor: pointer;
        padding: 10px 12px;
    }

    .item-copy:hover {
        background: rgba(0, 0, 0, 0.04);
    }

    :global(html.dark) .item-copy:hover {
        background: rgba(255, 255, 255, 0.06);
    }

    .item-text {
        margin: 0;
        color: rgba(0, 0, 0, 0.84);
        font-size: 13px;
        line-height: 1.35;
        display: -webkit-box;
        line-clamp: 2;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        word-break: break-word;
    }

    :global(html.dark) .item-text {
        color: rgba(255, 255, 255, 0.9);
    }

    .item-meta {
        margin: 4px 0 0;
        color: rgba(0, 0, 0, 0.44);
        font-size: 11px;
    }

    :global(html.dark) .item-meta {
        color: rgba(255, 255, 255, 0.42);
    }

    .item-delete {
        width: 32px;
        border: none;
        background: transparent;
        color: rgba(0, 0, 0, 0.3);
        cursor: pointer;
        font-size: 15px;
        line-height: 1;
        padding: 0;
    }

    .item-delete:hover {
        color: #ff3b30;
        background: rgba(255, 59, 48, 0.08);
    }

    :global(html.dark) .item-delete {
        color: rgba(255, 255, 255, 0.3);
    }

    :global(html.dark) .item-delete:hover {
        color: #ff453a;
        background: rgba(255, 69, 58, 0.15);
    }

    .footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 9px 12px;
        border-top: 1px solid rgba(0, 0, 0, 0.07);
        background: rgba(0, 0, 0, 0.02);
    }

    :global(html.dark) .footer {
        border-top-color: rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.03);
    }

    .clear-all {
        border: none;
        border-radius: 8px;
        background: rgba(255, 59, 48, 0.09);
        color: #d70015;
        font-size: 12px;
        font-weight: 600;
        padding: 6px 10px;
        cursor: pointer;
    }

    .clear-all:disabled {
        opacity: 0.4;
        cursor: default;
    }

    .clear-all:not(:disabled):hover {
        background: rgba(255, 59, 48, 0.16);
    }

    :global(html.dark) .clear-all {
        background: rgba(255, 69, 58, 0.18);
        color: #ff8d86;
    }

    .footer span {
        color: rgba(0, 0, 0, 0.4);
        font-size: 11px;
    }

    :global(html.dark) .footer span {
        color: rgba(255, 255, 255, 0.38);
    }
</style>
