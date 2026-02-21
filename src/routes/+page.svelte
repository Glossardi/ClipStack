<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { invoke } from "@tauri-apps/api/core";
    import { listen } from "@tauri-apps/api/event";
    import { getCurrentWindow } from "@tauri-apps/api/window";
    import { checkForUpdatesOnStartup } from "$lib/updater.js";
    import {
        getRelativeTime,
        getTypeLabel,
        type ClipItem,
    } from "$lib/clipboard";

    const appWindow = getCurrentWindow();

    let allItems: ClipItem[] = [];
    let selectedIndex = -1;
    let copiedItemId: string | null = null;
    let deletingItemId: string | null = null;
    let copyFeedbackTimeout: ReturnType<typeof setTimeout> | null = null;
    let deleteFeedbackTimeout: ReturnType<typeof setTimeout> | null = null;

    let relativeTimeInterval: ReturnType<typeof setInterval> | null = null;
    let refreshInFlight = false;
    let unlistenFocus: (() => void) | null = null;
    let unlistenClipboardUpdated: (() => void) | null = null;
    let darkModeListener: ((event: MediaQueryListEvent) => void) | null = null;
    let colorSchemeMedia: MediaQueryList | null = null;
    let relativeTimeTick = Date.now();

    const RELATIVE_TIME_REFRESH_MS = 30_000;

    onMount(async () => {
        applyColorScheme();
        void checkForUpdatesOnStartup();

        colorSchemeMedia = window.matchMedia("(prefers-color-scheme: dark)");
        darkModeListener = () => applyColorScheme();
        colorSchemeMedia.addEventListener("change", darkModeListener);

        await refreshItems();

        unlistenClipboardUpdated = await listen("clipboard-updated", async () => {
            void refreshItems();
        });

        relativeTimeInterval = setInterval(() => {
            relativeTimeTick = Date.now();
        }, RELATIVE_TIME_REFRESH_MS);

        unlistenFocus = await listen("tauri://focus", async () => {
            await refreshItems();
        });

        window.addEventListener("keydown", handleKeydown);
    });

    onDestroy(() => {
        if (relativeTimeInterval !== null) {
            clearInterval(relativeTimeInterval);
        }

        if (unlistenFocus) {
            unlistenFocus();
        }
        if (unlistenClipboardUpdated) {
            unlistenClipboardUpdated();
        }

        window.removeEventListener("keydown", handleKeydown);
        if (copyFeedbackTimeout) {
            clearTimeout(copyFeedbackTimeout);
        }
        if (deleteFeedbackTimeout) {
            clearTimeout(deleteFeedbackTimeout);
        }

        if (colorSchemeMedia && darkModeListener) {
            colorSchemeMedia.removeEventListener("change", darkModeListener);
        }
    });

    function applyColorScheme() {
        const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.classList.toggle("dark", dark);
    }

    async function refreshItems() {
        if (refreshInFlight) return;
        refreshInFlight = true;

        try {
            const items = await invoke<ClipItem[]>("get_clipboard_items");
            allItems = items;

            if (allItems.length === 0) {
                selectedIndex = -1;
            } else if (selectedIndex >= allItems.length) {
                selectedIndex = allItems.length - 1;
            }
        } catch (error) {
            console.error("Failed to refresh clipboard items:", error);
        } finally {
            refreshInFlight = false;
        }
    }

    async function handleCopy(item: ClipItem) {
        try {
            await invoke("copy_to_clipboard", { content: item.content });
            copiedItemId = item.id;
            if (copyFeedbackTimeout) {
                clearTimeout(copyFeedbackTimeout);
            }
            copyFeedbackTimeout = setTimeout(() => {
                copiedItemId = null;
            }, 2200);
        } catch (error) {
            console.error("Failed to copy clipboard item:", error);
        }
    }

    async function handleDelete(item: ClipItem) {
        deletingItemId = item.id;
        if (deleteFeedbackTimeout) {
            clearTimeout(deleteFeedbackTimeout);
        }

        try {
            await invoke("delete_clipboard_item", { id: item.id });
            await refreshItems();
        } catch (error) {
            console.error("Failed to delete clipboard item:", error);
        } finally {
            deleteFeedbackTimeout = setTimeout(() => {
                deletingItemId = null;
            }, 350);
        }
    }

    async function closePopover() {
        await appWindow.hide();
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Escape") {
            void closePopover();
            return;
        }

        if (event.key === "ArrowDown") {
            if (allItems.length === 0) return;
            event.preventDefault();
            selectedIndex =
                (selectedIndex + 1 + allItems.length) % allItems.length;
            return;
        }

        if (event.key === "ArrowUp") {
            if (allItems.length === 0) return;
            event.preventDefault();
            selectedIndex =
                (selectedIndex - 1 + allItems.length) % allItems.length;
            return;
        }

        if (event.key === "Enter") {
            if (selectedIndex < 0 || selectedIndex >= allItems.length) return;
            event.preventDefault();
            void handleCopy(allItems[selectedIndex]);
            return;
        }
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
            <span aria-hidden="true">×</span>
        </button>
    </header>

    <section class="list" role="list">
        {#if allItems.length === 0}
            <div class="empty-state">
                <p class="empty-title">No clipboard history</p>
                <p class="empty-subtitle">Copy text and it will appear here.</p>
            </div>
        {:else}
            {#each allItems as item (item.id)}
                <article class="item" role="listitem">
                    <button
                        class="item-copy"
                        class:copied={copiedItemId === item.id}
                        type="button"
                        on:click={() => handleCopy(item)}
                        aria-label={`Copy ${item.content.substring(0, 80)}`}
                    >
                        <p class="item-text">{item.content}</p>
                        <p class="item-meta">
                            {getTypeLabel(item.content_type)} · {getRelativeTime(
                                item.created_at,
                                relativeTimeTick,
                            )}
                            {#if copiedItemId === item.id}
                                · Copied
                            {/if}
                        </p>
                    </button>
                    <button
                        class="item-delete"
                        class:deleting={deletingItemId === item.id}
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
        background: #f8f8fa;
        backdrop-filter: blur(16px) saturate(112%);
        -webkit-backdrop-filter: blur(16px) saturate(112%);
        border-radius: 14px;
        border: 1px solid rgba(0, 0, 0, 0.12);
        box-shadow: none;
        overflow: hidden;
        animation: open 0.16s ease-out;
    }

    :global(html.dark) .panel {
        background: #27272b;
        border-color: rgba(255, 255, 255, 0.11);
        box-shadow: none;
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
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        color: rgba(0, 0, 0, 0.56);
        cursor: pointer;
        padding: 2px 4px;
    }

    .close-button span {
        display: block;
        font-size: 17px;
        line-height: 1;
        transform: translateY(0);
    }

    .close-button:hover {
        color: rgba(0, 0, 0, 0.8);
    }

    :global(html.dark) .close-button {
        color: rgba(255, 255, 255, 0.72);
    }

    :global(html.dark) .close-button:hover {
        color: rgba(255, 255, 255, 0.94);
    }

    .list {
        flex: 1;
        overflow-y: auto;
        overscroll-behavior: contain;
        max-height: 174px;
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
        position: relative;
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
        padding: 10px 34px 10px 12px;
        transition:
            background-color 120ms ease,
            transform 120ms ease;
    }

    .item-copy:hover {
        background: rgba(0, 0, 0, 0.04);
        transform: translateY(-1px);
    }

    :global(html.dark) .item-copy:hover {
        background: rgba(255, 255, 255, 0.06);
    }

    .item-copy.copied {
        background: rgba(52, 199, 89, 0.16);
    }

    :global(html.dark) .item-copy.copied {
        background: rgba(48, 209, 88, 0.2);
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
        position: absolute;
        top: 9px;
        right: 8px;
        border: none;
        background: transparent;
        color: rgba(0, 0, 0, 0.3);
        cursor: pointer;
        font-size: 14px;
        line-height: 1;
        padding: 2px;
    }

    .item-delete:hover {
        color: rgba(0, 0, 0, 0.48);
    }

    :global(html.dark) .item-delete {
        color: rgba(255, 255, 255, 0.3);
    }

    :global(html.dark) .item-delete:hover {
        color: rgba(255, 255, 255, 0.52);
    }

    .item-delete.deleting {
        color: #ff3b30;
    }

    :global(html.dark) .item-delete.deleting {
        color: #ff453a;
    }
</style>
